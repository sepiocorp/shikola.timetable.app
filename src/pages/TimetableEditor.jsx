import React, { useState, useMemo } from 'react'
import { useApp, getScheduleForClass } from '../store/AppContext.jsx'
import { sounds } from '../utils/sounds.js'
import { Button, Select, Card, PageHeader, Modal, EmptyState, ProgressBar, Badge } from '../components/UI.jsx'
import { generateTimetable, canGenerate } from '../utils/generate.js'

export default function TimetableEditor({ navigate }) {
  const { state, dispatch, checkConflicts } = useApp()
  const [selectedClass, setSelectedClass] = useState('')
  const [cellModal, setCellModal] = useState(null)
  const [form, setForm] = useState({ teacherId: '', subjectId: '', roomId: '', secondaryClassId: '', secondarySubjectId: '', secondaryTeacherId: '' })
  const [conflicts, setConflicts] = useState([])
  const [generating, setGenerating] = useState(false)
  const [generateProgress, setGenerateProgress] = useState({ current: 0, total: 0 })
  const [smoothProgress, setSmoothProgress] = useState(0)
  const [generateStats, setGenerateStats] = useState(null)
  const [generateModal, setGenerateModal] = useState(null)

  const schedule = useMemo(() => {
    if (!selectedClass) return { days: state.settings.days, periods: state.settings.periods }
    return getScheduleForClass(state, selectedClass)
  }, [state, selectedClass])

  const teachingPeriods = schedule.periods.filter(p => !p.isBreak)

  const classTimetable = useMemo(() => {
    if (!selectedClass) return {}
    const map = {}
    for (const entry of state.timetable) {
      if (entry.classId === selectedClass) {
        const key = `${entry.day}-${entry.periodId}`
        map[key] = entry
      }
    }
    return map
  }, [state.timetable, selectedClass])

  const openCell = (day, periodId) => {
    const key = `${day}-${periodId}`
    const existing = classTimetable[key]
    sounds.click()
    setForm({
      teacherId: existing?.teacherId || '',
      subjectId: existing?.subjectId || '',
      roomId: existing?.roomId || '',
      secondaryClassId: existing?.secondaryClassId || '',
      secondarySubjectId: existing?.secondarySubjectId || '',
      secondaryTeacherId: existing?.secondaryTeacherId || '',
    })
    setConflicts([])
    setCellModal({ day, periodId, existing })
  }

  const checkEntry = () => {
    if (!form.teacherId && !form.subjectId) return []
    const selectedSubject = state.subjects.find(s => s.id === form.subjectId)
    const secondaryTeacherId = selectedSubject?.isOptional ? form.secondaryTeacherId : ''
    const entry = {
      day: cellModal.day,
      periodId: cellModal.periodId,
      teacherId: form.teacherId,
      classId: selectedClass,
      subjectId: form.subjectId,
      roomId: form.roomId,
      secondaryTeacherId,
    }
    const existing = classTimetable[`${cellModal.day}-${cellModal.periodId}`]
    if (existing) entry.id = existing.id
    return checkConflicts(entry)
  }

  const handleSave = () => {
    if (!form.teacherId && !form.subjectId) {
      sounds.error()
      return
    }
    const c = checkEntry()
    if (c.length > 0) {
      setConflicts(c)
      sounds.conflict()
      return
    }
    const selectedSubject = state.subjects.find(s => s.id === form.subjectId)
    const secondaryClassId = selectedSubject?.isOptional ? (form.secondaryClassId || selectedSubject.secondaryClassId || '') : ''
    const secondarySubjectId = selectedSubject?.isOptional ? form.secondarySubjectId : ''
    const secondaryTeacherId = selectedSubject?.isOptional ? form.secondaryTeacherId : ''

    dispatch({
      type: 'SET_TIMETABLE_ENTRY',
      payload: {
        day: cellModal.day,
        periodId: cellModal.periodId,
        teacherId: form.teacherId,
        classId: selectedClass,
        subjectId: form.subjectId,
        roomId: form.roomId,
        secondaryClassId,
        secondarySubjectId,
        secondaryTeacherId,
      },
    })
    sounds.add()
    setCellModal(null)
  }

  const handleClear = () => {
    const existing = classTimetable[`${cellModal.day}-${cellModal.periodId}`]
    if (existing) {
      dispatch({ type: 'DELETE_TIMETABLE_ENTRY', payload: existing.id })
      sounds.delete()
    }
    setCellModal(null)
  }

  const genCheck = canGenerate(state)

  const handleGenerateClick = (mode) => {
    sounds.click()
    setGenerateModal({ mode })
  }

  const confirmGenerate = () => {
    const mode = generateModal.mode
    setGenerateModal(null)
    setGenerating(true)
    setGenerateProgress({ current: 0, total: 0 })

    const classIds = mode === 'bulk'
      ? state.classes.map(c => c.id)
      : [selectedClass]

    const existingEntries = state.timetable.filter(e => !classIds.includes(e.classId))

    const startTime = Date.now()
    const MIN_LOAD_TIME = 5000
    setSmoothProgress(0)

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const pct = Math.min(90, (elapsed / MIN_LOAD_TIME) * 100)
      setSmoothProgress(pct)
    }, 50)

    setTimeout(() => {
      const { entries, stats } = generateTimetable({
        classes: state.classes,
        teachers: state.teachers,
        subjects: state.subjects,
        rooms: state.rooms,
        days: state.settings.days,
        periods: state.settings.periods,
        classIds,
        existingEntries,
        onProgress: (current, total) => setGenerateProgress({ current, total }),
        getScheduleForClassFn: (classId) => getScheduleForClass(state, classId),
      })

      dispatch({ type: 'GENERATE_TIMETABLE', payload: { entries, classIds } })
      sounds.generate()

      setSmoothProgress(100)
      clearInterval(progressInterval)

      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, MIN_LOAD_TIME - elapsed)
      setTimeout(() => {
        setGenerating(false)
        setGenerateStats(stats)
      }, remaining)
    }, 400)
  }

  const handleClearClass = () => {
    if (!selectedClass) return
    if (confirm('Clear all timetable entries for this class?')) {
      const entries = state.timetable.filter(e => e.classId === selectedClass)
      entries.forEach(e => dispatch({ type: 'DELETE_TIMETABLE_ENTRY', payload: e.id }))
      sounds.delete()
    }
  }

  const getCellDisplay = (day, periodId) => {
    const key = `${day}-${periodId}`
    const entry = classTimetable[key]
    if (!entry) return null
    const teacher = state.teachers.find(t => t.id === entry.teacherId)
    const subject = state.subjects.find(s => s.id === entry.subjectId)
    const room = state.rooms.find(r => r.id === entry.roomId)
    const secondaryClass = entry.secondaryClassId ? state.classes.find(c => c.id === entry.secondaryClassId) : null
    const secondarySubject = entry.secondarySubjectId ? state.subjects.find(s => s.id === entry.secondarySubjectId) : null
    const secondaryTeacher = entry.secondaryTeacherId ? state.teachers.find(t => t.id === entry.secondaryTeacherId) : null
    return { entry, teacher, subject, room, secondaryClass, secondarySubject, secondaryTeacher }
  }

  const getTeacherSubjects = (teacherId) => {
    const teacher = state.teachers.find(t => t.id === teacherId)
    if (!teacher?.subjects?.length) return state.subjects
    return state.subjects.filter(s => teacher.subjects.includes(s.id))
  }

  if (state.classes.length === 0) {
    return (
      <div className="p-8">
        <PageHeader title="Timetable Editor" />
        <Card className="p-6">
          <EmptyState
            icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            title="No classes available"
            subtitle="Add classes first before creating timetables"
            action={<Button onClick={() => navigate('classes')}>+ Add Classes</Button>}
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Timetable Editor"
        subtitle="Create and edit class timetables with automatic conflict detection"
        action={
          <div className="flex items-center gap-3">
            <Select
              value={selectedClass}
              onChange={e => { setSelectedClass(e.target.value); sounds.click() }}
              options={
                <>
                  <option value="">-- Select Class --</option>
                  {state.classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </>
              }
              className="w-48"
            />
            {selectedClass && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleClearClass}
              >
                Clear Class
              </Button>
            )}
            <Button
              variant="success"
              size="sm"
              disabled={!genCheck.canGenerate || !selectedClass}
              onClick={() => handleGenerateClick('single')}
              title={!genCheck.canGenerate ? genCheck.issues.join(', ') : 'Auto-generate timetable for this class'}
            >
              <span className="flex items-center gap-1.5">
                <img src="./ai.png" alt="AI" className="w-4 h-4 object-contain" />
                Generate for Me
              </span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!genCheck.canGenerate}
              onClick={() => handleGenerateClick('bulk')}
              title={!genCheck.canGenerate ? genCheck.issues.join(', ') : 'Auto-generate timetables for ALL classes'}
            >
              Generate All Classes
            </Button>
          </div>
        }
      />

      {!selectedClass ? (
        <Card className="p-6">
          <EmptyState
            icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            title="Select a class"
            subtitle="Choose a class from the dropdown above to start editing its timetable"
          />
        </Card>
      ) : (
        <Card className="p-4 overflow-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-slate-200 bg-brand-50 text-brand-700 text-xs font-bold px-2 py-2 text-center sticky left-0 z-10">
                  Day / Period
                </th>
                {schedule.periods.map(period => (
                  <th
                    key={period.id}
                    className={`border border-slate-200 text-xs font-bold px-2 py-2 text-center min-w-[120px] ${
                      period.isBreak ? 'bg-slate-100 text-slate-400' : 'bg-brand-600 text-white'
                    }`}
                  >
                    {period.name}
                    <div className={`text-[10px] font-normal ${period.isBreak ? 'text-slate-400' : 'text-brand-100'}`}>
                      {period.start} - {period.end}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {schedule.days.map(day => (
                <tr key={day}>
                  <td className="border border-slate-200 bg-brand-50 text-brand-700 text-xs font-bold px-2 py-2 text-center sticky left-0 z-10">
                    {day}
                  </td>
                  {schedule.periods.map(period => {
                    if (period.isBreak) {
                      return (
                        <td key={period.id} className="border border-slate-200 bg-slate-50 text-center text-xs text-slate-400 py-2">
                          Break
                        </td>
                      )
                    }
                    const display = getCellDisplay(day, period.id)
                    return (
                      <td
                        key={period.id}
                        className="border border-slate-200 p-1 cursor-pointer hover:bg-brand-50 transition-colors"
                        onClick={() => openCell(day, period.id)}
                      >
                        {display ? (
                          <div className="text-center">
                            <p className="text-xs font-semibold text-slate-800">{display.subject?.name || '—'}</p>
                            <p className="text-[10px] text-slate-500">{display.teacher?.name || '—'}</p>
                            {display.room && <p className="text-[10px] text-slate-400">{display.room.name}</p>}
                            {display.secondaryClass && (
                              <div className="mt-1 pt-1 border-t border-slate-200">
                                <p className="text-[10px] font-medium text-amber-600">{display.secondaryClass.name}</p>
                                <p className="text-[10px] text-slate-500">{display.secondarySubject?.name || '—'} ({display.secondaryTeacher?.name || '—'})</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center text-slate-300 hover:text-brand-400">
                            <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Generate Loading Overlay */}
      {generating && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm">
          <img src="./ai.png" alt="AI" className="w-16 h-16 rounded-xl object-contain mb-6 animate-pulse" />
          <h2 className="text-lg font-bold text-slate-800 mb-2">Generating Timetable...</h2>
          <p className="text-sm text-slate-500 mb-6">
            Processing class {generateProgress.current} of {generateProgress.total}
          </p>
          <div className="w-64">
            <ProgressBar value={smoothProgress} max={100} />
          </div>
          <p className="mt-4 text-xs text-slate-400">Optimizing teacher and room assignments</p>
        </div>
      )}

      {/* Generate Confirmation Modal */}
      <Modal
        open={!!generateModal}
        onClose={() => setGenerateModal(null)}
        title={generateModal?.mode === 'bulk' ? 'Generate All Timetables' : 'Generate Timetable'}
      >
        <div className="space-y-4">
          <div className="bg-brand-50 border border-brand-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-brand-800">
                <p className="font-semibold mb-1">
                  {generateModal?.mode === 'bulk'
                    ? `Generate timetables for all ${state.classes.length} classes?`
                    : `Generate timetable for ${state.classes.find(c => c.id === selectedClass)?.name || 'this class'}?`
                  }
                </p>
                <p className="text-xs text-brand-700">
                  This will replace any existing timetable entries for {generateModal?.mode === 'bulk' ? 'all classes' : 'this class'}.
                  The system will automatically assign teachers, subjects, and rooms while avoiding conflicts.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-slate-600 mb-2">System Data:</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
              <div>Teachers: <span className="font-bold">{state.teachers.length}</span></div>
              <div>Classes: <span className="font-bold">{state.classes.length}</span></div>
              <div>Subjects: <span className="font-bold">{state.subjects.length}</span></div>
              <div>Rooms: <span className="font-bold">{state.rooms.length}</span></div>
              <div>Days: <span className="font-bold">{schedule.days.length}</span></div>
              <div>Periods: <span className="font-bold">{teachingPeriods.length}</span></div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setGenerateModal(null)}>Cancel</Button>
            <Button variant="success" onClick={confirmGenerate}>
              <span className="flex items-center gap-1.5">
                <img src="./ai.png" alt="AI" className="w-4 h-4 object-contain" />
                Generate Now
              </span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Generate Results Modal */}
      <Modal
        open={!!generateStats}
        onClose={() => setGenerateStats(null)}
        title="Generation Complete"
      >
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-green-800">
                <p className="font-semibold">Timetable generated successfully!</p>
                <p className="text-xs mt-1">
                  Filled {generateStats?.filledSlots} of {generateStats?.totalSlots} slots across {generateStats?.classesProcessed} class(es).
                </p>
              </div>
            </div>
          </div>

          {generateStats?.conflicts.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-amber-800 mb-2">Some slots could not be filled:</p>
              <div className="space-y-1">
                {generateStats.conflicts.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-amber-700">{c.className}</span>
                    <Badge color="amber">{c.unfilled}/{c.total} unfilled</Badge>
                  </div>
                ))}
              </div>
              <p className="text-xs text-amber-600 mt-2">
                This usually means not enough teachers are available for some subjects at certain times.
                Try adding more teachers or assigning more subjects to existing teachers.
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={() => setGenerateStats(null)}>Done</Button>
          </div>
        </div>
      </Modal>

      {/* Cell Edit Modal */}
      <Modal
        open={!!cellModal}
        onClose={() => setCellModal(null)}
        title={`Edit: ${cellModal?.day} - ${schedule.periods.find(p => p.id === cellModal?.periodId)?.name || ''}`}
      >
        <div className="space-y-4">
          {conflicts.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm font-semibold text-red-700 mb-1">Conflicts Detected:</p>
              {conflicts.map((c, i) => (
                <p key={i} className="text-xs text-red-600">• {c.message}</p>
              ))}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Teacher</label>
            <select
              value={form.teacherId}
              onChange={e => { setForm({ ...form, teacherId: e.target.value, subjectId: '' }); sounds.click() }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="">-- Select Teacher --</option>
              {state.teachers.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
            <select
              value={form.subjectId}
              onChange={e => { setForm({ ...form, subjectId: e.target.value }); sounds.click() }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="">-- Select Subject --</option>
              {getTeacherSubjects(form.teacherId).map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Room</label>
            <select
              value={form.roomId}
              onChange={e => { setForm({ ...form, roomId: e.target.value }); sounds.click() }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="">-- Select Room --</option>
              {state.rooms.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* Secondary Class for Optional Subjects */}
          {(() => {
            const selectedSubject = state.subjects.find(s => s.id === form.subjectId)
            if (!selectedSubject?.isOptional) return null
            const effectiveSecondaryClassId = form.secondaryClassId || selectedSubject.secondaryClassId || ''
            const secondaryClass = state.classes.find(c => c.id === effectiveSecondaryClassId)
            return (
              <div className="border border-amber-200 rounded-lg p-4 space-y-3 bg-amber-50/50">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">Optional Subject</span>
                  <p className="text-xs text-slate-500">Set the secondary class and subject for the other group.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Secondary Class</label>
                  <select
                    value={effectiveSecondaryClassId}
                    onChange={e => { setForm({ ...form, secondaryClassId: e.target.value, secondarySubjectId: '', secondaryTeacherId: '' }); sounds.click() }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  >
                    <option value="">-- Select Secondary Class --</option>
                    {state.classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                {secondaryClass && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Secondary Subject</label>
                      <select
                        value={form.secondarySubjectId}
                        onChange={e => { setForm({ ...form, secondarySubjectId: e.target.value, secondaryTeacherId: '' }); sounds.click() }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                      >
                        <option value="">-- Select Subject --</option>
                        {state.subjects.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Secondary Teacher</label>
                      <select
                        value={form.secondaryTeacherId}
                        onChange={e => { setForm({ ...form, secondaryTeacherId: e.target.value }); sounds.click() }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                      >
                        <option value="">-- Select Teacher --</option>
                        {state.teachers.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>
            )
          })()}

          <div className="flex justify-between pt-2">
            <Button variant="danger" size="sm" onClick={handleClear}>Clear Cell</Button>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setCellModal(null)}>Cancel</Button>
              <Button onClick={handleSave}>Save</Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
