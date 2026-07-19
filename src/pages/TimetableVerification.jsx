import React, { useState, useMemo, forwardRef, useImperativeHandle, useEffect } from 'react'
import { useApp, getScheduleForClass } from '../store/AppContext.jsx'
import { sounds } from '../utils/sounds.js'
import { Button, Card, PageHeader, Badge, ProgressBar, SkeletonCard } from '../components/UI.jsx'

const TimetableVerification = forwardRef(function TimetableVerification({ embedded, onBack }, ref) {
  const { state } = useApp()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000)
    return () => clearTimeout(timer)
  }, [])

  const [results, setResults] = useState(null)

  useImperativeHandle(ref, () => ({ runVerification }))

  const runVerification = () => {
    sounds.click()
    const issues = []
    const warnings = []
    const checks = []

    // Check 1: Basic data
    checks.push({ name: 'Classes defined', passed: state.classes.length > 0 })
    checks.push({ name: 'Teachers defined', passed: state.teachers.length > 0 })
    checks.push({ name: 'Subjects defined', passed: state.subjects.length > 0 })
    checks.push({ name: 'Rooms defined', passed: state.rooms.length > 0 })

    // Check 2: Teachers with subjects
    const teachersWithoutSubjects = state.teachers.filter(t => !t.subjects || t.subjects.length === 0)
    checks.push({ name: 'All teachers have subjects', passed: teachersWithoutSubjects.length === 0 })
    if (teachersWithoutSubjects.length > 0) {
      warnings.push(`${teachersWithoutSubjects.length} teacher(s) have no subjects assigned: ${teachersWithoutSubjects.map(t => t.name).join(', ')}`)
    }

    // Check 3: Teachable subjects
    const teachersWithSubjects = state.teachers.filter(t => t.subjects && t.subjects.length > 0)
    const teachableSubjects = state.subjects.filter(s => teachersWithSubjects.some(t => t.subjects.includes(s.id)))
    checks.push({ name: 'All subjects have qualified teachers', passed: state.subjects.length > 0 && teachableSubjects.length === state.subjects.length })
    if (state.subjects.length > 0 && teachableSubjects.length < state.subjects.length) {
      const unteachable = state.subjects.filter(s => !teachableSubjects.includes(s))
      issues.push(`${unteachable.length} subject(s) have no qualified teachers: ${unteachable.map(s => s.name).join(', ')}`)
    }

    // Check 4: Teacher availability vs required slots
    const teachingPeriods = state.settings.periods.filter(p => !p.isBreak)
    const totalSlotsPerClass = state.settings.days.length * teachingPeriods.length
    const totalSlots = totalSlotsPerClass * state.classes.length

    let teacherCapacity = 0
    for (const teacher of state.teachers) {
      const maxPeriods = teacher.maxPeriods || 6
      const maxDays = teacher.maxTeachingDays || state.settings.days.length
      teacherCapacity += maxPeriods * maxDays
    }
    checks.push({ name: 'Teacher capacity >= total slots', passed: teacherCapacity >= totalSlots })
    if (teacherCapacity < totalSlots) {
      issues.push(`Teacher capacity (${teacherCapacity}) is less than total slots (${totalSlots}). Need more teachers or increase max periods.`)
    }

    // Check 5: Room capacity
    const roomSlots = state.rooms.length * totalSlotsPerClass
    checks.push({ name: 'Room capacity >= total slots', passed: roomSlots >= totalSlots })
    if (roomSlots < totalSlots) {
      warnings.push(`Room capacity (${roomSlots}) is less than total slots (${totalSlots}). Some lessons may not have rooms.`)
    }

    // Check 6: Timetable conflict verification
    const conflicts = []
    const slotMap = {}
    for (const entry of state.timetable) {
      const key = `${entry.day}-${entry.periodId}`
      if (!slotMap[key]) slotMap[key] = []
      slotMap[key].push(entry)
    }

    for (const [key, entries] of Object.entries(slotMap)) {
      // Teacher double-booking
      const teacherEntries = {}
      for (const e of entries) {
        if (e.teacherId) {
          if (teacherEntries[e.teacherId]) {
            const teacher = state.teachers.find(t => t.id === e.teacherId)
            conflicts.push(`Teacher ${teacher?.name || 'Unknown'} double-booked on ${key}`)
          }
          teacherEntries[e.teacherId] = true
        }
        if (e.secondaryTeacherId) {
          if (teacherEntries[e.secondaryTeacherId]) {
            const teacher = state.teachers.find(t => t.id === e.secondaryTeacherId)
            conflicts.push(`Teacher ${teacher?.name || 'Unknown'} double-booked on ${key}`)
          }
          teacherEntries[e.secondaryTeacherId] = true
        }
      }
      // Room double-booking
      const roomEntries = {}
      for (const e of entries) {
        if (e.roomId) {
          if (roomEntries[e.roomId]) {
            const room = state.rooms.find(r => r.id === e.roomId)
            conflicts.push(`Room ${room?.name || 'Unknown'} double-booked on ${key}`)
          }
          roomEntries[e.roomId] = true
        }
      }
    }

    // Check 7: Teacher availability violations
    for (const entry of state.timetable) {
      const teacher = state.teachers.find(t => t.id === entry.teacherId)
      if (teacher?.availability) {
        const availKey = `${entry.day}-${entry.periodId}`
        if (teacher.availability[availKey] === false) {
          conflicts.push(`Teacher ${teacher.name} scheduled during unavailable slot (${entry.day}, Period ${entry.periodId})`)
        }
      }
    }

    // Check 8: Teacher daily limits
    const teacherDailyCount = {}
    for (const entry of state.timetable) {
      if (!entry.teacherId) continue
      if (!teacherDailyCount[entry.teacherId]) teacherDailyCount[entry.teacherId] = {}
      teacherDailyCount[entry.teacherId][entry.day] = (teacherDailyCount[entry.teacherId][entry.day] || 0) + 1
    }
    for (const [teacherId, dayCounts] of Object.entries(teacherDailyCount)) {
      const teacher = state.teachers.find(t => t.id === teacherId)
      if (!teacher) continue
      for (const [day, count] of Object.entries(dayCounts)) {
        if (count > (teacher.maxPeriods || 6)) {
          conflicts.push(`Teacher ${teacher.name} has ${count} periods on ${day} (max ${teacher.maxPeriods || 6})`)
        }
        if (teacher.maxLessonsPerDay && count > teacher.maxLessonsPerDay) {
          conflicts.push(`Teacher ${teacher.name} exceeds max lessons/day (${count}/${teacher.maxLessonsPerDay}) on ${day}`)
        }
      }
    }

    // Check 9: Card relationships
    for (const rel of state.cardRelationships) {
      const classEntries = rel.classId
        ? state.timetable.filter(e => e.classId === rel.classId)
        : state.timetable

      if (rel.type === 'same_day' && rel.relatedSubjectId) {
        for (const day of state.settings.days) {
          const hasSubj1 = classEntries.some(e => e.day === day && e.subjectId === rel.subjectId)
          const hasSubj2 = classEntries.some(e => e.day === day && e.subjectId === rel.relatedSubjectId)
          if (hasSubj1 && !hasSubj2) {
            warnings.push(`Same-day rule: ${state.subjects.find(s => s.id === rel.subjectId)?.name} on ${day} but ${state.subjects.find(s => s.id === rel.relatedSubjectId)?.name} is missing`)
          }
        }
      }
      if (rel.type === 'not_same_day' && rel.relatedSubjectId) {
        for (const day of state.settings.days) {
          const hasSubj1 = classEntries.some(e => e.day === day && e.subjectId === rel.subjectId)
          const hasSubj2 = classEntries.some(e => e.day === day && e.subjectId === rel.relatedSubjectId)
          if (hasSubj1 && hasSubj2) {
            conflicts.push(`Not-same-day rule violated: ${state.subjects.find(s => s.id === rel.subjectId)?.name} and ${state.subjects.find(s => s.id === rel.relatedSubjectId)?.name} both on ${day}`)
          }
        }
      }
      if (rel.type === 'max_per_day') {
        for (const day of state.settings.days) {
          const count = classEntries.filter(e => e.day === day && e.subjectId === rel.subjectId).length
          if (count > (rel.maxPerDay || 1)) {
            conflicts.push(`Max-per-day rule violated: ${state.subjects.find(s => s.id === rel.subjectId)?.name} appears ${count} times on ${day} (max ${rel.maxPerDay})`)
          }
        }
      }
    }

    const passedChecks = checks.filter(c => c.passed).length
    const totalChecks = checks.length
    const score = Math.round((passedChecks / totalChecks) * 100)

    setResults({
      checks,
      issues,
      warnings,
      conflicts,
      score,
      passedChecks,
      totalChecks,
    })
  }

  const hasTimetable = state.timetable.length > 0

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        {!embedded ? <PageHeader title="Timetable Verification" subtitle="Loading..." /> : null}
        <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      {!embedded ? (
        <PageHeader
          title="Timetable Verification"
          subtitle="Validate your data and timetable against all constraints before and after generation"
          action={
            <div className="flex gap-2">
              <Button onClick={runVerification} disabled={state.classes.length === 0}>
                Run Verification
              </Button>
            </div>
          }
        />
      ) : null}

      {!results && (
        <Card className="p-6">
          <div className="text-center py-8">
            <svg className="w-16 h-16 text-brand-300 mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-slate-500 mb-2">Click "Run Verification" to check your data and timetable</p>
            <p className="text-xs text-slate-400">Checks include: data completeness, teacher capacity, room availability, conflicts, constraint violations, and card relationship rules</p>
          </div>
        </Card>
      )}

      {results && (
        <div className="space-y-6">
          {/* Score Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-700">Verification Score</h3>
                <p className="text-xs text-slate-500">{results.passedChecks} of {results.totalChecks} checks passed</p>
              </div>
              <div className={`text-3xl font-bold ${results.score >= 80 ? 'text-green-600' : results.score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                {results.score}%
              </div>
            </div>
            <ProgressBar value={results.passedChecks} max={results.totalChecks} />
          </Card>

          {/* Checks */}
          <Card className="p-5">
            <h3 className="text-sm font-bold text-slate-700 mb-3">Pre-Generation Checks</h3>
            <div className="space-y-2">
              {results.checks.map((check, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${check.passed ? 'bg-green-100' : 'bg-red-100'}`}>
                    {check.passed ? (
                      <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-sm ${check.passed ? 'text-slate-700' : 'text-red-700'}`}>{check.name}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Issues */}
          {results.issues.length > 0 && (
            <Card className="p-5 border-red-200">
              <h3 className="text-sm font-bold text-red-700 mb-3">Issues ({results.issues.length})</h3>
              <div className="space-y-2">
                {results.issues.map((issue, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-red-600">
                    <span className="text-red-400 mt-0.5">⚠</span>
                    <span>{issue}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Warnings */}
          {results.warnings.length > 0 && (
            <Card className="p-5 border-amber-200">
              <h3 className="text-sm font-bold text-amber-700 mb-3">Warnings ({results.warnings.length})</h3>
              <div className="space-y-2">
                {results.warnings.map((warning, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-amber-600">
                    <span className="text-amber-400 mt-0.5">⚠</span>
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Conflicts */}
          {hasTimetable && (
            <Card className={`p-5 ${results.conflicts.length > 0 ? 'border-red-200' : 'border-green-200'}`}>
              <h3 className={`text-sm font-bold mb-3 ${results.conflicts.length > 0 ? 'text-red-700' : 'text-green-700'}`}>
                Timetable Conflicts ({results.conflicts.length})
              </h3>
              {results.conflicts.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  No conflicts detected in the current timetable
                </div>
              ) : (
                <div className="space-y-2">
                  {results.conflicts.map((conflict, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-red-600">
                      <span className="text-red-400 mt-0.5">✕</span>
                      <span>{conflict}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setResults(null)}>Clear</Button>
            <Button onClick={() => navigate('generate')}>Go to Smart Generate</Button>
          </div>
        </div>
      )}
    </div>
  )
})

export default TimetableVerification
