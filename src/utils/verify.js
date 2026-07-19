export function verifyTimetable(state) {
  const { timetable, teachers, classes, rooms, settings, teacherTimeOff, teacherConstraints, lockedEntries } = state
  const teachingPeriods = settings.periods.filter(p => !p.isBreak)
  const issues = []
  const warnings = []

  // 1. Check for teacher double-booking
  const slotMap = {}
  for (const e of timetable) {
    const key = `${e.day}-${e.periodId}`
    if (!slotMap[key]) slotMap[key] = []
    slotMap[key].push(e)
  }

  for (const [slotKey, entries] of Object.entries(slotMap)) {
    const teacherIds = new Set()
    for (const e of entries) {
      if (e.teacherId) {
        if (teacherIds.has(e.teacherId)) {
          const teacher = teachers.find(t => t.id === e.teacherId)
          issues.push({
            type: 'teacher_conflict',
            severity: 'error',
            slot: slotKey,
            message: `Teacher ${teacher?.name || 'Unknown'} is double-booked at ${slotKey}`,
          })
        }
        teacherIds.add(e.teacherId)
      }
      if (e.secondaryTeacherId) {
        if (teacherIds.has(e.secondaryTeacherId)) {
          const teacher = teachers.find(t => t.id === e.secondaryTeacherId)
          issues.push({
            type: 'teacher_conflict',
            severity: 'error',
            slot: slotKey,
            message: `Secondary teacher ${teacher?.name || 'Unknown'} is double-booked at ${slotKey}`,
          })
        }
        teacherIds.add(e.secondaryTeacherId)
      }
    }
  }

  // 2. Check for room double-booking
  for (const [slotKey, entries] of Object.entries(slotMap)) {
    const roomIds = new Set()
    for (const e of entries) {
      if (e.roomId) {
        if (roomIds.has(e.roomId)) {
          const room = rooms.find(r => r.id === e.roomId)
          issues.push({
            type: 'room_conflict',
            severity: 'error',
            slot: slotKey,
            message: `Room ${room?.name || 'Unknown'} is double-booked at ${slotKey}`,
          })
        }
        roomIds.add(e.roomId)
      }
    }
  }

  // 3. Check teacher time off violations
  for (const e of timetable) {
    if (!e.teacherId) continue
    const timeOff = teacherTimeOff[e.teacherId]
    if (!timeOff) continue
    const dayOff = timeOff.daysOff || []
    if (dayOff.includes(e.day)) {
      const teacher = teachers.find(t => t.id === e.teacherId)
      issues.push({
        type: 'time_off_violation',
        severity: 'error',
        message: `Teacher ${teacher?.name || 'Unknown'} is scheduled on ${e.day} but marked as unavailable`,
      })
    }
    const periodOff = timeOff.periodsOff || []
    if (periodOff.includes(e.periodId)) {
      const teacher = teachers.find(t => t.id === e.teacherId)
      issues.push({
        type: 'time_off_violation',
        severity: 'error',
        message: `Teacher ${teacher?.name || 'Unknown'} is scheduled at period ${e.periodId} but marked as unavailable`,
      })
    }
  }

  // 4. Check teacher constraints
  for (const teacher of teachers) {
    const tc = teacherConstraints[teacher.id]
    if (!tc) continue
    const teacherEntries = timetable.filter(e => e.teacherId === teacher.id || e.secondaryTeacherId === teacher.id)
    const dayCount = {}
    for (const e of teacherEntries) {
      dayCount[e.day] = (dayCount[e.day] || 0) + 1
    }

    // Max lessons per day
    if (tc.maxLessonsPerDay) {
      for (const [day, count] of Object.entries(dayCount)) {
        if (count > tc.maxLessonsPerDay) {
          issues.push({
            type: 'constraint_violation',
            severity: 'warning',
            message: `Teacher ${teacher.name} has ${count} lessons on ${day} (max: ${tc.maxLessonsPerDay})`,
          })
        }
      }
    }

    // Min lessons per day
    if (tc.minLessonsPerDay) {
      for (const day of settings.days) {
        if ((dayCount[day] || 0) > 0 && (dayCount[day] || 0) < tc.minLessonsPerDay) {
          warnings.push({
            type: 'constraint_violation',
            severity: 'warning',
            message: `Teacher ${teacher.name} has only ${dayCount[day] || 0} lessons on ${day} (min: ${tc.minLessonsPerDay})`,
          })
        }
      }
    }

    // Max teaching days
    if (tc.maxTeachingDays) {
      const teachingDays = Object.keys(dayCount).length
      if (teachingDays > tc.maxTeachingDays) {
        issues.push({
          type: 'constraint_violation',
          severity: 'warning',
          message: `Teacher ${teacher.name} teaches on ${teachingDays} days (max: ${tc.maxTeachingDays})`,
        })
      }
    }

    // Max consecutive periods
    if (tc.maxConsecutivePeriods) {
      for (const day of settings.days) {
        const dayPeriods = teacherEntries
          .filter(e => e.day === day)
          .map(e => teachingPeriods.findIndex(p => p.id === e.periodId))
          .filter(idx => idx >= 0)
          .sort((a, b) => a - b)
        let consecutive = 1
        for (let i = 1; i < dayPeriods.length; i++) {
          if (dayPeriods[i] === dayPeriods[i - 1] + 1) {
            consecutive++
            if (consecutive > tc.maxConsecutivePeriods) {
              issues.push({
                type: 'constraint_violation',
                severity: 'warning',
                message: `Teacher ${teacher.name} has ${consecutive} consecutive periods on ${day} (max: ${tc.maxConsecutivePeriods})`,
              })
              break
            }
          } else {
            consecutive = 1
          }
        }
      }
    }

    // Max gaps per week
    if (tc.maxGapsPerWeek !== undefined) {
      let totalGaps = 0
      for (const day of settings.days) {
        const dayPeriods = teacherEntries
          .filter(e => e.day === day)
          .map(e => teachingPeriods.findIndex(p => p.id === e.periodId))
          .filter(idx => idx >= 0)
          .sort((a, b) => a - b)
        for (let i = 1; i < dayPeriods.length; i++) {
          const gap = dayPeriods[i] - dayPeriods[i - 1] - 1
          if (gap > 0) totalGaps += gap
        }
      }
      if (totalGaps > tc.maxGapsPerWeek) {
        issues.push({
          type: 'constraint_violation',
          severity: 'warning',
          message: `Teacher ${teacher.name} has ${totalGaps} gaps per week (max: ${tc.maxGapsPerWeek})`,
        })
      }
    }
  }

  // 5. Check for classes with unfilled slots
  for (const cls of classes) {
    const schedule = getScheduleForClass(state, cls.id)
    const tp = schedule.periods.filter(p => !p.isBreak)
    const totalSlots = schedule.days.length * tp.length
    const filled = timetable.filter(e => e.classId === cls.id).length
    if (filled < totalSlots) {
      warnings.push({
        type: 'unfilled_slots',
        severity: 'warning',
        message: `Class ${cls.name} has ${totalSlots - filled} unfilled slots`,
      })
    }
  }

  // 6. Check for teachers exceeding maxPeriods
  for (const teacher of teachers) {
    const count = timetable.filter(e => e.teacherId === teacher.id || e.secondaryTeacherId === teacher.id).length
    const max = teacher.maxPeriods || 6
    const totalSlots = settings.days.length * teachingPeriods.length
    const effectiveMax = max * settings.days.length
    if (count > effectiveMax) {
      issues.push({
        type: 'overload',
        severity: 'warning',
        message: `Teacher ${teacher.name} has ${count} total lessons (max capacity: ${effectiveMax})`,
      })
    }
  }

  return {
    issues,
    warnings,
    isValid: issues.filter(i => i.severity === 'error').length === 0,
    errorCount: issues.filter(i => i.severity === 'error').length,
    warningCount: issues.filter(i => i.severity === 'warning').length + warnings.length,
  }
}

function getScheduleForClass(state, classId) {
  const cls = state.classes.find(c => c.id === classId)
  if (cls?.sectionId) {
    const section = state.sections.find(s => s.id === cls.sectionId)
    if (section) return { days: section.days, periods: section.periods }
  }
  return { days: state.settings.days, periods: state.settings.periods }
}
