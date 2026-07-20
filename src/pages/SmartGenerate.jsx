import React, { useState, useMemo, useEffect } from 'react'
import { useApp, getScheduleForClass } from '../store/AppContext.jsx'
import { sounds } from '../utils/sounds.js'
import { Button, Card, PageHeader, Modal, EmptyState, ProgressBar, Badge, Toggle, Checkbox, Tabs, SkeletonCard } from '../components/UI.jsx'
import { generateTimetable, canGenerate } from '../utils/generate.js'

export default function SmartGenerate({ navigate, searchQuery }) {
  const { state, dispatch } = useApp()
  const [loading, setLoading] = useState(false)

  const genCheck = canGenerate(state)

  const teachingPeriods = state.settings.periods.filter(p => !p.isBreak)
  const totalSlotsPerClass = state.settings.days.length * teachingPeriods.length

  const [selectedClassIds, setSelectedClassIds] = useState([])
  const [subjectWeights, setSubjectWeights] = useState({})
  const [useCustomWeights, setUseCustomWeights] = useState(false)
  const [teacherDayOff, setTeacherDayOff] = useState({})
  const [useTeacherDayOff, setUseTeacherDayOff] = useState(false)
  const [avoidSameSubjectDaily, setAvoidSameSubjectDaily] = useState(true)
  const [balanceTeacherLoad, setBalanceTeacherLoad] = useState(true)
  const [maxRetries, setMaxRetries] = useState(3)

  const [generating, setGenerating] = useState(false)
  const [generateProgress, setGenerateProgress] = useState({ current: 0, total: 0 })
  const [smoothProgress, setSmoothProgress] = useState(0)
  const [generateStats, setGenerateStats] = useState(null)
  const [activeTab, setActiveTab] = useState('classes')

  const teachableSubjects = useMemo(() => {
    const teachersWithSubjects = state.teachers.filter(t => t.subjects && t.subjects.length > 0)
    return state.subjects.filter(s => teachersWithSubjects.some(t => t.subjects.includes(s.id)))
  }, [state.teachers, state.subjects])

  const toggleClass = (id) => {
    sounds.click()
    setSelectedClassIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const toggleAllClasses = () => {
    sounds.click()
    if (selectedClassIds.length === state.classes.length) {
      setSelectedClassIds([])
    } else {
      setSelectedClassIds(state.classes.map(c => c.id))
    }
  }

  const updateSubjectWeight = (subjectId, value) => {
    const v = Math.max(0, Math.min(totalSlotsPerClass, Number(value) || 0))
    setSubjectWeights(prev => ({ ...prev, [subjectId]: v }))
  }

  const toggleTeacherDayOff = (teacherId, day) => {
    sounds.click()
    setTeacherDayOff(prev => {
      const current = prev[teacherId] || []
      return {
        ...prev,
        [teacherId]: current.includes(day)
          ? current.filter(d => d !== day)
          : [...current, day],
      }
    })
  }

  const handleGenerate = () => {
    if (selectedClassIds.length === 0) {
      sounds.error()
      return
    }
    sounds.click()
    setGenerating(true)
    setGenerateProgress({ current: 0, total: 0 })

    const existingEntries = state.timetable.filter(e => !selectedClassIds.includes(e.classId))

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
        classIds: selectedClassIds,
        existingEntries,
        subjectWeights: useCustomWeights ? subjectWeights : null,
        teacherDayOff: useTeacherDayOff ? teacherDayOff : null,
        avoidSameSubjectDaily,
        balanceTeacherLoad,
        maxRetries,
        onProgress: (current, total) => setGenerateProgress({ current, total }),
        getScheduleForClassFn: (classId) => getScheduleForClass(state, classId),
        teacherTimeOff: state.teacherTimeOff,
        teacherConstraints: state.teacherConstraints,
        cardRelationships: state.cardRelationships,
        multiWeekCycle: state.multiWeekCycle,
        autoRelax: state.autoRelax,
        subjectAssignments: state.subjectAssignments,
      })

      dispatch({ type: 'GENERATE_TIMETABLE', payload: { entries, classIds: selectedClassIds } })
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

  if (!genCheck.canGenerate) {
    return (
      <div className="p-4 md:p-8">
        <PageHeader title="Smart Generate" subtitle="Auto-generate timetables with intelligent constraint solving" />
        <Card className="p-6">
          <EmptyState
            icon="M13 10V3L4 14h7v7l9-11h-7z"
            title="Not ready to generate"
            subtitle="You need classes, teachers, and subjects with assignments before smart generation can work"
            action={
              <div className="space-y-2">
                {genCheck.issues.map((issue, i) => (
                  <p key={i} className="text-sm text-red-500">{issue}</p>
                ))}
                <div className="flex gap-2 justify-center pt-2">
                  {state.teachers.length === 0 && <Button size="sm" onClick={() => navigate('teachers')}>Add Teachers</Button>}
                  {state.classes.length === 0 && <Button size="sm" onClick={() => navigate('classes')}>Add Classes</Button>}
                  {state.subjects.length === 0 && <Button size="sm" onClick={() => navigate('subjects')}>Add Subjects</Button>}
                </div>
              </div>
            }
          />
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <PageHeader title="Smart Generate" subtitle="Loading..." />
        <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <PageHeader
        title="Smart Generate"
        subtitle="Auto-generate timetables with intelligent constraint solving"
        action={
          <Button
            variant="success"
            disabled={selectedClassIds.length === 0 || generating}
            onClick={handleGenerate}
          >
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generate ({selectedClassIds.length} class{selectedClassIds.length !== 1 ? 'es' : ''})
            </span>
          </Button>
        }
      />

      <div className="mb-4">
        <Tabs
          tabs={[
            { id: 'classes', label: 'Select Classes' },
            { id: 'options', label: 'Options & Preferences' },
            { id: 'summary', label: 'Summary' },
          ]}
          active={activeTab}
          onChange={(id) => { setActiveTab(id); sounds.click() }}
        />
      </div>

      {activeTab === 'classes' ? (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-700">Select Classes</h3>
            <button
              onClick={toggleAllClasses}
              className="text-xs text-brand-600 hover:text-brand-700 font-medium"
            >
              {selectedClassIds.length === state.classes.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {state.classes.map(cls => (
              <label
                key={cls.id}
                className={
                  'flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ' +
                  (selectedClassIds.includes(cls.id)
                    ? 'border-brand-600 bg-brand-50'
                    : 'border-slate-200 hover:border-slate-300')
                }
              >
                <Checkbox
                  checked={selectedClassIds.includes(cls.id)}
                  onChange={() => toggleClass(cls.id)}
                />
                <div>
                  <p className="text-sm font-semibold text-slate-800">{cls.name}</p>
                  {cls.grade && <p className="text-xs text-slate-500">Grade: {cls.grade}</p>}
                </div>
              </label>
            ))}
          </div>
        </Card>
      ) : activeTab === 'options' ? (
        <div className="space-y-6">
          {/* Generation Options */}
          <Card className="p-5">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Generation Options</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">Avoid same subject twice per day</p>
                  <p className="text-xs text-slate-500">Prevents repeating a subject on the same day for a class</p>
                </div>
                <Toggle checked={avoidSameSubjectDaily} onChange={setAvoidSameSubjectDaily} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">Balance teacher workload</p>
                  <p className="text-xs text-slate-500">Assigns to the least-busy qualified teacher</p>
                </div>
                <Toggle checked={balanceTeacherLoad} onChange={setBalanceTeacherLoad} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Retry attempts: <span className="font-bold text-brand-600">{maxRetries}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={maxRetries}
                  onChange={e => setMaxRetries(Number(e.target.value))}
                  className="w-full accent-brand-600"
                />
                <p className="text-xs text-slate-500">More retries = better fill rate but slower generation</p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">Auto-relax constraints</p>
                  <p className="text-xs text-slate-500">If a slot can't be filled, relax constraints to maximize fill rate</p>
                </div>
                <Toggle checked={state.autoRelax} onChange={(v) => { dispatch({ type: 'SET_AUTO_RELAX', payload: v }); sounds.click() }} />
              </div>
            </div>
          </Card>

          {/* Subject Weights */}
          {teachableSubjects.length > 0 && (
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-700">Subject Frequency</h3>
                  <p className="text-xs text-slate-500">Specify how many periods per week for each subject</p>
                </div>
                <Toggle checked={useCustomWeights} onChange={(v) => { setUseCustomWeights(v); sounds.click() }} />
              </div>
              {useCustomWeights && (
                <div className="space-y-3">
                  <div className="bg-brand-50 border border-brand-200 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-brand-700 font-medium">Slots per class: <span className="font-bold">{totalSlotsPerClass}</span></span>
                      <span className="text-brand-600">
                        Allocated: {Object.values(subjectWeights).reduce((a, b) => a + b, 0)} / {totalSlotsPerClass}
                      </span>
                    </div>
                    <div className="mt-2">
                      <ProgressBar
                        value={Object.values(subjectWeights).reduce((a, b) => a + b, 0)}
                        max={totalSlotsPerClass}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {teachableSubjects.map(subject => (
                      <div key={subject.id} className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: (subject.color || '#3b82f6') + '20', border: '2px solid ' + (subject.color || '#3b82f6') }}
                        >
                          <span className="text-xs font-bold" style={{ color: subject.color || '#3b82f6' }}>
                            {subject.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-slate-700 truncate">{subject.name}</p>
                        </div>
                        <input
                          type="number"
                          min="0"
                          max={totalSlotsPerClass}
                          value={subjectWeights[subject.id] || 0}
                          onChange={e => updateSubjectWeight(subject.id, e.target.value)}
                          className="w-16 px-2 py-1 border border-slate-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                        <span className="text-xs text-slate-400">/wk</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400">
                    Unallocated slots will be filled with even subject distribution. Set to 0 to exclude a subject.
                  </p>
                </div>
              )}
              {!useCustomWeights && (
                <p className="text-sm text-slate-400">Enable to customize how many periods each subject gets per week. Default: even distribution.</p>
              )}
            </Card>
          )}

          {/* Teacher Day-Off Preferences */}
          {state.teachers.length > 0 && (
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-700">Teacher Day-Off Preferences</h3>
                  <p className="text-xs text-slate-500">Mark days when teachers should not be scheduled</p>
                </div>
                <Toggle checked={useTeacherDayOff} onChange={(v) => { setUseTeacherDayOff(v); sounds.click() }} />
              </div>
              {useTeacherDayOff && (
                <div className="space-y-3">
                  {state.teachers.map(teacher => (
                    <div key={teacher.id} className="flex items-center gap-3">
                      <div className="w-32 flex-shrink-0">
                        <p className="text-xs font-semibold text-slate-700 truncate">{teacher.name}</p>
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {state.settings.days.map(day => {
                          const isOff = (teacherDayOff[teacher.id] || []).includes(day)
                          return (
                            <button
                              key={day}
                              onClick={() => toggleTeacherDayOff(teacher.id, day)}
                              className={
                                'px-2 py-1 rounded text-xs font-medium transition-all ' +
                                (isOff
                                  ? 'bg-red-100 text-red-700 border border-red-300'
                                  : 'bg-slate-50 text-slate-500 border border-slate-200 hover:border-slate-300')
                              }
                            >
                              {day.slice(0, 3)}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {!useTeacherDayOff && (
                <p className="text-sm text-slate-400">Enable to specify which days each teacher is unavailable.</p>
              )}
            </Card>
          )}
        </div>
      ) : (
        <Card className="p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Generation Summary</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Selected classes</span>
              <span className="font-bold text-slate-800">{selectedClassIds.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total teachers</span>
              <span className="font-bold text-slate-800">{state.teachers.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Teachable subjects</span>
              <span className="font-bold text-slate-800">{teachableSubjects.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Available rooms</span>
              <span className="font-bold text-slate-800">{state.rooms.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Days</span>
              <span className="font-bold text-slate-800">{state.settings.days.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Periods/day</span>
              <span className="font-bold text-slate-800">{teachingPeriods.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Slots per class</span>
              <span className="font-bold text-slate-800">{totalSlotsPerClass}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total slots to fill</span>
              <span className="font-bold text-brand-600">{selectedClassIds.length * totalSlotsPerClass}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
            <div className="flex items-center gap-2">
              <div className={'w-2 h-2 rounded-full ' + (avoidSameSubjectDaily ? 'bg-green-500' : 'bg-slate-300')} />
              <span className="text-xs text-slate-600">Subject variety per day</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={'w-2 h-2 rounded-full ' + (balanceTeacherLoad ? 'bg-green-500' : 'bg-slate-300')} />
              <span className="text-xs text-slate-600">Teacher load balancing</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={'w-2 h-2 rounded-full ' + (useCustomWeights ? 'bg-green-500' : 'bg-slate-300')} />
              <span className="text-xs text-slate-600">Custom subject frequency</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={'w-2 h-2 rounded-full ' + (useTeacherDayOff ? 'bg-green-500' : 'bg-slate-300')} />
              <span className="text-xs text-slate-600">Teacher day-off preferences</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-500" />
              <span className="text-xs text-slate-600">{maxRetries} retry attempts per class</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={'w-2 h-2 rounded-full ' + (state.autoRelax ? 'bg-green-500' : 'bg-slate-300')} />
              <span className="text-xs text-slate-600">Auto-relax constraints</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={'w-2 h-2 rounded-full ' + (Object.keys(state.teacherTimeOff || {}).length > 0 ? 'bg-green-500' : 'bg-slate-300')} />
              <span className="text-xs text-slate-600">Teacher time-off grid</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={'w-2 h-2 rounded-full ' + ((state.cardRelationships || []).length > 0 ? 'bg-green-500' : 'bg-slate-300')} />
              <span className="text-xs text-slate-600">Card relationships ({(state.cardRelationships || []).length})</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200">
            <Button
              variant="success"
              className="w-full"
              disabled={selectedClassIds.length === 0 || generating}
              onClick={handleGenerate}
            >
              <span className="flex items-center justify-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate Now
              </span>
            </Button>
            {selectedClassIds.length === 0 && (
              <p className="text-xs text-slate-400 text-center mt-2">Select at least one class</p>
            )}
          </div>
        </Card>
      )}

      {/* Generate Loading Overlay */}
      {generating && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm">
          <div className="w-16 h-16 rounded-xl bg-brand-600 flex items-center justify-center mb-6 animate-pulse">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">Generating Timetables...</h2>
          <p className="text-sm text-slate-500 mb-6">
            Processing class {generateProgress.current} of {generateProgress.total}
          </p>
          <div className="w-64">
            <ProgressBar value={smoothProgress} max={100} />
          </div>
          <p className="mt-4 text-xs text-slate-400">
            Running {maxRetries} optimization attempts per class
          </p>
        </div>
      )}

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
                <p className="text-xs mt-1 font-medium">
                  Fill rate: {generateStats?.totalSlots > 0 ? Math.round((generateStats.filledSlots / generateStats.totalSlots) * 100) : 0}%
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
                Try adding more teachers, assigning more subjects to existing teachers, or increasing retry attempts.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setGenerateStats(null)}>Close</Button>
            <Button onClick={() => { setGenerateStats(null); navigate('view') }}>View Timetables</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
