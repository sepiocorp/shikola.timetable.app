import React, { useState, useRef, useEffect } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { sounds } from '../utils/sounds.js'
import { Button, Input, Card, PageHeader, Modal, EmptyState, Tabs, SkeletonCard } from '../components/UI.jsx'
import BulkImportModal from '../components/BulkImportModal.jsx'
import CardRelationships from './CardRelationships.jsx'
import SubjectAssignments from './SubjectAssignments.jsx'

const COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Teal', value: '#14b8a6' },
]

export default function ManageSubjects({ navigate, searchQuery }) {
  const { state, dispatch } = useApp()
  const [loading, setLoading] = useState(false)

  const filteredSubjects = state.subjects.filter(subject =>
    subject.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const [activeTab, setActiveTab] = useState('subjects')
  const relationshipsRef = useRef(null)
  const assignmentsRef = useRef(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', departmentId: '', color: '#3b82f6', classId: '', isOptional: false, secondarySubjectId: '' })
  const [newSubjectId, setNewSubjectId] = useState(null)
  const [showAddSecondary, setShowAddSecondary] = useState(false)
  const [newSecondaryName, setNewSecondaryName] = useState('')

  // Watch for newly added subjects and auto-select as secondary subject
  useEffect(() => {
    if (newSubjectId === 'pending' && state.subjects.length > 0) {
      // Get the last added subject
      const lastSubject = state.subjects[state.subjects.length - 1]
      if (lastSubject) {
        setForm({ ...form, secondarySubjectId: lastSubject.id })
        setNewSubjectId(null)
      }
    }
  }, [state.subjects, newSubjectId, form])

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', departmentId: '', color: '#3b82f6', classId: '', isOptional: false, secondarySubjectId: '' })
    sounds.click()
    setModalOpen(true)
  }

  const openEdit = (subject) => {
    setEditing(subject)
    setForm({ name: subject.name, departmentId: subject.departmentId || '', color: subject.color || '#3b82f6', classId: subject.classId || '', isOptional: subject.isOptional || false, secondarySubjectId: subject.secondarySubjectId || '' })
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

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <PageHeader
          title={activeTab === 'relationships' ? 'Card Relationships' : activeTab === 'assignments' ? 'Subject Assignments' : 'Subjects'}
          subtitle="Loading..."
        />
        <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-4">
        <Tabs
          tabs={[
            { id: 'subjects', label: 'Subjects' },
            { id: 'relationships', label: 'Card Relationships' },
            { id: 'assignments', label: 'Subject Assignments' },
          ]}
          active={activeTab}
          onChange={(id) => { setActiveTab(id); sounds.click() }}
          action={
            <div className="flex gap-2 items-center">
              {activeTab === 'subjects' && <>
                <Button variant="secondary" onClick={() => { sounds.click(); setBulkOpen(true) }}>Bulk Import</Button>
                <Button onClick={openAdd}>+ Add Subject</Button>
              </>}
              {activeTab === 'relationships' && <Button onClick={() => relationshipsRef.current?.openAdd()}>+ Add Rule</Button>}
              {activeTab === 'assignments' && <Button onClick={() => assignmentsRef.current?.openAdd()} disabled={state.classes.length === 0 || state.subjects.length === 0}>+ Add Assignment</Button>}
            </div>
          }
        />
      </div>

      {activeTab === 'relationships' ? (
        <CardRelationships ref={relationshipsRef} embedded />
      ) : activeTab === 'assignments' ? (
        <SubjectAssignments ref={assignmentsRef} embedded navigate={navigate} />
      ) : (
        <>
      {filteredSubjects.length === 0 && searchQuery ? (
        <Card className="p-6">
          <EmptyState
            icon="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            title="No subjects found"
            subtitle={`No subjects match "${searchQuery}"`}
          />
        </Card>
      ) : filteredSubjects.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            title="No subjects yet"
            subtitle="Add subjects that will be taught in your school"
            action={<Button onClick={openAdd}>+ Add Subject</Button>}
          />
        </Card>
      ) : (
        <Card className="overflow-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left text-xs font-bold text-slate-600 px-4 py-3">Subject</th>
                <th className="text-left text-xs font-bold text-slate-600 px-4 py-3">Department</th>
                <th className="text-left text-xs font-bold text-slate-600 px-4 py-3">Class</th>
                <th className="text-center text-xs font-bold text-slate-600 px-4 py-3">Optional</th>
                <th className="text-right text-xs font-bold text-slate-600 px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubjects.map(subject => (
                <tr key={subject.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-semibold text-slate-800">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-3 h-3 rounded" style={{ backgroundColor: subject.color || '#3b82f6' }} />
                      {subject.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{subject.departmentId ? (state.departments.find(d => d.id === subject.departmentId)?.name || 'Unknown') : <span className="text-slate-300">—</span>}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{subject.classId ? (state.classes.find(c => c.id === subject.classId)?.name || 'Unknown') : <span className="text-slate-300">All</span>}</td>
                  <td className="px-4 py-3 text-center">{subject.isOptional ? <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">Optional</span> : <span className="text-slate-300">—</span>}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(subject)} className="text-slate-400 hover:text-brand-600 mr-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => handleDelete(subject.id)} className="text-slate-400 hover:text-red-500">
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Subject' : 'Add Subject'}>
        <div className="space-y-4">
          <Input label="Subject Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Enter subject name" />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
            <select
              value={form.departmentId}
              onChange={e => { setForm({ ...form, departmentId: e.target.value }); sounds.click() }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="">-- No Department --</option>
              {state.departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">Assign this subject to a department (optional).</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Class</label>
            <select
              value={form.classId}
              onChange={e => { setForm({ ...form, classId: e.target.value }); sounds.click() }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="">-- All Classes --</option>
              {state.classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">Assign this subject to a specific class, or leave as "All Classes" if it applies to all.</p>
          </div>
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
                onChange={e => { setForm({ ...form, isOptional: e.target.checked, secondarySubjectId: e.target.checked ? form.secondarySubjectId : '' }); sounds.click() }}
                className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <div>
                <p className="text-sm font-medium text-slate-700">Optional Subject</p>
                <p className="text-xs text-slate-500">Mark if not all pupils take this subject. Specify a secondary subject for the other group.</p>
              </div>
            </label>
            {form.isOptional && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Secondary Subject</label>
                {!showAddSecondary ? (
                  <div className="flex gap-2">
                    <select
                      value={form.secondarySubjectId}
                      onChange={e => { 
                        if (e.target.value === '__add_new__') {
                          setShowAddSecondary(true)
                          setNewSecondaryName('')
                        } else {
                          setForm({ ...form, secondarySubjectId: e.target.value })
                        }
                        sounds.click()
                      }}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                    >
                      <option value="">-- Select Secondary Subject --</option>
                      {state.subjects.filter(s => s.id !== editing?.id).map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                      <option value="__add_new__">+ Add new subject...</option>
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Input
                      label="New Subject Name"
                      value={newSecondaryName}
                      onChange={e => setNewSecondaryName(e.target.value)}
                      placeholder="Enter subject name"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          if (newSecondaryName.trim()) {
                            const newSubject = { name: newSecondaryName.trim(), color: form.color, departmentId: form.departmentId }
                            dispatch({ type: 'ADD_SUBJECT', payload: newSubject })
                            setNewSubjectId('pending')
                            setShowAddSecondary(false)
                            setNewSecondaryName('')
                            sounds.add()
                          }
                        }}
                        disabled={!newSecondaryName.trim()}
                      >
                        Add Subject
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setShowAddSecondary(false)
                          setNewSecondaryName('')
                          sounds.click()
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
                <p className="text-xs text-slate-400 mt-1">Pupils not taking this subject will attend the secondary subject at the same time.</p>
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
        </>
      )}
    </div>
  )
}
