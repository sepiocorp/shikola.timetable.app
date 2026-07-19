export function computeStatistics(state) {
  const { timetable, teachers, classes, subjects, rooms, settings } = state
  const teachingPeriods = settings.periods.filter(p => !p.isBreak)
  const stats = {
    teacherLoad: [],
    classFill: [],
    gaps: [],
    roomUtilization: [],
    subjectDistribution: [],
    summary: {
      totalEntries: timetable.length,
      totalSlots: settings.days.length * teachingPeriods.length * classes.length,
      totalTeachers: teachers.length,
      totalClasses: classes.length,
      totalSubjects: subjects.length,
      totalRooms: rooms.length,
      fillRate: 0,
      avgTeacherLoad: 0,
      maxTeacherLoad: 0,
      minTeacherLoad: 0,
      totalGaps: 0,
      totalWindows: 0,
    },
  }

  if (classes.length === 0) return stats
  stats.summary.fillRate = stats.summary.totalSlots > 0
    ? Math.round((timetable.length / stats.summary.totalSlots) * 100)
    : 0

  // Teacher load
  const teacherCounts = {}
  for (const t of teachers) teacherCounts[t.id] = { teacher: t, count: 0, days: {} }
  for (const e of timetable) {
    if (e.teacherId && teacherCounts[e.teacherId]) {
      teacherCounts[e.teacherId].count++
      const day = e.day
      teacherCounts[e.teacherId].days[day] = (teacherCounts[e.teacherId].days[day] || 0) + 1
    }
    if (e.secondaryTeacherId && teacherCounts[e.secondaryTeacherId]) {
      teacherCounts[e.secondaryTeacherId].count++
      const day = e.day
      teacherCounts[e.secondaryTeacherId].days[day] = (teacherCounts[e.secondaryTeacherId].days[day] || 0) + 1
    }
  }
  const loads = Object.values(teacherCounts).map(tc => tc.count)
  stats.summary.avgTeacherLoad = loads.length > 0 ? Math.round(loads.reduce((a, b) => a + b, 0) / loads.length) : 0
  stats.summary.maxTeacherLoad = loads.length > 0 ? Math.max(...loads) : 0
  stats.summary.minTeacherLoad = loads.length > 0 ? Math.min(...loads) : 0

  stats.teacherLoad = Object.values(teacherCounts).map(tc => ({
    teacher: tc.teacher,
    count: tc.count,
    maxPeriods: tc.teacher.maxPeriods || 6,
    overload: tc.count > (tc.teacher.maxPeriods || 6),
    days: tc.days,
  })).sort((a, b) => b.count - a.count)

  // Class fill
  for (const cls of classes) {
    const entries = timetable.filter(e => e.classId === cls.id)
    const schedule = getScheduleForClass(state, cls.id)
    const tp = schedule.periods.filter(p => !p.isBreak)
    const totalSlots = schedule.days.length * tp.length
    stats.classFill.push({
      class: cls,
      filled: entries.length,
      total: totalSlots,
      fillRate: totalSlots > 0 ? Math.round((entries.length / totalSlots) * 100) : 0,
    })
  }

  // Gaps and windows (free periods for teachers between lessons)
  let totalGaps = 0
  let totalWindows = 0
  for (const t of teachers) {
    const teacherEntries = timetable.filter(e => e.teacherId === t.id || e.secondaryTeacherId === t.id)
    for (const day of settings.days) {
      const dayEntries = teacherEntries
        .filter(e => e.day === day)
        .map(e => teachingPeriods.findIndex(p => p.id === e.periodId))
        .filter(idx => idx >= 0)
        .sort((a, b) => a - b)
      if (dayEntries.length === 0) continue
      for (let i = 1; i < dayEntries.length; i++) {
        const gap = dayEntries[i] - dayEntries[i - 1] - 1
        if (gap > 0) totalGaps += gap
      }
      // Windows: free periods before first lesson or after last
      const firstPeriod = dayEntries[0]
      const lastPeriod = dayEntries[dayEntries.length - 1]
      totalWindows += firstPeriod + (teachingPeriods.length - 1 - lastPeriod)
    }
  }
  stats.summary.totalGaps = totalGaps
  stats.summary.totalWindows = totalWindows
  stats.gaps = teachers.map(t => {
    const teacherEntries = timetable.filter(e => e.teacherId === t.id || e.secondaryTeacherId === t.id)
    let teacherGaps = 0
    let teacherWindows = 0
    for (const day of settings.days) {
      const dayEntries = teacherEntries
        .filter(e => e.day === day)
        .map(e => teachingPeriods.findIndex(p => p.id === e.periodId))
        .filter(idx => idx >= 0)
        .sort((a, b) => a - b)
      if (dayEntries.length === 0) continue
      for (let i = 1; i < dayEntries.length; i++) {
        const gap = dayEntries[i] - dayEntries[i - 1] - 1
        if (gap > 0) teacherGaps += gap
      }
      teacherWindows += dayEntries[0] + (teachingPeriods.length - 1 - dayEntries[dayEntries.length - 1])
    }
    return { teacher: t, gaps: teacherGaps, windows: teacherWindows }
  }).filter(g => g.gaps > 0 || g.windows > 0).sort((a, b) => (b.gaps + b.windows) - (a.gaps + a.windows))

  // Room utilization
  const roomCounts = {}
  for (const r of rooms) roomCounts[r.id] = { room: r, count: 0 }
  for (const e of timetable) {
    if (e.roomId && roomCounts[e.roomId]) roomCounts[e.roomId].count++
  }
  const totalSlots = settings.days.length * teachingPeriods.length
  stats.roomUtilization = Object.values(roomCounts).map(rc => ({
    room: rc.room,
    count: rc.count,
    utilization: totalSlots > 0 ? Math.round((rc.count / totalSlots) * 100) : 0,
  })).sort((a, b) => b.count - a.count)

  // Subject distribution
  const subjectCounts = {}
  for (const s of subjects) subjectCounts[s.id] = { subject: s, count: 0 }
  for (const e of timetable) {
    if (e.subjectId && subjectCounts[e.subjectId]) subjectCounts[e.subjectId].count++
    if (e.secondarySubjectId && subjectCounts[e.secondarySubjectId]) subjectCounts[e.secondarySubjectId].count++
  }
  stats.subjectDistribution = Object.values(subjectCounts).map(sc => ({
    subject: sc.subject,
    count: sc.count,
  })).sort((a, b) => b.count - a.count)

  return stats
}

function getScheduleForClass(state, classId) {
  const cls = state.classes.find(c => c.id === classId)
  if (cls?.sectionId) {
    const section = state.sections.find(s => s.id === cls.sectionId)
    if (section) return { days: section.days, periods: section.periods }
  }
  return { days: state.settings.days, periods: state.settings.periods }
}
