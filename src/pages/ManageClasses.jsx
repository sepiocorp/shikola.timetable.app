import React, { useState } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { sounds } from '../utils/sounds.js'
import { Button, Input, Card, PageHeader, Modal, EmptyState, Badge } from '../components/UI.jsx'
import BulkImportModal from '../components/BulkImportModal.jsx'

export default function ManageClasses() {
  const { state, dispatch } = useApp()
  const [modalOpen, setModalOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', grade: '', section: '', classTeacher: '', sectionId: '' })

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', grade: '', section: '', classTeacher: '', sectionId: '' })
    sounds.click()
    setModalOpen(true)
  }

  const openEdit = (cls) => {
    setEditing(cls)
    setForm({ name: cls.name, grade: cls.grade || '', section: cls.section || '', classTeacher: cls.classTeacher || '', sectionId: cls.sectionId || '' })
    sounds.click()
    setModalOpen(true)
  }

  const handleSave = () => {
    if (!form.name.trim()) {
      sounds.error()
      return
    }
    if (editing) {
      dispatch({ type: 'UPDATE_CLASS', payload: { ...editing, ...form } })
    } else {
      dispatch({ type: 'ADD_CLASS', payload: form })
    }
    sounds.add()
    setModalOpen(false)
  }

  const handleDelete = (id) => {
    if (confirm('Delete this class? This will also remove its timetable entries.')) {
      dispatch({ type: 'DELETE_CLASS', payload: id })
      sounds.delete()
    }
  }

  const getTeacherName = (id) => state.teachers.find(t => t.id === id)?.name

  return (
    <div className="p-8">
      <PageHeader
        title="Classes"
        subtitle={`${state.classes.length} class(es) registered`}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => { sounds.click(); setBulkOpen(true) }}>Bulk Import</Button>
            <Button onClick={openAdd}>+ Add Class</Button>
          </div>
        }
      />

      {state.classes.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            title="No classes yet"
            subtitle="Add classes to start building your timetables"
            action={<Button onClick={openAdd}>+ Add Class</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {state.classes.map(cls => (
            <Card key={cls.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-brand-700">
                      {cls.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{cls.name}</p>
                    {cls.grade && <p className="text-xs text-slate-500">Grade: {cls.grade}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(cls)} className="text-slate-400 hover:text-brand-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button onClick={() => handleDelete(cls.id)} className="text-slate-400 hover:text-red-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                {cls.section && <Badge color="slate">Section: {cls.section}</Badge>}
                {cls.sectionId && (() => {
                  const sec = state.sections.find(s => s.id === cls.sectionId)
                  return sec ? <Badge color="blue">{sec.name}</Badge> : null
                })()}
                {cls.classTeacher && (
                  <p className="text-xs text-slate-500">Class Teacher: {getTeacherName(cls.classTeacher) || 'Unknown'}</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Class' : 'Add Class'}>
        <div className="space-y-4">
          <Input label="Class Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Enter class name" />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">School Section</label>
            <select
              value={form.sectionId}
              onChange={e => setForm({ ...form, sectionId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="">Default (no section)</option>
              {state.sections.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">Assign a section if this class follows a different schedule (e.g., Primary vs Secondary).</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Grade" value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} placeholder="Enter grade" />
            <Input label="Section Label" value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} placeholder="e.g., A, B" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Class Teacher</label>
            <select
              value={form.classTeacher}
              onChange={e => setForm({ ...form, classTeacher: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="">-- Select Teacher --</option>
              {state.teachers.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? 'Update' : 'Add'}</Button>
          </div>
        </div>
      </Modal>

      <BulkImportModal open={bulkOpen} onClose={() => setBulkOpen(false)} type="classes" />
    </div>
  )
}
