import React, { useState, forwardRef, useImperativeHandle } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { sounds } from '../utils/sounds.js'
import { Button, Input, Card, PageHeader, Modal, EmptyState, Badge, SkeletonCard } from '../components/UI.jsx'
import BulkImportModal from '../components/BulkImportModal.jsx'

const Pupils = forwardRef(function Pupils({ embedded, onBack, searchQuery }, ref) {
  const { state, dispatch } = useApp()
  const [loading, setLoading] = useState(false)

  const filteredPupils = state.pupils.filter(pupil =>
    pupil.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const [modalOpen, setModalOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', classId: '', address: '', phone: '', subjects: [] })

  useImperativeHandle(ref, () => ({ openAdd, openBulkImport: () => { sounds.click(); setBulkOpen(true) } }))

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', classId: '', address: '', phone: '', subjects: [] })
    sounds.click()
    setModalOpen(true)
  }

  const openEdit = (pupil) => {
    setEditing(pupil)
    setForm({ name: pupil.name, classId: pupil.classId || '', address: pupil.address || '', phone: pupil.phone || '', subjects: pupil.subjects || [] })
    sounds.click()
    setModalOpen(true)
  }

  const handleSave = () => {
    if (!form.name.trim()) {
      sounds.error()
      return
    }
    if (editing) {
      dispatch({ type: 'UPDATE_PUPIL', payload: { ...editing, ...form } })
    } else {
      dispatch({ type: 'ADD_PUPIL', payload: form })
    }
    sounds.add()
    setModalOpen(false)
  }

  const handleDelete = (id) => {
    if (confirm('Delete this pupil?')) {
      dispatch({ type: 'DELETE_PUPIL', payload: id })
      sounds.delete()
    }
  }

  const toggleSubject = (subjectId) => {
    const subjects = form.subjects.includes(subjectId)
      ? form.subjects.filter(s => s !== subjectId)
      : [...form.subjects, subjectId]
    setForm({ ...form, subjects })
    sounds.click()
  }

  const getClassName = (id) => id ? state.classes.find(c => c.id === id)?.name || 'Unknown' : '—'
  const getSubjectName = (id) => state.subjects.find(s => s.id === id)?.name || 'Unknown'
  
  const getAvailableSubjects = () => {
    if (!form.classId) return []
    return state.subjects.filter(subject => 
      !subject.classId || subject.classId === form.classId
    )
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        {!embedded ? (
          <PageHeader
            title="Pupils"
            subtitle="Loading..."
          />
        ) : null}
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
          title="Pupils"
          subtitle={`${state.pupils.length} pupil(s) registered`}
          action={
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => { sounds.click(); setBulkOpen(true) }}>Bulk Import</Button>
              <Button onClick={openAdd}>+ Add Pupil</Button>
            </div>
          }
        />
      ) : null}

      {filteredPupils.length === 0 && searchQuery ? (
        <Card className="p-6">
          <EmptyState
            icon="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            title="No pupils found"
            subtitle={`No pupils match "${searchQuery}"`}
          />
        </Card>
      ) : filteredPupils.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
            title="No pupils yet"
            subtitle="Add pupils to track their subject choices and class assignments"
            action={<Button onClick={openAdd}>+ Add Pupil</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPupils.map(pupil => (
            <Card key={pupil.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-brand-700">
                      {pupil.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{pupil.name}</p>
                    <p className="text-xs text-slate-500">Class: {getClassName(pupil.classId)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(pupil)} className="text-slate-400 hover:text-brand-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button onClick={() => handleDelete(pupil.id)} className="text-slate-400 hover:text-red-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                {pupil.address && <p className="text-xs text-slate-500">{pupil.address}</p>}
                {pupil.phone && <p className="text-xs text-slate-500">{pupil.phone}</p>}
                {pupil.subjects && pupil.subjects.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {pupil.subjects.slice(0, 4).map(sid => (
                      <Badge key={sid} color="blue">{getSubjectName(sid)}</Badge>
                    ))}
                    {pupil.subjects.length > 4 && <Badge color="slate">+{pupil.subjects.length - 4}</Badge>}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Pupil' : 'Add Pupil'}>
        <div className="space-y-4">
          <Input label="Pupil Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Enter pupil name" />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Class</label>
            <select
              value={form.classId}
              onChange={e => setForm({ ...form, classId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="">-- Select Class --</option>
              {state.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Home address" />
            <Input label="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" />
          </div>
          {getAvailableSubjects().length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Subject Choices</label>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 border border-slate-200 rounded-lg">
                {getAvailableSubjects().map(subject => (
                  <button
                    key={subject.id}
                    onClick={() => toggleSubject(subject.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      form.subjects.includes(subject.id)
                        ? 'bg-brand-100 text-brand-700 border border-brand-300'
                        : 'bg-slate-50 text-slate-500 border border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {subject.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? 'Update' : 'Add'}</Button>
          </div>
        </div>
      </Modal>

      <BulkImportModal open={bulkOpen} onClose={() => setBulkOpen(false)} type="pupils" />
    </div>
  )
})

export default Pupils
