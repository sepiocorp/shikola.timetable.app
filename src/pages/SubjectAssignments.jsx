import React, { useState, useMemo, forwardRef, useImperativeHandle } from 'react'
import { useApp, getScheduleForClass } from '../store/AppContext.jsx'
import { sounds } from '../utils/sounds.js'
import { Button, Input, Card, PageHeader, Modal, EmptyState, Badge, Tabs } from '../components/UI.jsx'

const SubjectAssignments = forwardRef(function SubjectAssignments({ embedded, onBack, navigate }, ref) {
  const { state, dispatch } = useApp()
  const [tab, setTab] = useState('byClass')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ classId: '', subjectId: '', periodsPerWeek: 1, maxPerDay: 0, teacherId: '' })

  const assignmentsForClass = useMemo(() => {
    if (!selectedClassId) return []
    return state.subjectAssignments.filter(a => a.classId === selectedClassId)
  }, [state.subjectAssignments, selectedClassId])

  useImperativeHandle(ref, () => ({ openAdd }))

  const openAdd = () => {
    setEditing(null)
    setForm({ classId: selectedClassId || '', subjectId: '', periodsPerWeek: 1, maxPerDay: 0, teacherId: '' })
    sounds.click()
    setModalOpen(true)
  }

  const openEdit = (assignment) => {
    setEditing(assignment)
    setForm({ classId: assignment.classId, subjectId: assignment.subjectId, periodsPerWeek: assignment.periodsPerWeek, maxPerDay: assignment.maxPerDay || 0, teacherId: assignment.teacherId || '' })
    sounds.click()
    setModalOpen(true)
  }

  const handleSave = () => {
    const periods = Number(form.periodsPerWeek)
    const selectedTeacher = form.teacherId ? state.teachers.find(t => t.id === form.teacherId) : null
    if (!form.classId || !form.subjectId || !Number.isInteger(periods) || periods < 1) {
      sounds.error()
      return
    }
    if (selectedTeacher && !selectedTeacher.subjects?.includes(form.subjectId)) {
      sounds.error()
      return
    }
    const payload = { ...form, periodsPerWeek: periods }
    if (editing) {
      dispatch({ type: 'UPDATE_SUBJECT_ASSIGNMENT', payload: { ...editing, ...payload } })
    } else {
      dispatch({ type: 'ADD_SUBJECT_ASSIGNMENT', payload })
    }
    sounds.add()
    setModalOpen(false)
  }

  const handleDelete = (id) => {
    if (confirm('Remove this subject assignment?')) {
      dispatch({ type: 'DELETE_SUBJECT_ASSIGNMENT', payload: id })
      sounds.delete()
    }
  }

  const getSubjectName = (id) => state.subjects.find(s => s.id === id)?.name || 'Unknown'
  const getSubjectColor = (id) => state.subjects.find(s => s.id === id)?.color || '#3b82f6'
  const getTeacherName = (id) => state.teachers.find(t => t.id === id)?.name || ''
  const getClassName = (id) => state.classes.find(c => c.id === id)?.name || 'Unknown'

  const getTeachersForSubject = (subjectId) => state.teachers.filter(t => t.subjects?.includes(subjectId))

  const totalPeriodsForClass = (classId) => {
    return state.subjectAssignments
      .filter(a => a.classId === classId)
      .reduce((sum, a) => sum + (a.periodsPerWeek || 0), 0)
  }

  const getTotalSlotsForClass = (classId) => {
    const schedule = getScheduleForClass(state, classId)
    return schedule.days.length * schedule.periods.filter(p => !p.isBreak).length
  }

  const totalSlotsPerClass = selectedClassId
    ? getTotalSlotsForClass(selectedClassId)
    : state.settings.days.length * state.settings.periods.filter(p => !p.isBreak).length

  const allAssignmentsByClass = useMemo(() => {
    return state.classes.map(cls => ({
      cls,
      assignments: state.subjectAssignments.filter(a => a.classId === cls.id),
      total: totalPeriodsForClass(cls.id),
      slots: getTotalSlotsForClass(cls.id),
    }))
  }, [state.classes, state.subjectAssignments, state.sections, state.settings])

  return (
    <div className="p-4 md:p-8">
      {state.classes.length === 0 || state.subjects.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            title="Missing data"
            subtitle="You need classes and subjects before you can assign subjects to classes"
            action={navigate && (
              <div className="flex gap-2">
                {state.classes.length === 0 && <Button size="sm" onClick={() => navigate('classes')}>Add Classes</Button>}
                {state.subjects.length === 0 && <Button size="sm" onClick={() => navigate('subjects')}>Add Subjects</Button>}
              </div>
            )}
          />
        </Card>
      ) : (
        <>
          <div className="mb-4">
            <Tabs
              tabs={[
                { id: 'byClass', label: 'By Class' },
                { id: 'overview', label: 'Overview (All Classes)' },
              ]}
              active={tab}
              onChange={(id) => { setTab(id); sounds.click() }}
              action={
                <Button onClick={openAdd} disabled={state.classes.length === 0 || state.subjects.length === 0}>
                  + Add Assignment
                </Button>
              }
            />
          </div>

          {tab === 'byClass' ? (
            <div className="space-y-4">
              <Card className="p-4">
                <div className="flex items-center gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Select Class</label>
                    <select
                      value={selectedClassId}
                      onChange={e => { setSelectedClassId(e.target.value); sounds.click() }}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white min-w-[250px]"
                    >
                      <option value="">-- Select Class --</option>
                      {state.classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  {selectedClassId && (
                    <div className="ml-auto flex items-center gap-4">
                      <div className="text-sm">
                        <span className="text-slate-500">Total: </span>
                        <span className="font-bold text-slate-800">{totalPeriodsForClass(selectedClassId)}</span>
                        <span className="text-slate-400"> / {totalSlotsPerClass} periods/wk</span>
                      </div>
                      <Button size="sm" onClick={openAdd}>+ Add Subject</Button>
                    </div>
                  )}
                </div>
              </Card>

              {!selectedClassId ? (
                <Card className="p-6">
                  <EmptyState
                    icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"
                    title="Select a class"
                    subtitle="Choose a class to view and manage its subject assignments"
                  />
                </Card>
              ) : assignmentsForClass.length === 0 ? (
                <Card className="p-6">
                  <EmptyState
                    icon="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    title="No subjects assigned"
                    subtitle="Add subjects to this class to control how many periods each subject gets per week"
                    action={<Button onClick={openAdd}>+ Add Subject</Button>}
                  />
                </Card>
              ) : (
                <Card className="overflow-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left text-xs font-bold text-slate-600 px-4 py-3">Subject</th>
                        <th className="text-left text-xs font-bold text-slate-600 px-4 py-3">Assigned Teacher</th>
                        <th className="text-center text-xs font-bold text-slate-600 px-4 py-3">Periods/Week</th>
                        <th className="text-center text-xs font-bold text-slate-600 px-4 py-3">Max/Day</th>
                        <th className="text-right text-xs font-bold text-slate-600 px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignmentsForClass.map(a => (
                        <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm font-medium text-slate-800">
                            <span className="inline-flex items-center gap-2">
                              <span className="w-3 h-3 rounded" style={{ backgroundColor: getSubjectColor(a.subjectId) }} />
                              {getSubjectName(a.subjectId)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">{getTeacherName(a.teacherId) || '— Auto —'}</td>
                          <td className="px-4 py-3 text-center">
                            <Badge color="blue">{a.periodsPerWeek}</Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {a.maxPerDay ? <Badge color="purple">{a.maxPerDay}</Badge> : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => openEdit(a)} className="text-slate-400 hover:text-brand-600 mr-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button onClick={() => handleDelete(a.id)} className="text-slate-400 hover:text-red-500">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              )}
            </div>
          ) : (
            <Card className="overflow-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left text-xs font-bold text-slate-600 px-4 py-3 sticky left-0 bg-slate-50">Class</th>
                    {state.subjects.map(s => (
                      <th key={s.id} className="text-center text-xs font-bold text-slate-600 px-2 py-3 min-w-[80px]">
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2 h-2 rounded" style={{ backgroundColor: s.color || '#3b82f6' }} />
                          {s.name}
                        </span>
                      </th>
                    ))}
                    <th className="text-center text-xs font-bold text-slate-600 px-4 py-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {allAssignmentsByClass.map(({ cls, assignments, total, slots }) => (
                    <tr key={cls.id} className="border-b border-slate-100">
                      <td className="px-4 py-3 text-sm font-semibold text-slate-800 sticky left-0 bg-white">{cls.name}</td>
                      {state.subjects.map(s => {
                        const a = assignments.find(x => x.subjectId === s.id)
                        return (
                          <td key={s.id} className="px-2 py-3 text-center text-sm">
                            {a ? <Badge color="blue">{a.periodsPerWeek}</Badge> : <span className="text-slate-300">—</span>}
                          </td>
                        )
                      })}
                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm font-bold ${total > slots ? 'text-red-600' : 'text-slate-800'}`}>
                          {total}
                        </span>
                        <span className="text-xs text-slate-400"> / {slots}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Assignment' : 'Add Subject Assignment'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Class *</label>
            <select
              value={form.classId}
              onChange={e => setForm({ ...form, classId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="">-- Select Class --</option>
              {state.classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Subject *</label>
            <select
              value={form.subjectId}
              onChange={e => setForm({ ...form, subjectId: e.target.value, teacherId: '' })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="">-- Select Subject --</option>
              {state.subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Periods per Week *"
              type="number"
              value={form.periodsPerWeek}
              onChange={e => setForm({ ...form, periodsPerWeek: Math.max(1, Number(e.target.value)) })}
              min="1"
              max={totalSlotsPerClass}
            />
            <Input
              label="Max Periods per Day"
              type="number"
              value={form.maxPerDay}
              onChange={e => setForm({ ...form, maxPerDay: Math.max(0, Number(e.target.value)) })}
              min="0"
              max={totalSlotsPerClass}
            />
          </div>
          {form.maxPerDay > 0 && (
            <p className="text-xs text-slate-400 -mt-2">Set to 0 for no daily limit. The generator will not schedule more than this many periods of this subject on any single day.</p>
          )}
          {form.subjectId && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Teacher (optional)</label>
              <select
                value={form.teacherId}
                onChange={e => setForm({ ...form, teacherId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="">— Auto-assign —</option>
                {getTeachersForSubject(form.subjectId).map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-1">Choose a teacher to require that teacher for every period of this subject in this class. Leave empty for automatic selection.</p>
            </div>
          )}
          <div className="bg-brand-50 border border-brand-200 rounded-lg p-3 text-xs text-brand-700">
            These assignments are exact weekly requirements for this class. The generator will schedule only the periods listed here, respect the max-per-day limit, and will respect the selected class section's morning or afternoon timetable.
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? 'Update' : 'Add'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
})

export default SubjectAssignments
