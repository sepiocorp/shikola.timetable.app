import React, { useState } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { sounds } from '../utils/sounds.js'
import { Button, Input, Card, PageHeader, Modal, EmptyState } from '../components/UI.jsx'
import BulkImportModal from '../components/BulkImportModal.jsx'

const COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Indigo', value: '#6366f1' },
]

export default function ManageSubjects() {
  const { state, dispatch } = useApp()
  const [modalOpen, setModalOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', code: '', color: '#3b82f6', isOptional: false, secondaryClassId: '' })

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', code: '', color: '#3b82f6', isOptional: false, secondaryClassId: '' })
    sounds.click()
    setModalOpen(true)
  }

  const openEdit = (subject) => {
    setEditing(subject)
    setForm({ name: subject.name, code: subject.code || '', color: subject.color || '#3b82f6', isOptional: subject.isOptional || false, secondaryClassId: subject.secondaryClassId || '' })
    sounds.click()
    setModalOpen(true)
  }

  const handleSave = () => {
    if (!form.name.trim()) {
      sounds.error()
      return
    }
    if (editing) {
      dispatch({ type: 'UPDATE_SUBJECT', payload: { ...editing, ...form } })
    } else {
      dispatch({ type: 'ADD_SUBJECT', payload: form })
    }
    sounds.add()
    setModalOpen(false)
  }

  const handleDelete = (id) => {
    if (confirm('Delete this subject?')) {
      dispatch({ type: 'DELETE_SUBJECT', payload: id })
      sounds.delete()
    }
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Subjects"
        subtitle={`${state.subjects.length} subject(s) registered`}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => { sounds.click(); setBulkOpen(true) }}>Bulk Import</Button>
            <Button onClick={openAdd}>+ Add Subject</Button>
          </div>
        }
      />

      {state.subjects.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            title="No subjects yet"
            subtitle="Add subjects that will be taught in your school"
            action={<Button onClick={openAdd}>+ Add Subject</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {state.subjects.map(subject => (
            <Card key={subject.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: subject.color + '20', border: `2px solid ${subject.color}` }}>
                    <span className="text-sm font-bold" style={{ color: subject.color }}>
                      {subject.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{subject.name}</p>
                    {subject.code && <p className="text-xs text-slate-500">Code: {subject.code}</p>}
                    {subject.isOptional && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">Optional</span>
                        {subject.secondaryClassId && (
                          <span className="text-[10px] text-slate-500">
                            → {state.classes.find(c => c.id === subject.secondaryClassId)?.name || 'Unknown'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(subject)} className="text-slate-400 hover:text-brand-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button onClick={() => handleDelete(subject.id)} className="text-slate-400 hover:text-red-500">
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Subject' : 'Add Subject'}>
        <div className="space-y-4">
          <Input label="Subject Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Enter subject name" />
          <Input label="Subject Code" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="Enter subject code" />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(color => (
                <button
                  key={color.value}
                  onClick={() => { setForm({ ...form, color: color.value }); sounds.click() }}
                  className={`w-8 h-8 rounded-lg transition-all ${form.color === color.value ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Optional Subject */}
          <div className="border border-slate-200 rounded-lg p-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isOptional}
                onChange={e => { setForm({ ...form, isOptional: e.target.checked, secondaryClassId: e.target.checked ? form.secondaryClassId : '' }); sounds.click() }}
                className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <div>
                <p className="text-sm font-medium text-slate-700">Optional Subject</p>
                <p className="text-xs text-slate-500">Mark if not all students take this subject. Specify a secondary class for the other group.</p>
              </div>
            </label>
            {form.isOptional && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Secondary Class</label>
                <select
                  value={form.secondaryClassId}
                  onChange={e => { setForm({ ...form, secondaryClassId: e.target.value }); sounds.click() }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="">-- Select Secondary Class --</option>
                  {state.classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">Students not taking this subject will attend the secondary class at the same time.</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? 'Update' : 'Add'}</Button>
          </div>
        </div>
      </Modal>

      <BulkImportModal open={bulkOpen} onClose={() => setBulkOpen(false)} type="subjects" />
    </div>
  )
}
