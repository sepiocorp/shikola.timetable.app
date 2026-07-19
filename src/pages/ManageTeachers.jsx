import React, { useState, useRef, useEffect } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { sounds } from '../utils/sounds.js'
import { Button, Input, Select, Card, PageHeader, Modal, EmptyState, Badge, Tabs, SkeletonCard } from '../components/UI.jsx'
import BulkImportModal from '../components/BulkImportModal.jsx'
import TeacherConstraints from './TeacherConstraints.jsx'
import Substitutions from './Substitutions.jsx'

export default function ManageTeachers({ navigate, searchQuery }) {
  const { state, dispatch } = useApp()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000)
    return () => clearTimeout(timer)
  }, [])
  const [activeTab, setActiveTab] = useState('teachers')
  const substitutionsRef = useRef(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', subjects: [], classes: [], maxPeriods: 6, availability: {}, maxGapsPerWeek: 5, maxConsecutivePeriods: 4, maxLessonsPerDay: 8, minLessonsPerDay: 0, maxTeachingDays: 5 })
  const [showAvailability, setShowAvailability] = useState(false)
  const [showConstraints, setShowConstraints] = useState(false)
  const [viewMode, setViewMode] = useState('list')

  const filteredTeachers = state.teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', subjects: [], classes: [], maxPeriods: 6, availability: {}, maxGapsPerWeek: 5, maxConsecutivePeriods: 4, maxLessonsPerDay: 8, minLessonsPerDay: 0, maxTeachingDays: 5 })
    setShowAvailability(false)
    setShowConstraints(false)
    sounds.click()
    setModalOpen(true)
  }

  const openEdit = (teacher) => {
    setEditing(teacher)
    setForm({
      name: teacher.name,
      subjects: teacher.subjects || [],
      classes: teacher.classes || [],
      maxPeriods: teacher.maxPeriods || 6,
      availability: teacher.availability || {},
      maxGapsPerWeek: teacher.maxGapsPerWeek ?? 5,
      maxConsecutivePeriods: teacher.maxConsecutivePeriods ?? 4,
      maxLessonsPerDay: teacher.maxLessonsPerDay ?? 8,
      minLessonsPerDay: teacher.minLessonsPerDay ?? 0,
      maxTeachingDays: teacher.maxTeachingDays ?? 5,
    })
    setShowAvailability(false)
    setShowConstraints(false)
    sounds.click()
    setModalOpen(true)
  }

  const toggleAvailability = (day, periodId) => {
    sounds.click()
    const key = `${day}-${periodId}`
    setForm(f => {
      const avail = { ...(f.availability || {}) }
      if (avail[key] === false) {
        delete avail[key]
      } else {
        avail[key] = false
      }
      return { ...f, availability: avail }
    })
  }

  const isUnavailable = (day, periodId) => {
    return form.availability?.[`${day}-${periodId}`] === false
  }

  const getUnavailableCount = (availability) => {
    return Object.values(availability || {}).filter(v => v === false).length
  }

  const handleSave = () => {
    if (!form.name.trim()) {
      sounds.error()
      return
    }
    if (editing) {
      dispatch({ type: 'UPDATE_TEACHER', payload: { ...editing, ...form } })
    } else {
      dispatch({ type: 'ADD_TEACHER', payload: form })
    }
    sounds.add()
    setModalOpen(false)
  }

  const handleDelete = (id) => {
    if (confirm('Delete this teacher? This will also remove their timetable entries.')) {
      dispatch({ type: 'DELETE_TEACHER', payload: id })
      sounds.delete()
    }
  }

  const toggleSubject = (subjectId) => {
    sounds.click()
    setForm(f => ({
      ...f,
      subjects: f.subjects.includes(subjectId)
        ? f.subjects.filter(s => s !== subjectId)
        : [...f.subjects, subjectId],
    }))
  }

  const toggleClass = (classId) => {
    sounds.click()
    setForm(f => ({
      ...f,
      classes: f.classes.includes(classId)
        ? f.classes.filter(c => c !== classId)
        : [...f.classes, classId],
    }))
  }

  const getSubjectNames = (ids) => {
    return ids.map(id => state.subjects.find(s => s.id === id)?.name).filter(Boolean)
  }

  const getClassNames = (ids) => {
    return ids.map(id => state.classes.find(c => c.id === id)?.name).filter(Boolean)
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <PageHeader
          title={activeTab === 'constraints' ? 'Constraints & Time Off' : activeTab === 'substitutions' ? 'Substitutions' : 'Teachers'}
          subtitle="Loading..."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <PageHeader
        title={activeTab === 'constraints' ? 'Constraints & Time Off' : activeTab === 'substitutions' ? 'Substitutions' : 'Teachers'}
        subtitle={activeTab === 'constraints' ? 'Set teacher availability and scheduling limits' : activeTab === 'substitutions' ? 'Track absent teachers and assign substitutes' : `${state.teachers.length} teacher(s) registered`}
        action={
          <div className="flex gap-2">
            {activeTab === 'teachers' && <>
              <Button variant="secondary" onClick={() => { sounds.click(); setBulkOpen(true) }}>Bulk Import</Button>
              <Button onClick={openAdd}>+ Add Teacher</Button>
            </>}
            {activeTab === 'substitutions' && <Button onClick={() => substitutionsRef.current?.openAdd()}>+ Add Substitution</Button>}
          </div>
        }
      />

      <div className="mb-4">
        <Tabs
          tabs={[
            { id: 'teachers', label: 'Teachers' },
            { id: 'constraints', label: 'Constraints & Time Off' },
            { id: 'substitutions', label: 'Substitutions' },
          ]}
          active={activeTab}
          onChange={(id) => { setActiveTab(id); sounds.click() }}
        />
      </div>

      {activeTab === 'constraints' ? (
        <TeacherConstraints embedded navigate={navigate} />
      ) : activeTab === 'substitutions' ? (
        <Substitutions ref={substitutionsRef} embedded />
      ) : (
        <>
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => { setViewMode('list'); sounds.click() }}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg ${viewMode === 'list' ? 'bg-brand-600 text-white' : 'bg-white border border-slate-300 text-slate-600'}`}
        >List View</button>
        <button
          onClick={() => { setViewMode('grid'); sounds.click() }}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg ${viewMode === 'grid' ? 'bg-brand-600 text-white' : 'bg-white border border-slate-300 text-slate-600'}`}
        >Grid View</button>
      </div>

      {filteredTeachers.length === 0 && searchQuery ? (
        <Card className="p-6">
          <EmptyState
            icon="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            title="No teachers found"
            subtitle={`No teachers match "${searchQuery}"`}
          />
        </Card>
      ) : filteredTeachers.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            title="No teachers yet"
            subtitle="Add teachers to start building your timetables"
            action={<Button onClick={openAdd}>+ Add Teacher</Button>}
          />
        </Card>
      ) : viewMode === 'list' ? (
        <Card className="overflow-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left text-xs font-bold text-slate-600 px-4 py-3">Teacher</th>
                <th className="text-left text-xs font-bold text-slate-600 px-4 py-3">Subjects</th>
                <th className="text-left text-xs font-bold text-slate-600 px-4 py-3">Classes</th>
                <th className="text-center text-xs font-bold text-slate-600 px-4 py-3">Max Periods</th>
                <th className="text-right text-xs font-bold text-slate-600 px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.map(teacher => (
                <tr key={teacher.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-semibold text-slate-800">{teacher.name}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {teacher.subjects?.length > 0 ? getSubjectNames(teacher.subjects).join(', ') : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {teacher.classes?.length > 0 ? getClassNames(teacher.classes).join(', ') : '—'}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-slate-600">{teacher.maxPeriods || 6}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(teacher)} className="text-slate-400 hover:text-brand-600 mr-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => handleDelete(teacher.id)} className="text-slate-400 hover:text-red-500">
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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredTeachers.map(teacher => (
            <Card key={teacher.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-brand-700">
                      {teacher.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{teacher.name}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(teacher)} className="text-slate-400 hover:text-brand-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button onClick={() => handleDelete(teacher.id)} className="text-slate-400 hover:text-red-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {teacher.subjects?.length > 0 ? (
                  getSubjectNames(teacher.subjects).map(name => (
                    <Badge key={name} color="blue">{name}</Badge>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">No subjects assigned</span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {teacher.classes?.length > 0 ? (
                  getClassNames(teacher.classes).map(name => (
                    <Badge key={name} color="green">{name}</Badge>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">No classes assigned</span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-2">Max {teacher.maxPeriods || 6} periods/day</p>
              {(teacher.maxGapsPerWeek != null && teacher.maxGapsPerWeek !== 5 || teacher.maxConsecutivePeriods != null && teacher.maxConsecutivePeriods !== 4 || teacher.maxTeachingDays != null && teacher.maxTeachingDays !== 5) && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {teacher.maxGapsPerWeek != null && teacher.maxGapsPerWeek !== 5 && <Badge color="slate">Max gaps: {teacher.maxGapsPerWeek}/wk</Badge>}
                  {teacher.maxConsecutivePeriods != null && teacher.maxConsecutivePeriods !== 4 && <Badge color="slate">Max consec: {teacher.maxConsecutivePeriods}</Badge>}
                  {teacher.maxTeachingDays != null && teacher.maxTeachingDays !== 5 && <Badge color="slate">Max days: {teacher.maxTeachingDays}</Badge>}
                </div>
              )}
              {getUnavailableCount(teacher.availability) > 0 && (
                <p className="text-xs text-amber-600 mt-1">{getUnavailableCount(teacher.availability)} slot(s) blocked</p>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Teacher' : 'Add Teacher'}>
        <div className="space-y-4">
          <Input label="Full Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Enter full name" />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Subjects</label>
            <div className="flex flex-wrap gap-2">
              {state.subjects.length === 0 ? (
                <p className="text-sm text-slate-400">No subjects added yet. Add subjects first.</p>
              ) : (
                state.subjects.map(subject => (
                  <button
                    key={subject.id}
                    onClick={() => toggleSubject(subject.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm border-2 transition-all ${
                      form.subjects.includes(subject.id)
                        ? 'border-brand-600 bg-brand-50 text-brand-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {subject.name}
                  </button>
                ))
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Classes</label>
            <div className="flex flex-wrap gap-2">
              {state.classes.length === 0 ? (
                <p className="text-sm text-slate-400">No classes added yet. Add classes first.</p>
              ) : (
                state.classes.map(cls => (
                  <button
                    key={cls.id}
                    onClick={() => toggleClass(cls.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm border-2 transition-all ${
                      form.classes.includes(cls.id)
                        ? 'border-green-600 bg-green-50 text-green-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {cls.name}
                  </button>
                ))
              )}
            </div>
          </div>
          <Input label="Max Periods Per Day" type="number" value={form.maxPeriods} onChange={e => setForm({ ...form, maxPeriods: Number(e.target.value) })} min="1" max="12" />

          {/* Teacher Time Off Grid */}
          <div className="border border-slate-200 rounded-lg p-4 space-y-3">
            <button
              type="button"
              onClick={() => { setShowAvailability(!showAvailability); sounds.click() }}
              className="w-full flex items-center justify-between text-left"
            >
              <div>
                <p className="text-sm font-medium text-slate-700">Time Off Grid</p>
                <p className="text-xs text-slate-500">Mark periods when this teacher is unavailable</p>
              </div>
              <svg className={`w-5 h-5 text-slate-400 transition-transform ${showAvailability ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showAvailability && (
              <div className="overflow-auto border-t border-slate-200 pt-3">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="text-[10px] font-bold text-slate-500 px-1 py-1 text-right sticky left-0 bg-white">Day</th>
                      {state.settings.periods.filter(p => !p.isBreak).map(p => (
                        <th key={p.id} className="text-[10px] font-bold text-slate-500 px-1 py-1 text-center min-w-[40px]">{p.name.replace('Period ', 'P')}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {state.settings.days.map(day => (
                      <tr key={day}>
                        <td className="text-[10px] font-semibold text-slate-600 px-1 py-1 text-right sticky left-0 bg-white">{day.slice(0, 3)}</td>
                        {state.settings.periods.filter(p => !p.isBreak).map(p => (
                          <td key={p.id} className="px-0.5 py-0.5 text-center">
                            <button
                              type="button"
                              onClick={() => toggleAvailability(day, p.id)}
                              className={`w-7 h-7 rounded text-xs font-bold transition-all ${
                                isUnavailable(day, p.id)
                                  ? 'bg-red-100 text-red-600 border border-red-300'
                                  : 'bg-green-50 text-green-600 border border-green-200 hover:bg-green-100'
                              }`}
                              title={`${day} ${p.name}`}
                            >
                              {isUnavailable(day, p.id) ? '✕' : '✓'}
                            </button>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-slate-400 mt-2">Green = available, Red = unavailable. Click to toggle.</p>
                {getUnavailableCount(form.availability) > 0 && (
                  <p className="text-xs text-amber-600 mt-1">{getUnavailableCount(form.availability)} slot(s) marked unavailable</p>
                )}
              </div>
            )}
          </div>

          {/* Teacher Constraints */}
          <div className="border border-slate-200 rounded-lg p-4 space-y-3">
            <button
              type="button"
              onClick={() => { setShowConstraints(!showConstraints); sounds.click() }}
              className="w-full flex items-center justify-between text-left"
            >
              <div>
                <p className="text-sm font-medium text-slate-700">Advanced Constraints</p>
                <p className="text-xs text-slate-500">Max gaps, consecutive periods, teaching days, etc.</p>
              </div>
              <svg className={`w-5 h-5 text-slate-400 transition-transform ${showConstraints ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showConstraints && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-200 pt-3">
                <Input label="Max Gaps / Week" type="number" value={form.maxGapsPerWeek} onChange={e => setForm({ ...form, maxGapsPerWeek: Number(e.target.value) })} min="0" max="20" />
                <Input label="Max Consecutive Periods" type="number" value={form.maxConsecutivePeriods} onChange={e => setForm({ ...form, maxConsecutivePeriods: Number(e.target.value) })} min="1" max="10" />
                <Input label="Max Lessons / Day" type="number" value={form.maxLessonsPerDay} onChange={e => setForm({ ...form, maxLessonsPerDay: Number(e.target.value) })} min="1" max="12" />
                <Input label="Min Lessons / Day" type="number" value={form.minLessonsPerDay} onChange={e => setForm({ ...form, minLessonsPerDay: Number(e.target.value) })} min="0" max="12" />
                <Input label="Max Teaching Days" type="number" value={form.maxTeachingDays} onChange={e => setForm({ ...form, maxTeachingDays: Number(e.target.value) })} min="1" max="7" />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? 'Update' : 'Add'}</Button>
          </div>
        </div>
      </Modal>

      <BulkImportModal open={bulkOpen} onClose={() => setBulkOpen(false)} type="teachers" />
        </>
      )}
    </div>
  )
}
