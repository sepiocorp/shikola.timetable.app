function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function getPeriodTime(schedule, periodId, fallbackPeriods) {
  const periods = schedule?.periods || fallbackPeriods
  const period = periods?.find(p => p.id === periodId)
  return period ? { start: period.start, end: period.end } : null
}

function makeConflictSlotKey(day, periodStart, periodEnd, periodId) {
  // Use actual wall-clock time for conflict keys so different sections/
  // sessions (e.g. morning vs afternoon vs full-day) only conflict when they
  // share the exact same start/end time. Falls back to periodId when time data
  // is unavailable. (Aligned school periods are fully supported; partial overlaps
  // between differently-offset sections would need a range-overlap check.)
  return (periodStart && periodEnd)
    ? `${day}|${periodStart}|${periodEnd}`
    : `${day}-${periodId}`
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

function isTeacherOffPeriod(teacher, day, periodId, teacherTimeOff) {
  // Check inline availability grid (from ManageTeachers)
  if (teacher.availability) {
    const key = `${day}-${periodId}`
    if (teacher.availability[key] === false) return true
  }
  // Check legacy teacherTimeOff state
  const timeOff = teacherTimeOff?.[teacher.id]
  if (!timeOff) return false
  if (timeOff.daysOff && timeOff.daysOff.includes(day)) return true
  if (timeOff.periodsOff) {
    const key = `${day}-${periodId}`
    if (timeOff.periodsOff.includes(key)) return true
  }
  return false
}

function checkTeacherConstraints(teacher, day, periodId, classEntries, localTeacherDailyCount, teachingPeriods, teacherConstraints) {
  // Check inline constraints on teacher object (from ManageTeachers)
  const dayCount = (localTeacherDailyCount[teacher.id]?.[day] || 0)
  const maxLessonsPerDay = teacher.maxLessonsPerDay || (teacherConstraints?.[teacher.id]?.maxLessonsPerDay)
  if (maxLessonsPerDay && dayCount >= maxLessonsPerDay) return false
  if (teacher.maxPeriods && dayCount >= teacher.maxPeriods) return false

  // Max consecutive periods
  const maxConsec = teacher.maxConsecutivePeriods || (teacherConstraints?.[teacher.id]?.maxConsecutivePeriods)
  if (maxConsec) {
    const periodIndex = teachingPeriods.findIndex(p => p.id === periodId)
    const dayPeriods = classEntries
      .filter(e => e.teacherId === teacher.id && e.day === day)
      .map(e => teachingPeriods.findIndex(p => p.id === e.periodId))
      .filter(idx => idx >= 0)
      .sort((a, b) => a - b)
    let consecutive = 1
    for (let i = dayPeriods.length - 1; i >= 0; i--) {
      if (dayPeriods[i] === periodIndex - 1) consecutive++
      else break
    }
    if (consecutive >= maxConsec) return false
  }

  // Max teaching days
  const maxDays = teacher.maxTeachingDays || (teacherConstraints?.[teacher.id]?.maxTeachingDays)
  if (maxDays) {
    const teachingDays = new Set()
    for (const e of classEntries) {
      if (e.teacherId === teacher.id) teachingDays.add(e.day)
    }
    // Also count from localTeacherDailyCount
    for (const d in localTeacherDailyCount[teacher.id] || {}) {
      if (localTeacherDailyCount[teacher.id][d] > 0) teachingDays.add(d)
    }
    if (!teachingDays.has(day) && teachingDays.size >= maxDays) return false
  }

  return true
}

function checkCardRelationships(subject, slot, classEntries, cardRelationships, cls) {
  if (!cardRelationships || cardRelationships.length === 0) return true
  for (const rel of cardRelationships) {
    // Filter by class if specified
    if (rel.classId && cls && rel.classId !== cls.id) continue

    // Support both new field names (subjectId/relatedSubjectId) and old (subjectId1/subjectId2)
    const subjId = rel.subjectId || rel.subjectId1
    const relatedId = rel.relatedSubjectId || rel.subjectId2

    if (subjId !== subject.id) continue

    if (rel.type === 'not_same_day' && relatedId) {
      const sameDayEntries = classEntries.filter(e => e.day === slot.day && e.subjectId === relatedId)
      if (sameDayEntries.length > 0) return false
    }
    if (rel.type === 'same_day' && relatedId) {
      const sameDayEntries = classEntries.filter(e => e.day === slot.day && e.subjectId === relatedId)
      if (sameDayEntries.length === 0) {
        const otherDayEntries = classEntries.filter(e => e.subjectId === relatedId)
        if (otherDayEntries.length > 0 && !otherDayEntries.some(e => e.day === slot.day)) return false
      }
    }
    if (rel.type === 'max_per_day') {
      const dayCount = classEntries.filter(e => e.day === slot.day && e.subjectId === subject.id).length
      if (dayCount >= (rel.maxPerDay || 1)) return false
    }
    if (rel.type === 'spread') {
      const minGap = rel.minDayGap || 1
      const subjectDays = classEntries
        .filter(e => e.subjectId === subject.id)
        .map(e => e.day)
      const dayIdx = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].indexOf(slot.day)
      for (const d of subjectDays) {
        const dIdx = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].indexOf(d)
        if (Math.abs(dayIdx - dIdx) < minGap) return false
      }
    }
  }
  return true
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
  teacherTimeOff = null,
  teacherConstraints = null,
  cardRelationships = null,
  multiWeekCycle = 1,
  autoRelax = false,
  subjectAssignments = null,
}) {
  const globalTeachingPeriods = periods.filter(p => !p.isBreak)
  const targetClasses = classIds
    ? classes.filter(c => classIds.includes(c.id))
    : classes

  // Track occupancy across all classes (including existing entries for non-target classes).
  // Keys are based on actual wall-clock time (`day|start|end`) so different sections/
  // sessions (morning/afternoon/full-day) only conflict when their periods truly overlap,
  // while preventing double-booking of teachers/rooms at the same real time.
  const teacherBusy = {} // time-key -> Set of teacherIds
  const roomBusy = {} // time-key -> Set of roomIds
  const teacherDailyCount = {} // teacherId -> { day -> count }

  // Seed occupancy from existing entries (for classes not being regenerated)
  for (const e of existingEntries) {
    const schedule = getScheduleForClassFn?.(e.classId)
    const periodTime = getPeriodTime(schedule, e.periodId, periods)
    const slotKey = makeConflictSlotKey(e.day, periodTime?.start, periodTime?.end, e.periodId)
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

  // Seed locked entries so they're preserved and not overwritten
  const lockedEntryObjs = existingEntries.filter(e => e.locked)
  const entries = [...lockedEntryObjs]
  const stats = {
    totalSlots: 0,
    filledSlots: 0,
    skippedSlots: 0,
    classesProcessed: 0,
    conflicts: [],
  }

  const totalClasses = targetClasses.length
  let classIndex = 0

  function patternizeRequests(requests) {
    const groups = []
    const groupMap = new Map()
    for (const request of requests) {
      const key = `${request.subject.id}-${request.teacherId || ''}`
      if (!groupMap.has(key)) {
        const group = { subject: request.subject, teacherId: request.teacherId || '', count: 0 }
        groupMap.set(key, group)
        groups.push(group)
      }
      groupMap.get(key).count++
    }

    const patterned = []
    let remaining = requests.length
    while (remaining > 0) {
      for (const group of groups) {
        if (group.count <= 0) continue
        patterned.push({ subject: group.subject, teacherId: group.teacherId })
        group.count--
        remaining--
      }
    }
    return patterned
  }

  // Build subject list based on weights, subjectAssignments, or even distribution
  function buildSubjectList(slotsLength, teachableSubjects, clsId) {
    const shuffledSubjects = [...teachableSubjects]

    // If subjectAssignments exist for this class, use them for period limits
    const classAssignments = subjectAssignments
      ? subjectAssignments.filter(a => a.classId === clsId)
      : []

    if (classAssignments.length > 0) {
      const list = []
      for (const assignment of classAssignments) {
        const subj = shuffledSubjects.find(s => s.id === assignment.subjectId)
        if (!subj) continue
        const periods = Math.max(0, Number(assignment.periodsPerWeek) || 0)
        for (let i = 0; i < periods; i++) {
          list.push({ subject: subj, teacherId: assignment.teacherId || '' })
        }
      }
      return patternizeRequests(list)
    }

    if (subjectWeights) {
      // Use user-specified weights (periods per week per subject)
      const list = []
      for (const subj of shuffledSubjects) {
        const weight = subjectWeights[subj.id]
        if (weight && weight > 0) {
          for (let i = 0; i < weight; i++) {
            list.push({ subject: subj, teacherId: '' })
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
            list.push({ subject: shuffledSubjects[i], teacherId: '' })
          }
        }
      }
      // Trim if over
      if (list.length > slotsLength) {
        list.length = slotsLength
      }
      return patternizeRequests(list)
    }

    // Even distribution
    const list = []
    if (shuffledSubjects.length === 0) return list
    const slotsPerSubject = Math.floor(slotsLength / shuffledSubjects.length)
    const remainder = slotsLength % shuffledSubjects.length
    for (let i = 0; i < shuffledSubjects.length; i++) {
      const count = slotsPerSubject + (i < remainder ? 1 : 0)
      for (let j = 0; j < count; j++) {
        list.push({ subject: shuffledSubjects[i], teacherId: '' })
      }
    }
    return patternizeRequests(list)
  }

  // Generate entries for a single class (one attempt)
  function generateForClass(cls, teachableSubjects, availableTeachers, slots, classTeachingPeriods) {
    const subjectList = buildSubjectList(slots.length, teachableSubjects, cls.id)
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

    const patternWidth = new Set(subjectList.map(request => `${request.subject.id}-${request.teacherId || ''}`)).size || 1
    const patternPeriods = Math.max(1, classTeachingPeriods.length)
    const patternDays = Math.max(1, Math.ceil(slots.length / patternPeriods))

    for (const [requestIndex, request] of subjectList.entries()) {
      const subject = request.subject
      let bestSlot = null
      let bestTeacher = null
      let bestScore = -1

      for (const slot of slots) {
        const slotKey = `${slot.day}-${slot.periodId}`
        const conflictKey = makeConflictSlotKey(slot.day, slot.start, slot.end, slot.periodId)
        if (filledSlotsSet.has(slotKey)) continue

        const candidateTeachers = availableTeachers.filter(t =>
          t.subjects.includes(subject.id) &&
          (!request.teacherId || t.id === request.teacherId) &&
          !isTeacherOffDay(t, slot.day, teacherDayOff) &&
          !isTeacherOffPeriod(t, slot.day, slot.periodId, teacherTimeOff) &&
          !(localTeacherBusy[conflictKey] || new Set()).has(t.id) &&
          (localTeacherDailyCount[t.id]?.[slot.day] || 0) < (t.maxPeriods || 6) &&
          checkTeacherConstraints(t, slot.day, slot.periodId, classEntries, localTeacherDailyCount, classTeachingPeriods, teacherConstraints)
        )

        if (candidateTeachers.length === 0) {
          if (autoRelax) {
            const relaxed = availableTeachers.filter(t =>
              t.subjects.includes(subject.id) &&
              (!request.teacherId || t.id === request.teacherId) &&
              !(localTeacherBusy[conflictKey] || new Set()).has(t.id)
            )
            if (relaxed.length === 0) continue
            candidateTeachers.length = 0
            candidateTeachers.push(...relaxed)
          } else continue
        }

        if (!checkCardRelationships(subject, slot, classEntries, cardRelationships, cls)) continue

        // Score this slot: prefer days where subject hasn't appeared yet
        const patternRound = Math.floor(requestIndex / patternWidth)
        const patternColumn = requestIndex % patternWidth
        const preferredDay = patternRound % patternDays
        const preferredPeriod = (patternColumn + Math.floor(patternRound / patternDays)) % patternPeriods
        const preferredSlotIndex = Math.min(slots.length - 1, preferredDay * patternPeriods + preferredPeriod)
        const slotIndex = slots.indexOf(slot)
        let score = 100 - Math.abs(slotIndex - preferredSlotIndex)
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
        const conflictKey = makeConflictSlotKey(bestSlot.day, bestSlot.start, bestSlot.end, bestSlot.periodId)

        const candidateRooms = rooms.filter(r =>
          !(localRoomBusy[conflictKey] || new Set()).has(r.id)
        )
        const room = candidateRooms.length > 0
          ? candidateRooms[0]
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
          lessonLength: subject.lessonLength || 1,
          lessonGroupId: '',
          locked: false,
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
              !(localTeacherBusy[conflictKey] || new Set()).has(t.id) &&
              (localTeacherDailyCount[t.id]?.[bestSlot.day] || 0) < (t.maxPeriods || 6)
            )
          )

          if (secondarySubjectCandidates.length > 0) {
            const secondarySubject = secondarySubjectCandidates[0]
            const secondaryTeacherCandidates = availableTeachers.filter(t =>
              t.subjects.includes(secondarySubject.id) &&
              !isTeacherOffDay(t, bestSlot.day, teacherDayOff) &&
              !(localTeacherBusy[conflictKey] || new Set()).has(t.id) &&
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
              if (!localTeacherBusy[conflictKey]) localTeacherBusy[conflictKey] = new Set()
              localTeacherBusy[conflictKey].add(secondaryTeacher.id)
              if (!localTeacherDailyCount[secondaryTeacher.id]) localTeacherDailyCount[secondaryTeacher.id] = {}
              localTeacherDailyCount[secondaryTeacher.id][bestSlot.day] =
                (localTeacherDailyCount[secondaryTeacher.id][bestSlot.day] || 0) + 1
            }
          }
        }

        classEntries.push(entry)

        filledSlotsSet.add(slotKey)

        if (!localTeacherBusy[conflictKey]) localTeacherBusy[conflictKey] = new Set()
        localTeacherBusy[conflictKey].add(bestTeacher.id)
        if (room) {
          if (!localRoomBusy[conflictKey]) localRoomBusy[conflictKey] = new Set()
          localRoomBusy[conflictKey].add(room.id)
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
        slots.push({ day, periodId: period.id, start: period.start, end: period.end })
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
      const schedule = getScheduleForClassFn?.(entry.classId)
      const periodTime = getPeriodTime(schedule, entry.periodId, periods)
      const conflictKey = makeConflictSlotKey(entry.day, periodTime?.start, periodTime?.end, entry.periodId)
      if (!teacherBusy[conflictKey]) teacherBusy[conflictKey] = new Set()
      teacherBusy[conflictKey].add(entry.teacherId)
      if (entry.secondaryTeacherId) {
        teacherBusy[conflictKey].add(entry.secondaryTeacherId)
        if (!teacherDailyCount[entry.secondaryTeacherId]) teacherDailyCount[entry.secondaryTeacherId] = {}
        teacherDailyCount[entry.secondaryTeacherId][entry.day] =
          (teacherDailyCount[entry.secondaryTeacherId][entry.day] || 0) + 1
      }
      if (entry.roomId) {
        if (!roomBusy[conflictKey]) roomBusy[conflictKey] = new Set()
        roomBusy[conflictKey].add(entry.roomId)
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
