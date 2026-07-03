import React, { useState, forwardRef, useImperativeHandle } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { sounds } from '../utils/sounds.js'
import { Button, Input, Card, PageHeader, Modal, EmptyState, Badge } from '../components/UI.jsx'

const LessonGroups = forwardRef(function LessonGroups({ embedded, onBack }, ref) {
  const { state, dispatch } = useApp()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ classId: '', name: '', groups: [] })

  useImperativeHandle(ref, () => ({ openAdd }))

  const openAdd = () => {
    setEditing(null)
    setForm({ classId: '', name: '', groups: [{ name: 'Group A', subjects: [] }, { name: 'Group B', subjects: [] }] })
    sounds.click()
    setModalOpen(true)
  }

  const openEdit = (group) => {
    setEditing(group)
    setForm({ classId: group.classId, name: group.name, groups: group.groups || [] })
    sounds.click()
    setModalOpen(true)
  }

  const handleSave = () => {
    if (!form.classId || !form.name.trim()) {
      sounds.error()
      return
    }
    if (editing) {
      dispatch({ type: 'UPDATE_LESSON_GROUP', payload: { ...editing, ...form } })
    } else {
      dispatch({ type: 'ADD_LESSON_GROUP', payload: form })
    }
    sounds.add()
    setModalOpen(false)
  }

  const handleDelete = (id) => {
    if (confirm('Delete this lesson group?')) {
      dispatch({ type: 'DELETE_LESSON_GROUP', payload: id })
      sounds.delete()
    }
  }

  const addGroup = () => {
    setForm(f => ({ ...f, groups: [...f.groups, { name: `Group ${String.fromCharCode(65 + f.groups.length)}`, subjects: [] }] }))
    sounds.click()
  }

  const removeGroup = (idx) => {
    setForm(f => ({ ...f, groups: f.groups.filter((_, i) => i !== idx) }))
    sounds.click()
  }

  const updateGroupName = (idx, name) => {
    setForm(f => ({ ...f, groups: f.groups.map((g, i) => i === idx ? { ...g, name } : g) }))
  }

  const toggleGroupSubject = (idx, subjectId) => {
    sounds.click()
    setForm(f => ({
      ...f,
      groups: f.groups.map((g, i) => {
        if (i !== idx) return g
        return {
          ...g,
          subjects: g.subjects.includes(subjectId)
            ? g.subjects.filter(s => s !== subjectId)
            : [...g.subjects, subjectId],
        }
      }),
    }))
  }

  const getClassName = (id) => state.classes.find(c => c.id === id)?.name || '—'

  return (
    <div className="p-4 md:p-8">
      {!embedded ? (
        <PageHeader
          title="Lesson Divisions / Groups"
          subtitle="Split a class into groups with different subjects per group (e.g., Boys/Girls, Advanced/Beginners)"
          action={
            <div className="flex gap-2">
              <Button onClick={openAdd}>+ Add Division</Button>
            </div>
          }
        />
      ) : null}

      {state.lessonGroups.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            title="No lesson divisions yet"
            subtitle="Create groups within a class to assign different subjects to different groups"
            action={<Button onClick={openAdd}>+ Add Division</Button>}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {state.lessonGroups.map(lg => (
            <Card key={lg.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800">{lg.name}</p>
                    <Badge color="blue">{getClassName(lg.classId)}</Badge>
                    <Badge color="slate">{lg.groups?.length || 0} groups</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {lg.groups?.map((g, i) => (
                      <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                        <p className="text-xs font-semibold text-slate-700">{g.name}</p>
                        <p className="text-[10px] text-slate-500">{g.subjects?.length || 0} subject(s)</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(lg)} className="text-slate-400 hover:text-brand-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button onClick={() => handleDelete(lg.id)} className="text-slate-400 hover:text-red-500">
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Division' : 'Add Division'} maxWidth="max-w-2xl">
        <div className="space-y-4">
          <Input label="Division Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., PE Boys/Girls, Elective Science" />
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

          <div className="border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">Groups</p>
              <Button size="sm" variant="secondary" onClick={addGroup}>+ Add Group</Button>
            </div>
            {form.groups.map((group, idx) => (
              <div key={idx} className="border border-slate-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={group.name}
                    onChange={e => updateGroupName(idx, e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Group name"
                  />
                  {form.groups.length > 1 && (
                    <button onClick={() => removeGroup(idx)} className="text-red-400 hover:text-red-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {state.subjects.map(subject => (
                    <button
                      key={subject.id}
                      type="button"
                      onClick={() => toggleGroupSubject(idx, subject.id)}
                      className={`px-2 py-1 rounded text-xs font-medium border transition-all ${
                        group.subjects.includes(subject.id)
                          ? 'border-brand-600 bg-brand-50 text-brand-700'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {subject.name}
                    </button>
                  ))}
                  {state.subjects.length === 0 && <p className="text-xs text-slate-400">No subjects available.</p>}
                </div>
              </div>
            ))}
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

export default LessonGroups
