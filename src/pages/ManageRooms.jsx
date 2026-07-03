import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { sounds } from '../utils/sounds.js'
import { Button, Input, Card, PageHeader, Modal, EmptyState, Badge, Toggle, Tabs, SkeletonCard } from '../components/UI.jsx'

const ManageRooms = forwardRef(function ManageRooms({ embedded, onBack, searchQuery }, ref) {
  const { state, dispatch } = useApp()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000)
    return () => clearTimeout(timer)
  }, [])

  const filteredRooms = state.rooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.type.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', capacity: 30, type: 'Classroom', isShared: false })
  const [viewMode, setViewMode] = useState('list')
  const [tab, setTab] = useState('rooms')
  const [supervisionForm, setSupervisionForm] = useState({ roomId: '', teacherId: '', day: '', periodId: '' })

  useImperativeHandle(ref, () => ({ openAdd }))

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', capacity: 30, type: 'Classroom', isShared: false })
    sounds.click()
    setModalOpen(true)
  }

  const openEdit = (room) => {
    setEditing(room)
    setForm({ name: room.name, capacity: room.capacity || 30, type: room.type || 'Classroom', isShared: room.isShared || false })
    sounds.click()
    setModalOpen(true)
  }

  const handleSave = () => {
    if (!form.name.trim()) {
      sounds.error()
      return
    }
    if (editing) {
      dispatch({ type: 'UPDATE_ROOM', payload: { ...editing, ...form } })
    } else {
      dispatch({ type: 'ADD_ROOM', payload: form })
    }
    sounds.add()
    setModalOpen(false)
  }

  const handleDelete = (id) => {
    if (confirm('Delete this room? This will also remove its timetable entries.')) {
      dispatch({ type: 'DELETE_ROOM', payload: id })
      sounds.delete()
    }
  }

  const handleAddSupervision = () => {
    if (!supervisionForm.roomId || !supervisionForm.teacherId || !supervisionForm.day || !supervisionForm.periodId) return
    dispatch({ type: 'ADD_SUPERVISION', payload: supervisionForm })
    sounds.add()
    setSupervisionForm({ roomId: '', teacherId: '', day: '', periodId: '' })
  }

  const getRoomName = (id) => state.rooms.find(r => r.id === id)?.name || 'Unknown'
  const getTeacherName = (id) => state.teachers.find(t => t.id === id)?.name || 'Unknown'
  const getPeriodName = (id) => state.settings.periods.find(p => String(p.id) === String(id))?.name || id

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        {!embedded ? (
          <PageHeader
            title="Rooms"
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
          title="Rooms"
          subtitle={`${state.rooms.length} room(s) registered`}
          action={
            <div className="flex gap-2">
              {tab === 'rooms' && <Button onClick={openAdd}>+ Add Room</Button>}
            </div>
          }
        />
      ) : null}

      {!embedded && (
        <div className="mb-4">
          <Tabs
            tabs={[
              { id: 'rooms', label: 'Rooms' },
              { id: 'supervision', label: 'Room Supervision' },
            ]}
            active={tab}
            onChange={(id) => { setTab(id); sounds.click() }}
          />
        </div>
      )}

      {!embedded && tab === 'supervision' && (
        <Card className="p-6 mb-6">
          <h3 className="text-sm font-bold text-slate-700 mb-2">Room Supervision</h3>
          <p className="text-xs text-slate-500 mb-4">Assign teachers to supervise rooms during specific periods.</p>
          {state.supervision.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No supervision duties assigned yet.</p>
          ) : (
            <div className="space-y-2 mb-4">
              {state.supervision.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge color="amber">{getRoomName(s.roomId)}</Badge>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{getTeacherName(s.teacherId)}</p>
                      <p className="text-xs text-slate-500">{s.day} · {getPeriodName(s.periodId)}</p>
                    </div>
                  </div>
                  <button onClick={() => { dispatch({ type: 'DELETE_SUPERVISION', payload: s.id }); sounds.delete() }} className="text-slate-400 hover:text-red-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="border-t border-slate-200 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Room *</label>
                <select value={supervisionForm.roomId} onChange={e => setSupervisionForm({ ...supervisionForm, roomId: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                  <option value="">-- Select Room --</option>
                  {state.rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Teacher *</label>
                <select value={supervisionForm.teacherId} onChange={e => setSupervisionForm({ ...supervisionForm, teacherId: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                  <option value="">-- Select Teacher --</option>
                  {state.teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Day *</label>
                <select value={supervisionForm.day} onChange={e => setSupervisionForm({ ...supervisionForm, day: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                  <option value="">-- Select Day --</option>
                  {state.settings.days.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Period *</label>
                <select value={supervisionForm.periodId} onChange={e => setSupervisionForm({ ...supervisionForm, periodId: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                  <option value="">-- Select Period --</option>
                  {state.settings.periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
            <Button size="sm" onClick={handleAddSupervision}>+ Assign Supervision</Button>
          </div>
        </Card>
      )}

      {(embedded || tab === 'rooms') && (
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

      {filteredRooms.length === 0 && searchQuery ? (
        <Card className="p-6">
          <EmptyState
            icon="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            title="No rooms found"
            subtitle={`No rooms match "${searchQuery}"`}
          />
        </Card>
      ) : filteredRooms.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"
            title="No rooms yet"
            subtitle="Add rooms where classes will be held"
            action={<Button onClick={openAdd}>+ Add Room</Button>}
          />
        </Card>
      ) : viewMode === 'list' ? (
        <Card className="overflow-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left text-xs font-bold text-slate-600 px-4 py-3">Room</th>
                <th className="text-left text-xs font-bold text-slate-600 px-4 py-3">Type</th>
                <th className="text-center text-xs font-bold text-slate-600 px-4 py-3">Capacity</th>
                <th className="text-center text-xs font-bold text-slate-600 px-4 py-3">Shared</th>
                <th className="text-right text-xs font-bold text-slate-600 px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRooms.map(room => (
                <tr key={room.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-semibold text-slate-800">{room.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{room.type}</td>
                  <td className="px-4 py-3 text-center text-sm text-slate-600">{room.capacity}</td>
                  <td className="px-4 py-3 text-center">{room.isShared ? <Badge color="amber">Shared</Badge> : <span className="text-slate-300">—</span>}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(room)} className="text-slate-400 hover:text-brand-600 mr-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => handleDelete(room.id)} className="text-slate-400 hover:text-red-500">
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
        <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRooms.map(room => (
            <Card key={room.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{room.name}</p>
                    <p className="text-xs text-slate-500">Capacity: {room.capacity}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(room)} className="text-slate-400 hover:text-brand-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button onClick={() => handleDelete(room.id)} className="text-slate-400 hover:text-red-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <p className="text-xs text-slate-400">{room.type}</p>
                {room.isShared && <Badge color="amber">Shared</Badge>}
              </div>
            </Card>
          ))}
        </div>
      )}
      </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Room' : 'Add Room'}>
        <div className="space-y-4">
          <Input label="Room Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Enter room name" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Capacity" type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: Number(e.target.value) })} min="1" />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="Classroom">Classroom</option>
                <option value="Laboratory">Laboratory</option>
                <option value="Computer Lab">Computer Lab</option>
                <option value="Library">Library</option>
                <option value="Gymnasium">Gymnasium</option>
                <option value="Music Room">Music Room</option>
                <option value="Art Room">Art Room</option>
              </select>
            </div>
          </div>
          <div className="border border-slate-200 rounded-lg p-4">
            <Toggle
              checked={form.isShared}
              onChange={(v) => { setForm({ ...form, isShared: v }); sounds.click() }}
              label="Shared Room"
            />
            <p className="text-xs text-slate-500 mt-1">Mark if this room is shared between departments or classes (e.g., labs, halls).</p>
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

export default ManageRooms
