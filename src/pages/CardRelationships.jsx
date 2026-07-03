import React, { useState, forwardRef, useImperativeHandle } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { sounds } from '../utils/sounds.js'
import { Button, Card, PageHeader, Modal, EmptyState, Badge, Select } from '../components/UI.jsx'

const RELATIONSHIP_TYPES = [
  { value: 'same_day', label: 'Must be on the same day', desc: 'Both subjects scheduled on the same day for the class' },
  { value: 'consecutive', label: 'Must be consecutive', desc: 'Second subject immediately follows the first' },
  { value: 'not_same_day', label: 'Cannot be on the same day', desc: 'Subjects must not appear on the same day' },
  { value: 'before', label: 'Must come before', desc: 'First subject must be scheduled earlier in the day' },
  { value: 'spread', label: 'Spread across week', desc: 'Distribute sessions across different days (min gap between days)' },
  { value: 'max_per_day', label: 'Max per day', desc: 'Limit how many sessions of this subject per day' },
]

const CardRelationships = forwardRef(function CardRelationships({ embedded, onBack }, ref) {
  const { state, dispatch } = useApp()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ subjectId: '', relatedSubjectId: '', type: 'same_day', classId: '', maxPerDay: 1, minDayGap: 1 })

  useImperativeHandle(ref, () => ({ openAdd }))

  const openAdd = () => {
    setEditing(null)
    setForm({ subjectId: '', relatedSubjectId: '', type: 'same_day', classId: '', maxPerDay: 1, minDayGap: 1 })
    sounds.click()
    setModalOpen(true)
  }

  const openEdit = (rel) => {
    setEditing(rel)
    setForm({ subjectId: rel.subjectId, relatedSubjectId: rel.relatedSubjectId || '', type: rel.type, classId: rel.classId || '', maxPerDay: rel.maxPerDay || 1, minDayGap: rel.minDayGap || 1 })
    sounds.click()
    setModalOpen(true)
  }

  const handleSave = () => {
    if (!form.subjectId || !form.type) {
      sounds.error()
      return
    }
    if (editing) {
      dispatch({ type: 'UPDATE_CARD_RELATIONSHIP', payload: { ...editing, ...form } })
    } else {
      dispatch({ type: 'ADD_CARD_RELATIONSHIP', payload: form })
    }
    sounds.add()
    setModalOpen(false)
  }

  const handleDelete = (id) => {
    if (confirm('Delete this relationship rule?')) {
      dispatch({ type: 'DELETE_CARD_RELATIONSHIP', payload: id })
      sounds.delete()
    }
  }

  const getSubjectName = (id) => state.subjects.find(s => s.id === id)?.name || '—'
  const getClassName = (id) => id ? (state.classes.find(c => c.id === id)?.name || '—') : 'All classes'
  const getTypeLabel = (type) => RELATIONSHIP_TYPES.find(t => t.value === type)?.label || type

  const needsRelatedSubject = ['same_day', 'consecutive', 'not_same_day', 'before'].includes(form.type)
  const needsMaxPerDay = form.type === 'max_per_day'
  const needsMinDayGap = form.type === 'spread'

  return (
    <div className="p-4 md:p-8">
      {!embedded ? (
        <PageHeader
          title="Card Relationships"
          subtitle="Define rules between subjects (sequencing, distribution, constraints)"
          action={
            <div className="flex gap-2">
              <Button onClick={openAdd}>+ Add Rule</Button>
            </div>
          }
        />
      ) : null}

      {state.cardRelationships.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            title="No relationship rules yet"
            subtitle="Add rules to control how subjects relate to each other in the timetable"
            action={<Button onClick={openAdd}>+ Add Rule</Button>}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {state.cardRelationships.map(rel => {
            const subject = state.subjects.find(s => s.id === rel.subjectId)
            return (
              <Card key={rel.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: (subject?.color || '#3b82f6') + '20', border: `2px solid ${subject?.color || '#3b82f6'}` }}
                    >
                      <span className="text-xs font-bold" style={{ color: subject?.color || '#3b82f6' }}>
                        {getSubjectName(rel.subjectId).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-800">{getSubjectName(rel.subjectId)}</p>
                        <Badge color="blue">{getTypeLabel(rel.type)}</Badge>
                        {rel.relatedSubjectId && (
                          <span className="text-xs text-slate-500">→ {getSubjectName(rel.relatedSubjectId)}</span>
                        )}
                        {rel.maxPerDay && rel.type === 'max_per_day' && (
                          <Badge color="amber">Max {rel.maxPerDay}/day</Badge>
                        )}
                        {rel.minDayGap && rel.type === 'spread' && (
                          <Badge color="amber">Min {rel.minDayGap} day gap</Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Applies to: {getClassName(rel.classId)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(rel)} className="text-slate-400 hover:text-brand-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => handleDelete(rel.id)} className="text-slate-400 hover:text-red-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Rule' : 'Add Rule'} maxWidth="max-w-xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Rule Type</label>
            <select
              value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              {RELATIONSHIP_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">{RELATIONSHIP_TYPES.find(t => t.value === form.type)?.desc}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Subject *</label>
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

          {needsRelatedSubject && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Related Subject</label>
              <select
                value={form.relatedSubjectId}
                onChange={e => setForm({ ...form, relatedSubjectId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="">-- Select Subject --</option>
                {state.subjects.filter(s => s.id !== form.subjectId).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {needsMaxPerDay && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Max Sessions Per Day</label>
              <input
                type="number"
                min="1"
                max="8"
                value={form.maxPerDay}
                onChange={e => setForm({ ...form, maxPerDay: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          )}

          {needsMinDayGap && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Min Days Between Sessions</label>
              <input
                type="number"
                min="1"
                max="5"
                value={form.minDayGap}
                onChange={e => setForm({ ...form, minDayGap: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Applies To</label>
            <select
              value={form.classId}
              onChange={e => setForm({ ...form, classId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="">All classes</option>
              {state.classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
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

export default CardRelationships
