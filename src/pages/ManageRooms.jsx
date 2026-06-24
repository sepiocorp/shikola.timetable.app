import React, { useState } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { sounds } from '../utils/sounds.js'
import { Button, Input, Card, PageHeader, Modal, EmptyState } from '../components/UI.jsx'

export default function ManageRooms() {
  const { state, dispatch } = useApp()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', capacity: 30, type: 'Classroom' })

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', capacity: 30, type: 'Classroom' })
    sounds.click()
    setModalOpen(true)
  }

  const openEdit = (room) => {
    setEditing(room)
    setForm({ name: room.name, capacity: room.capacity || 30, type: room.type || 'Classroom' })
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

  return (
    <div className="p-8">
      <PageHeader
        title="Rooms"
        subtitle={`${state.rooms.length} room(s) registered`}
        action={<Button onClick={openAdd}>+ Add Room</Button>}
      />

      {state.rooms.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"
            title="No rooms yet"
            subtitle="Add rooms where classes will be held"
            action={<Button onClick={openAdd}>+ Add Room</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {state.rooms.map(room => (
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
              <p className="text-xs text-slate-400 mt-2">{room.type}</p>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Room' : 'Add Room'}>
        <div className="space-y-4">
          <Input label="Room Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Enter room name" />
          <div className="grid grid-cols-2 gap-4">
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
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? 'Update' : 'Add'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
