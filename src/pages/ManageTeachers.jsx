import React, { useState } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { sounds } from '../utils/sounds.js'
import { Button, Input, Select, Card, PageHeader, Modal, EmptyState, Badge } from '../components/UI.jsx'
import BulkImportModal from '../components/BulkImportModal.jsx'

export default function ManageTeachers() {
  const { state, dispatch } = useApp()
  const [modalOpen, setModalOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', code: '', subjects: [], maxPeriods: 6 })

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', code: '', subjects: [], maxPeriods: 6 })
    sounds.click()
    setModalOpen(true)
  }

  const openEdit = (teacher) => {
    setEditing(teacher)
    setForm({ name: teacher.name, code: teacher.code || '', subjects: teacher.subjects || [], maxPeriods: teacher.maxPeriods || 6 })
    sounds.click()
    setModalOpen(true)
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

  const getSubjectNames = (ids) => {
    return ids.map(id => state.subjects.find(s => s.id === id)?.name).filter(Boolean)
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Teachers"
        subtitle={`${state.teachers.length} teacher(s) registered`}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => { sounds.click(); setBulkOpen(true) }}>Bulk Import</Button>
            <Button onClick={openAdd}>+ Add Teacher</Button>
          </div>
        }
      />

      {state.teachers.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            title="No teachers yet"
            subtitle="Add teachers to start building your timetables"
            action={<Button onClick={openAdd}>+ Add Teacher</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {state.teachers.map(teacher => (
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
                    {teacher.code && <p className="text-xs text-slate-500">Code: {teacher.code}</p>}
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
              <p className="text-xs text-slate-400 mt-2">Max {teacher.maxPeriods || 6} periods/day</p>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Teacher' : 'Add Teacher'}>
        <div className="space-y-4">
          <Input label="Full Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Enter full name" />
          <Input label="Teacher Code" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="Enter teacher code" />
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
          <Input label="Max Periods Per Day" type="number" value={form.maxPeriods} onChange={e => setForm({ ...form, maxPeriods: Number(e.target.value) })} min="1" max="12" />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? 'Update' : 'Add'}</Button>
          </div>
        </div>
      </Modal>

      <BulkImportModal open={bulkOpen} onClose={() => setBulkOpen(false)} type="teachers" />
    </div>
  )
}
