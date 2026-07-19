import React, { useMemo, useEffect, useState } from 'react'
import { useApp, getScheduleForClass } from '../store/AppContext.jsx'
import { Card, PageHeader, Badge, ProgressBar, Button, SkeletonCard } from '../components/UI.jsx'

export default function Statistics({ embedded, onBack, navigate }) {
  const { state } = useApp()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000)
    return () => clearTimeout(timer)
  }, [])

  const stats = useMemo(() => {
    const teachingPeriods = state.settings.periods.filter(p => !p.isBreak)
    const periodDuration = (period) => {
      if (!period.start || !period.end) return 40
      const [sh, sm] = period.start.split(':').map(Number)
      const [eh, em] = period.end.split(':').map(Number)
      return (eh * 60 + em) - (sh * 60 + sm)
    }

    // Teacher stats
    const teacherStats = state.teachers.map(teacher => {
      const entries = state.timetable.filter(e => e.teacherId === teacher.id || e.secondaryTeacherId === teacher.id)
      const dayCount = new Set(entries.map(e => e.day)).size
      const dailyCounts = {}
      for (const e of entries) {
        dailyCounts[e.day] = (dailyCounts[e.day] || 0) + 1
      }
      const maxDaily = Math.max(0, ...Object.values(dailyCounts))
      const minDaily = entries.length > 0 ? Math.min(...Object.values(dailyCounts)) : 0

      // Calculate gaps (free periods between teaching periods)
      let totalGaps = 0
      for (const day of state.settings.days) {
        const dayEntries = entries.filter(e => e.day === day).sort((a, b) => {
          const pa = teachingPeriods.findIndex(p => p.id === a.periodId)
          const pb = teachingPeriods.findIndex(p => p.id === b.periodId)
          return pa - pb
        })
        for (let i = 1; i < dayEntries.length; i++) {
          const prevIdx = teachingPeriods.findIndex(p => p.id === dayEntries[i - 1].periodId)
          const currIdx = teachingPeriods.findIndex(p => p.id === dayEntries[i].periodId)
          if (currIdx - prevIdx > 1) {
            totalGaps += (currIdx - prevIdx - 1)
          }
        }
      }

      // Calculate minutes taught
      let minutes = 0
      for (const e of entries) {
        const period = state.settings.periods.find(p => p.id === e.periodId)
        if (period && !period.isBreak) {
          minutes += periodDuration(period)
        }
      }

      // Consecutive periods check
      let maxConsecutive = 0
      for (const day of state.settings.days) {
        const dayEntries = entries.filter(e => e.day === day).sort((a, b) => {
          const pa = teachingPeriods.findIndex(p => p.id === a.periodId)
          const pb = teachingPeriods.findIndex(p => p.id === b.periodId)
          return pa - pb
        })
        let current = 1
        for (let i = 1; i < dayEntries.length; i++) {
          const prevIdx = teachingPeriods.findIndex(p => p.id === dayEntries[i - 1].periodId)
          const currIdx = teachingPeriods.findIndex(p => p.id === dayEntries[i].periodId)
          if (currIdx - prevIdx === 1) {
            current++
            maxConsecutive = Math.max(maxConsecutive, current)
          } else {
            current = 1
          }
        }
      }

      return {
        teacher,
        totalLessons: entries.length,
        teachingDays: dayCount,
        maxDaily,
        minDaily,
        totalGaps,
        maxConsecutive,
        minutesTaught: minutes,
        utilization: Math.round((entries.length / ((teacher.maxPeriods || 6) * (teacher.maxTeachingDays || state.settings.days.length))) * 100),
      }
    }).sort((a, b) => b.totalLessons - a.totalLessons)

    // Class stats
    const classStats = state.classes.map(cls => {
      const entries = state.timetable.filter(e => e.classId === cls.id)
      const schedule = getScheduleForClass(state, cls.id)
      const classTeachingPeriods = (schedule.periods || []).filter(p => !p.isBreak)
      const totalSlots = (schedule.days || []).length * classTeachingPeriods.length
      const filledSlots = entries.length
      const fillRate = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0

      // Subject distribution
      const subjectCount = {}
      for (const e of entries) {
        subjectCount[e.subjectId] = (subjectCount[e.subjectId] || 0) + 1
      }

      // Gaps for class
      let totalGaps = 0
      for (const day of (schedule.days || [])) {
        const dayEntries = entries.filter(e => e.day === day).sort((a, b) => {
          const pa = classTeachingPeriods.findIndex(p => p.id === a.periodId)
          const pb = classTeachingPeriods.findIndex(p => p.id === b.periodId)
          return pa - pb
        })
        for (let i = 1; i < dayEntries.length; i++) {
          const prevIdx = classTeachingPeriods.findIndex(p => p.id === dayEntries[i - 1].periodId)
          const currIdx = classTeachingPeriods.findIndex(p => p.id === dayEntries[i].periodId)
          if (currIdx - prevIdx > 1) {
            totalGaps += (currIdx - prevIdx - 1)
          }
        }
      }

      return {
        cls,
        filledSlots,
        totalSlots,
        fillRate,
        totalGaps,
        subjectCount,
      }
    })

    // Overall stats
    const totalEntries = state.timetable.length
    const totalSlots = state.classes.reduce((sum, cls) => {
      const schedule = getScheduleForClass(state, cls.id)
      const tp = (schedule.periods || []).filter(p => !p.isBreak)
      return sum + (schedule.days || []).length * tp.length
    }, 0)
    const overallFillRate = totalSlots > 0 ? Math.round((totalEntries / totalSlots) * 100) : 0
    const totalGapsAll = teacherStats.reduce((sum, t) => sum + t.totalGaps, 0)
    const totalMinutes = teacherStats.reduce((sum, t) => sum + t.minutesTaught, 0)

    // Overtime tracking: teachers exceeding maxPeriods per day
    const overtime = []
    for (const teacher of state.teachers) {
      const maxPerDay = teacher.maxPeriods || teacher.maxLessonsPerDay || (state.teacherConstraints?.[teacher.id]?.maxLessonsPerDay) || null
      if (!maxPerDay) continue
      const entries = state.timetable.filter(e => e.teacherId === teacher.id || e.secondaryTeacherId === teacher.id)
      const dailyCounts = {}
      for (const e of entries) {
        dailyCounts[e.day] = (dailyCounts[e.day] || 0) + 1
      }
      for (const day in dailyCounts) {
        if (dailyCounts[day] > maxPerDay) {
          overtime.push({ teacher, day, count: dailyCounts[day], max: maxPerDay })
        }
      }
    }

    return {
      teacherStats,
      classStats,
      totalEntries,
      totalSlots,
      overallFillRate,
      totalGapsAll,
      totalMinutes,
      overtime,
    }
  }, [state.timetable, state.teachers, state.classes, state.settings, state.subjects, state.teacherConstraints])

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        {!embedded && <PageHeader title="Statistics" subtitle="Loading..." />}
        <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    )
  }

  if (state.timetable.length === 0) {
    return (
      <div className="p-4 md:p-8">
        {!embedded && <PageHeader title="Statistics" subtitle="Analyze gaps, teacher load, and timetable efficiency" />}
        <Card className="p-6">
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-brand-300 mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm text-slate-500 mb-4">No timetable data to analyze. Generate or create a timetable first.</p>
            {navigate && (
              <div className="flex gap-2 justify-center">
                <Button variant="success" onClick={() => navigate('generate')}>Smart Generate</Button>
                <Button variant="secondary" onClick={() => navigate('editor')}>Open Editor</Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      {!embedded && <PageHeader title="Statistics" subtitle="Analyze gaps, teacher load, and timetable efficiency" />}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-5">
          <p className="text-xs text-slate-500 mb-1">Fill Rate</p>
          <p className="text-2xl font-bold text-brand-600">{stats.overallFillRate}%</p>
          <p className="text-xs text-slate-400 mt-1">{stats.totalEntries}/{stats.totalSlots} slots</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-slate-500 mb-1">Total Gaps</p>
          <p className="text-2xl font-bold text-amber-600">{stats.totalGapsAll}</p>
          <p className="text-xs text-slate-400 mt-1">Free periods between lessons</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-slate-500 mb-1">Minutes Taught</p>
          <p className="text-2xl font-bold text-green-600">{stats.totalMinutes.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1">Across all teachers</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-slate-500 mb-1">Active Teachers</p>
          <p className="text-2xl font-bold text-slate-800">{stats.teacherStats.filter(t => t.totalLessons > 0).length}</p>
          <p className="text-xs text-slate-400 mt-1">Of {state.teachers.length} total</p>
        </Card>
      </div>

      {/* Teacher Load Table */}
      <Card className="p-5 mb-6">
        <h3 className="text-sm font-bold text-slate-700 mb-4">Teacher Load Analysis</h3>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3 text-xs font-bold text-slate-500">Teacher</th>
                <th className="text-center py-2 px-3 text-xs font-bold text-slate-500">Lessons</th>
                <th className="text-center py-2 px-3 text-xs font-bold text-slate-500">Days</th>
                <th className="text-center py-2 px-3 text-xs font-bold text-slate-500">Max/Day</th>
                <th className="text-center py-2 px-3 text-xs font-bold text-slate-500">Min/Day</th>
                <th className="text-center py-2 px-3 text-xs font-bold text-slate-500">Gaps</th>
                <th className="text-center py-2 px-3 text-xs font-bold text-slate-500">Max Consec</th>
                <th className="text-center py-2 px-3 text-xs font-bold text-slate-500">Minutes</th>
                <th className="text-center py-2 px-3 text-xs font-bold text-slate-500">Utilization</th>
              </tr>
            </thead>
            <tbody>
              {stats.teacherStats.map(({ teacher, totalLessons, teachingDays, maxDaily, minDaily, totalGaps, maxConsecutive, minutesTaught, utilization }) => (
                <tr key={teacher.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2 px-3 font-medium text-slate-700">{teacher.name}</td>
                  <td className="text-center py-2 px-3 text-slate-600">{totalLessons}</td>
                  <td className="text-center py-2 px-3 text-slate-600">{teachingDays}</td>
                  <td className="text-center py-2 px-3">
                    <span className={maxDaily > (teacher.maxPeriods || 6) ? 'text-red-600 font-bold' : 'text-slate-600'}>{maxDaily}</span>
                  </td>
                  <td className="text-center py-2 px-3 text-slate-600">{minDaily}</td>
                  <td className="text-center py-2 px-3">
                    <span className={totalGaps > (teacher.maxGapsPerWeek || 5) ? 'text-red-600 font-bold' : totalGaps > 2 ? 'text-amber-600' : 'text-slate-600'}>{totalGaps}</span>
                  </td>
                  <td className="text-center py-2 px-3">
                    <span className={maxConsecutive > (teacher.maxConsecutivePeriods || 4) ? 'text-red-600 font-bold' : 'text-slate-600'}>{maxConsecutive}</span>
                  </td>
                  <td className="text-center py-2 px-3 text-slate-600">{minutesTaught}</td>
                  <td className="text-center py-2 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16">
                        <ProgressBar value={Math.min(100, utilization)} max={100} />
                      </div>
                      <span className="text-xs text-slate-500">{utilization}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Class Fill Rates */}
      <Card className="p-5">
        <h3 className="text-sm font-bold text-slate-700 mb-4">Class Fill Rates & Gaps</h3>
        <div className="space-y-3">
          {stats.classStats.map(({ cls, filledSlots, totalSlots, fillRate, totalGaps }) => (
            <div key={cls.id} className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-700 w-32 truncate">{cls.name}</span>
              <div className="flex-1">
                <ProgressBar value={filledSlots} max={totalSlots || 1} />
              </div>
              <span className="text-xs text-slate-500 w-24 text-right">{filledSlots}/{totalSlots} ({fillRate}%)</span>
              {totalGaps > 0 && <Badge color="amber">{totalGaps} gaps</Badge>}
            </div>
          ))}
        </div>
      </Card>

      {/* Overtime Tracking */}
      <Card className="p-5">
        <h3 className="text-sm font-bold text-slate-700 mb-4">Overtime Tracking</h3>
        <p className="text-xs text-slate-500 mb-3">Teachers exceeding their max periods per day threshold.</p>
        {stats.overtime.length === 0 ? (
          <p className="text-sm text-slate-400 py-2">No overtime detected. All teachers are within limits.</p>
        ) : (
          <div className="space-y-2">
            {stats.overtime.map(({ teacher, day, count, max }) => (
              <div key={`${teacher.id}-${day}`} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge color="amber">{count}/{max}</Badge>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{teacher.name}</p>
                    <p className="text-xs text-slate-500">{day} — {count} periods (max {max})</p>
                  </div>
                </div>
                <Badge color="red">+{count - max} overtime</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
