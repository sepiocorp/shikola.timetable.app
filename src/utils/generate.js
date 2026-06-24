function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
}

function getTeacherTotalCount(teacherDailyCount, teacherId) {
  const dayMap = teacherDailyCount[teacherId] || {}
  return Object.values(dayMap).reduce((a, b) => a + b, 0)
}

function pickLeastBusyTeacher(teachers, teacherDailyCount) {
  return teachers.reduce((least, current) => {
    const leastCount = getTeacherTotalCount(teacherDailyCount, least.id)
    const currentCount = getTeacherTotalCount(teacherDailyCount, current.id)
    return currentCount < leastCount ? current : least
  })
}

function isTeacherOffDay(teacher, day, teacherDayOff) {
  const offDays = teacherDayOff?.[teacher.id]
  if (!offDays) return false
  return offDays.includes(day)
}

/**
 * Generate timetable entries for specified classes (or all classes).
 *
 * @param {Object} params
 * @param {Array} params.classes - All classes
 * @param {Array} params.teachers - All teachers
 * @param {Array} params.subjects - All subjects
 * @param {Array} params.rooms - All rooms
 * @param {Array} params.days - School days (default schedule, used when class has no section)
 * @param {Array} params.periods - All periods (including breaks, default schedule)
 * @param {Array|null} params.classIds - Class IDs to generate for, or null for all
 * @param {Array} params.existingEntries - Entries for classes NOT being regenerated (kept as-is for conflict awareness)
 * @param {Object} params.subjectWeights - Optional: { subjectId: periodsPerWeek } to control subject frequency
 * @param {Object} params.teacherDayOff - Optional: { teacherId: [day1, day2, ...] } for teacher day-off preferences
 * @param {boolean} params.avoidSameSubjectDaily - Prefer not repeating a subject on the same day for a class (default true)
 * @param {boolean} params.balanceTeacherLoad - Prefer least-busy teacher for each assignment (default true)
 * @param {number} params.maxRetries - Number of retry attempts with reshuffled data (default 3)
 * @param {Function} params.onProgress - Progress callback (current, total)
 * @param {Function} params.getScheduleForClassFn - Optional: (classId) => { days, periods } for per-class schedules
 * @returns {Object} { entries, stats }
 */
export function generateTimetable({
  classes,
  teachers,
  subjects,
  rooms,
  days,
  periods,
  classIds = null,
  existingEntries = [],
  subjectWeights = null,
  teacherDayOff = null,
  avoidSameSubjectDaily = true,
  balanceTeacherLoad = true,
  maxRetries = 3,
  onProgress = null,
  getScheduleForClassFn = null,
}) {
  const globalTeachingPeriods = periods.filter(p => !p.isBreak)
  const targetClasses = classIds
    ? classes.filter(c => classIds.includes(c.id))
    : classes

  // Track occupancy across all classes (including existing entries for non-target classes)
  const teacherBusy = {} // `${day}-${periodId}` -> Set of teacherIds
  const roomBusy = {} // `${day}-${periodId}` -> Set of roomIds
  const teacherDailyCount = {} // teacherId -> { day -> count }

  // Seed occupancy from existing entries (for classes not being regenerated)
  for (const e of existingEntries) {
    const slotKey = `${e.day}-${e.periodId}`
    if (e.teacherId) {
      if (!teacherBusy[slotKey]) teacherBusy[slotKey] = new Set()
      teacherBusy[slotKey].add(e.teacherId)
      if (!teacherDailyCount[e.teacherId]) teacherDailyCount[e.teacherId] = {}
      teacherDailyCount[e.teacherId][e.day] = (teacherDailyCount[e.teacherId][e.day] || 0) + 1
    }
    if (e.secondaryTeacherId) {
      if (!teacherBusy[slotKey]) teacherBusy[slotKey] = new Set()
      teacherBusy[slotKey].add(e.secondaryTeacherId)
      if (!teacherDailyCount[e.secondaryTeacherId]) teacherDailyCount[e.secondaryTeacherId] = {}
      teacherDailyCount[e.secondaryTeacherId][e.day] = (teacherDailyCount[e.secondaryTeacherId][e.day] || 0) + 1
    }
    if (e.roomId) {
      if (!roomBusy[slotKey]) roomBusy[slotKey] = new Set()
      roomBusy[slotKey].add(e.roomId)
    }
  }

  const entries = []
  const stats = {
    totalSlots: 0,
    filledSlots: 0,
    skippedSlots: 0,
    classesProcessed: 0,
    conflicts: [],
  }

  const totalClasses = targetClasses.length
  let classIndex = 0

  // Build subject list based on weights or even distribution
  function buildSubjectList(slotsLength, teachableSubjects) {
    const shuffledSubjects = [...teachableSubjects]
    shuffleArray(shuffledSubjects)

    if (subjectWeights) {
      // Use user-specified weights (periods per week per subject)
      const list = []
      for (const subj of shuffledSubjects) {
        const weight = subjectWeights[subj.id]
        if (weight && weight > 0) {
          for (let i = 0; i < weight; i++) {
            list.push(subj)
          }
        }
      }
      // If weighted total < slots, fill remainder with even distribution
      if (list.length < slotsLength) {
        const remainder = slotsLength - list.length
        const evenPerSubject = Math.floor(remainder / shuffledSubjects.length)
        const extra = remainder % shuffledSubjects.length
        for (let i = 0; i < shuffledSubjects.length; i++) {
          const count = evenPerSubject + (i < extra ? 1 : 0)
          for (let j = 0; j < count; j++) {
            list.push(shuffledSubjects[i])
          }
        }
      }
      // Trim if over
      if (list.length > slotsLength) {
        list.length = slotsLength
      }
      shuffleArray(list)
      return list
    }

    // Even distribution
    const list = []
    const slotsPerSubject = Math.floor(slotsLength / shuffledSubjects.length)
    const remainder = slotsLength % shuffledSubjects.length
    for (let i = 0; i < shuffledSubjects.length; i++) {
      const count = slotsPerSubject + (i < remainder ? 1 : 0)
      for (let j = 0; j < count; j++) {
        list.push(shuffledSubjects[i])
      }
    }
    shuffleArray(list)
    return list
  }

  // Generate entries for a single class (one attempt)
  function generateForClass(cls, teachableSubjects, availableTeachers, slots, classTeachingPeriods) {
    const subjectList = buildSubjectList(slots.length, teachableSubjects)
    const filledSlotsSet = new Set()
    const classEntries = []

    // Copy occupancy state for this attempt (seeded from existing + prior classes)
    const localTeacherBusy = {}
    const localRoomBusy = {}
    const localTeacherDailyCount = {}

    // Deep copy seed state
    for (const key in teacherBusy) localTeacherBusy[key] = new Set(teacherBusy[key])
    for (const key in roomBusy) localRoomBusy[key] = new Set(roomBusy[key])
    for (const tid in teacherDailyCount) {
      localTeacherDailyCount[tid] = { ...teacherDailyCount[tid] }
    }

    for (const subject of subjectList) {
      let bestSlot = null
      let bestTeacher = null
      let bestScore = -1

      for (const slot of slots) {
        const slotKey = `${slot.day}-${slot.periodId}`
        if (filledSlotsSet.has(slotKey)) continue

        const candidateTeachers = availableTeachers.filter(t =>
          t.subjects.includes(subject.id) &&
          !isTeacherOffDay(t, slot.day, teacherDayOff) &&
          !(localTeacherBusy[slotKey] || new Set()).has(t.id) &&
          (localTeacherDailyCount[t.id]?.[slot.day] || 0) < (t.maxPeriods || 6)
        )

        if (candidateTeachers.length === 0) continue

        // Score this slot: prefer days where subject hasn't appeared yet
        let score = 1
        if (avoidSameSubjectDaily) {
          const sameSubjectOnDay = classEntries.some(
            e => e.day === slot.day && e.subjectId === subject.id
          )
          if (!sameSubjectOnDay) score += 10
        }

        // Prefer earlier periods for "heavier" subjects (heuristic: first in list)
        const periodIndex = classTeachingPeriods.findIndex(p => p.id === slot.periodId)
        score += (classTeachingPeriods.length - periodIndex) * 0.1

        if (score > bestScore) {
          bestScore = score
          bestSlot = slot
          bestTeacher = balanceTeacherLoad
            ? pickLeastBusyTeacher(candidateTeachers, localTeacherDailyCount)
            : candidateTeachers[0]
        }
      }

      if (bestSlot && bestTeacher) {
        const slotKey = `${bestSlot.day}-${bestSlot.periodId}`

        const candidateRooms = rooms.filter(r =>
          !(localRoomBusy[slotKey] || new Set()).has(r.id)
        )
        const room = candidateRooms.length > 0
          ? candidateRooms[Math.floor(Math.random() * candidateRooms.length)]
          : null

        const entry = {
          id: genId(),
          day: bestSlot.day,
          periodId: bestSlot.periodId,
          teacherId: bestTeacher.id,
          classId: cls.id,
          subjectId: subject.id,
          roomId: room?.id || '',
          secondaryClassId: '',
          secondarySubjectId: '',
          secondaryTeacherId: '',
        }

        // Handle optional subject: assign secondary class subject+teacher
        if (subject.isOptional && subject.secondaryClassId) {
          const secondaryClassId = subject.secondaryClassId
          // Pick a different subject for the secondary class
          const secondarySubjectCandidates = teachableSubjects.filter(s =>
            s.id !== subject.id &&
            availableTeachers.some(t =>
              t.subjects.includes(s.id) &&
              !isTeacherOffDay(t, bestSlot.day, teacherDayOff) &&
              !(localTeacherBusy[slotKey] || new Set()).has(t.id) &&
              (localTeacherDailyCount[t.id]?.[bestSlot.day] || 0) < (t.maxPeriods || 6)
            )
          )

          if (secondarySubjectCandidates.length > 0) {
            const secondarySubject = secondarySubjectCandidates[Math.floor(Math.random() * secondarySubjectCandidates.length)]
            const secondaryTeacherCandidates = availableTeachers.filter(t =>
              t.subjects.includes(secondarySubject.id) &&
              !isTeacherOffDay(t, bestSlot.day, teacherDayOff) &&
              !(localTeacherBusy[slotKey] || new Set()).has(t.id) &&
              (localTeacherDailyCount[t.id]?.[bestSlot.day] || 0) < (t.maxPeriods || 6)
            )
            if (secondaryTeacherCandidates.length > 0) {
              const secondaryTeacher = balanceTeacherLoad
                ? pickLeastBusyTeacher(secondaryTeacherCandidates, localTeacherDailyCount)
                : secondaryTeacherCandidates[0]
              entry.secondaryClassId = secondaryClassId
              entry.secondarySubjectId = secondarySubject.id
              entry.secondaryTeacherId = secondaryTeacher.id

              // Track secondary teacher occupancy
              if (!localTeacherBusy[slotKey]) localTeacherBusy[slotKey] = new Set()
              localTeacherBusy[slotKey].add(secondaryTeacher.id)
              if (!localTeacherDailyCount[secondaryTeacher.id]) localTeacherDailyCount[secondaryTeacher.id] = {}
              localTeacherDailyCount[secondaryTeacher.id][bestSlot.day] =
                (localTeacherDailyCount[secondaryTeacher.id][bestSlot.day] || 0) + 1
            }
          }
        }

        classEntries.push(entry)

        filledSlotsSet.add(slotKey)

        if (!localTeacherBusy[slotKey]) localTeacherBusy[slotKey] = new Set()
        localTeacherBusy[slotKey].add(bestTeacher.id)
        if (room) {
          if (!localRoomBusy[slotKey]) localRoomBusy[slotKey] = new Set()
          localRoomBusy[slotKey].add(room.id)
        }
        if (!localTeacherDailyCount[bestTeacher.id]) localTeacherDailyCount[bestTeacher.id] = {}
        localTeacherDailyCount[bestTeacher.id][bestSlot.day] =
          (localTeacherDailyCount[bestTeacher.id][bestSlot.day] || 0) + 1
      }
    }

    return { classEntries, filledSlotsSet, slots }
  }

  for (const cls of targetClasses) {
    classIndex++
    if (onProgress) onProgress(classIndex, totalClasses)

    const availableTeachers = teachers.filter(t => t.subjects && t.subjects.length > 0)
    const teachableSubjects = subjects.filter(s =>
      availableTeachers.some(t => t.subjects.includes(s.id))
    )

    if (teachableSubjects.length === 0) {
      stats.classesProcessed++
      continue
    }

    // Determine this class's schedule (per-section or global)
    let classDays = days
    let classTeachingPeriods = globalTeachingPeriods
    if (getScheduleForClassFn) {
      const schedule = getScheduleForClassFn(cls.id)
      if (schedule && schedule.days && schedule.periods) {
        classDays = schedule.days
        classTeachingPeriods = schedule.periods.filter(p => !p.isBreak)
      }
    }

    const slots = []
    for (const day of classDays) {
      for (const period of classTeachingPeriods) {
        slots.push({ day, periodId: period.id })
      }
    }

    stats.totalSlots += slots.length

    // Retry loop: try multiple times and keep the best result
    let bestResult = null
    let bestFillCount = -1

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const result = generateForClass(cls, teachableSubjects, availableTeachers, slots, classTeachingPeriods)
      const fillCount = result.filledSlotsSet.size
      if (fillCount > bestFillCount) {
        bestFillCount = fillCount
        bestResult = result
      }
      if (fillCount === slots.length) break // perfect fill, no need to retry
    }

    // Commit the best result to global occupancy
    for (const entry of bestResult.classEntries) {
      entries.push(entry)
      const slotKey = `${entry.day}-${entry.periodId}`
      if (!teacherBusy[slotKey]) teacherBusy[slotKey] = new Set()
      teacherBusy[slotKey].add(entry.teacherId)
      if (entry.secondaryTeacherId) {
        teacherBusy[slotKey].add(entry.secondaryTeacherId)
        if (!teacherDailyCount[entry.secondaryTeacherId]) teacherDailyCount[entry.secondaryTeacherId] = {}
        teacherDailyCount[entry.secondaryTeacherId][entry.day] =
          (teacherDailyCount[entry.secondaryTeacherId][entry.day] || 0) + 1
      }
      if (entry.roomId) {
        if (!roomBusy[slotKey]) roomBusy[slotKey] = new Set()
        roomBusy[slotKey].add(entry.roomId)
      }
      if (!teacherDailyCount[entry.teacherId]) teacherDailyCount[entry.teacherId] = {}
      teacherDailyCount[entry.teacherId][entry.day] =
        (teacherDailyCount[entry.teacherId][entry.day] || 0) + 1
    }
    stats.filledSlots += bestResult.classEntries.length

    // Track unfilled slots
    const unfilledCount = slots.length - bestResult.classEntries.length
    if (unfilledCount > 0) {
      stats.skippedSlots += unfilledCount
      stats.conflicts.push({
        className: cls.name,
        unfilled: unfilledCount,
        total: slots.length,
      })
    }

    stats.classesProcessed++
  }

  return { entries, stats }
}

/**
 * Check if the system has enough data to generate timetables.
 */
export function canGenerate(state) {
  const issues = []
  if (state.classes.length === 0) issues.push('No classes added')
  if (state.teachers.length === 0) issues.push('No teachers added')
  if (state.subjects.length === 0) issues.push('No subjects added')

  const teachersWithSubjects = state.teachers.filter(t => t.subjects && t.subjects.length > 0)
  if (state.teachers.length > 0 && teachersWithSubjects.length === 0) {
    issues.push('No teachers have subjects assigned')
  }

  const teachableSubjects = state.subjects.filter(s =>
    teachersWithSubjects.some(t => t.subjects.includes(s.id))
  )
  if (state.subjects.length > 0 && teachableSubjects.length === 0) {
    issues.push('No subjects have qualified teachers')
  }

  return {
    canGenerate: issues.length === 0,
    issues,
  }
}
