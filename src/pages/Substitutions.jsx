import React, { useState, forwardRef, useImperativeHandle } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { sounds } from '../utils/sounds.js'
import { Button, Card, PageHeader, Modal, EmptyState, Badge, Select } from '../components/UI.jsx'

const SUBSTITUTION_CRITERIA = [
  { value: 'same_subject', label: 'Same subject teacher' },
  { value: 'class_teacher', label: 'Class teacher' },
  { value: 'any_available', label: 'Any available teacher' },
  { value: 'least_loaded', label: 'Least loaded teacher' },
]

const Substitutions = forwardRef(function Substitutions({ embedded, onBack }, ref) {
  const { state, dispatch } = useApp()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    absentTeacherId: '',
    date: '',
    day: '',
    periodId: '',
    classId: '',
    subjectId: '',
    substituteTeacherId: '',
    criteria: 'same_subject',
    reason: '',
    status: 'pending',
  })

  useImperativeHandle(ref, () => ({ openAdd }))

  const openAdd = () => {
    setEditing(null)
    setForm({
      absentTeacherId: '',
      date: '',
      day: '',
      periodId: '',
      classId: '',
      subjectId: '',
      substituteTeacherId: '',
      criteria: 'same_subject',
      reason: '',
      status: 'pending',
    })
    sounds.click()
    setModalOpen(true)
  }

  const openEdit = (sub) => {
    setEditing(sub)
    setForm({ ...sub })
    sounds.click()
    setModalOpen(true)
  }

  const handleSave = () => {
    if (!form.absentTeacherId || !form.day || !form.periodId) {
      sounds.error()
      return
    }
    if (editing) {
      dispatch({ type: 'UPDATE_SUBSTITUTION', payload: { ...editing, ...form } })
    } else {
      dispatch({ type: 'ADD_SUBSTITUTION', payload: form })
    }
    sounds.add()
    setModalOpen(false)
  }

  const handleDelete = (id) => {
    if (confirm('Delete this substitution record?')) {
      dispatch({ type: 'DELETE_SUBSTITUTION', payload: id })
      sounds.delete()
    }
  }

  const getTeacherName = (id) => state.teachers.find(t => t.id === id)?.name || '—'
  const getClassName = (id) => id ? (state.classes.find(c => c.id === id)?.name || '—') : '—'
  const getSubjectName = (id) => id ? (state.subjects.find(s => s.id === id)?.name || '—') : '—'
  const getPeriodName = (id) => {
    const p = state.settings.periods.find(p => p.id === id)
    return p ? p.name : '—'
  }

  // Find available substitute teachers based on criteria
  const findSubstituteCandidates = () => {
    if (!form.absentTeacherId || !form.day || !form.periodId) return []

    const slotKey = `${form.day}-${form.periodId}`
    const busyTeacherIds = new Set()

    // Find teachers already teaching at this slot
    for (const e of state.timetable) {
      if (e.day === form.day && e.periodId === form.periodId) {
        if (e.teacherId) busyTeacherIds.add(e.teacherId)
        if (e.secondaryTeacherId) busyTeacherIds.add(e.secondaryTeacherId)
      }
    }

    // Check availability grid
    const availableTeachers = state.teachers.filter(t => {
      if (t.id === form.absentTeacherId) return false
      if (busyTeacherIds.has(t.id)) return false
      if (t.availability?.[slotKey] === false) return false
      return true
    })

    if (form.criteria === 'same_subject' && form.subjectId) {
      return availableTeachers.filter(t => t.subjects?.includes(form.subjectId))
    }
    if (form.criteria === 'least_loaded') {
      const counts = {}
      for (const e of state.timetable) {
        if (e.teacherId) counts[e.teacherId] = (counts[e.teacherId] || 0) + 1
      }
      return availableTeachers.sort((a, b) => (counts[a.id] || 0) - (counts[b.id] || 0))
    }
    return availableTeachers
  }

  const candidates = form.absentTeacherId && form.day && form.periodId ? findSubstituteCandidates() : []

  // Auto-find affected entries when teacher + day selected
  const affectedEntries = form.absentTeacherId && form.day
    ? state.timetable.filter(e => e.day === form.day && (e.teacherId === form.absentTeacherId || e.secondaryTeacherId === form.absentTeacherId))
    : []

  const teachingPeriods = state.settings.periods.filter(p => !p.isBreak)

  return (
    <div className="p-4 md:p-8">
      {!embedded ? (
        <PageHeader
          title="Substitutions"
          subtitle="Track absent teachers and assign substitutes"
          action={
            <div className="flex gap-2">
              <Button onClick={openAdd}>+ Add Substitution</Button>
            </div>
          }
        />
      ) : null}

      {state.substitutions.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            title="No substitutions yet"
            subtitle="Record absent teachers and find available substitutes"
            action={<Button onClick={openAdd}>+ Add Substitution</Button>}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {state.substitutions.map(sub => (
            <Card key={sub.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${sub.status === 'resolved' ? 'bg-green-100' : 'bg-amber-100'}`}>
                    <svg className={`w-5 h-5 ${sub.status === 'resolved' ? 'text-green-600' : 'text-amber-600'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      {sub.status === 'resolved'
                        ? <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        : <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />}
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-800">{getTeacherName(sub.absentTeacherId)}</p>
                      <Badge color={sub.status === 'resolved' ? 'green' : 'amber'}>{sub.status}</Badge>
                      <Badge color="slate">{sub.day}</Badge>
                      <Badge color="blue">{getPeriodName(sub.periodId)}</Badge>
                    </div>
                    <div className="mt-1 text-xs text-slate-500 space-y-0.5">
                      {sub.classId && <p>Class: {getClassName(sub.classId)}</p>}
                      {sub.subjectId && <p>Subject: {getSubjectName(sub.subjectId)}</p>}
                      {sub.substituteTeacherId && <p>Substitute: <span className="font-medium text-green-600">{getTeacherName(sub.substituteTeacherId)}</span></p>}
                      {sub.reason && <p>Reason: {sub.reason}</p>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(sub)} className="text-slate-400 hover:text-brand-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button onClick={() => handleDelete(sub.id)} className="text-slate-400 hover:text-red-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Substitution' : 'Add Substitution'} maxWidth="max-w-xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Absent Teacher *</label>
            <select
              value={form.absentTeacherId}
              onChange={e => setForm({ ...form, absentTeacherId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="">-- Select Teacher --</option>
              {state.teachers.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Day *</label>
              <select
                value={form.day}
                onChange={e => setForm({ ...form, day: e.target.value, periodId: '', classId: '', subjectId: '' })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="">-- Select Day --</option>
                {state.settings.days.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Period *</label>
              <select
                value={form.periodId}
                onChange={e => setForm({ ...form, periodId: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="">-- Select Period --</option>
                {teachingPeriods.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.start}-{p.end})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Affected entries */}
          {affectedEntries.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-amber-700 mb-2">Affected lessons ({affectedEntries.length}):</p>
              <div className="space-y-1">
                {affectedEntries.map(e => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => setForm({ ...form, classId: e.classId, subjectId: e.subjectId })}
                    className="block w-full text-left text-xs text-amber-600 hover:text-amber-800"
                  >
                    {getClassName(e.classId)} - {getSubjectName(e.subjectId)} ({getPeriodName(e.periodId)})
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Class</label>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
              <select
                value={form.subjectId}
                onChange={e => setForm({ ...form, subjectId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="">-- Select Subject --</option>
                {state.subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Substitution Criteria</label>
            <select
              value={form.criteria}
              onChange={e => setForm({ ...form, criteria: e.target.value, substituteTeacherId: '' })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              {SUBSTITUTION_CRITERIA.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {candidates.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-green-700 mb-2">Available substitutes ({candidates.length}):</p>
              <div className="flex flex-wrap gap-2">
                {candidates.slice(0, 8).map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => { setForm({ ...form, substituteTeacherId: t.id, status: 'resolved' }); sounds.click() }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition-all ${
                      form.substituteTeacherId === t.id
                        ? 'border-green-600 bg-green-100 text-green-700'
                        : 'border-green-200 text-green-600 hover:border-green-300'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {form.absentTeacherId && form.day && form.periodId && candidates.length === 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs text-red-600">No available substitute teachers found for this slot.</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
            <input
              type="text"
              value={form.reason}
              onChange={e => setForm({ ...form, reason: e.target.value })}
              placeholder="e.g., Sick leave, Personal, Duty"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select
              value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="cancelled">Cancelled</option>
            </select>
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

export default Substitutions
