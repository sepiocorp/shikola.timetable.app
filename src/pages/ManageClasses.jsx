import React, { useState, useRef, useEffect } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { sounds } from '../utils/sounds.js'
import { Button, Input, Card, PageHeader, Modal, EmptyState, Badge, Toggle, Tabs, SkeletonCard } from '../components/UI.jsx'
import BulkImportModal from '../components/BulkImportModal.jsx'
import Pupils from './Pupils.jsx'
import ManageRooms from './ManageRooms.jsx'
import LessonGroups from './LessonGroups.jsx'

export default function ManageClasses({ searchQuery }) {
  const { state, dispatch } = useApp()
  const [loading, setLoading] = useState(false)

  const filteredClasses = state.classes.filter(cls =>
    cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (cls.grade && cls.grade.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (cls.section && cls.section.toLowerCase().includes(searchQuery.toLowerCase()))
  )
  const [activeTab, setActiveTab] = useState('classes')
  const pupilsRef = useRef(null)
  const roomsRef = useRef(null)
  const lessonGroupsRef = useRef(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', grade: '', section: '', classTeacher: '', sectionId: '', isShared: false, sharedWithTeachers: [] })
  const [viewMode, setViewMode] = useState('list')
  const [teacherSearch, setTeacherSearch] = useState('')

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', grade: '', section: '', classTeacher: '', sectionId: '', isShared: false, sharedWithTeachers: [] })
    sounds.click()
    setModalOpen(true)
  }

  const openEdit = (cls) => {
    setEditing(cls)
    setForm({ name: cls.name, grade: cls.grade || '', section: cls.section || '', classTeacher: cls.classTeacher || '', sectionId: cls.sectionId || '', isShared: cls.isShared || false, sharedWithTeachers: cls.sharedWithTeachers || [] })
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

  const getSectionLabelOptions = () => {
    const selectedSection = state.sections.find(s => s.id === form.sectionId)
    const session = selectedSection?.session || 'full'
    
    // Return session type as the label
    if (session === 'morning') {
      return ['Morning']
    } else if (session === 'afternoon') {
      return ['Afternoon']
    }
    return ['Full Day']
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <PageHeader
          title={activeTab === 'pupils' ? 'Pupils' : activeTab === 'rooms' ? 'Rooms' : activeTab === 'lessonGroups' ? 'Lesson Divisions / Groups' : 'Classes'}
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
      <PageHeader
        title={activeTab === 'pupils' ? 'Pupils' : activeTab === 'rooms' ? 'Rooms' : activeTab === 'lessonGroups' ? 'Lesson Divisions / Groups' : 'Classes'}
        subtitle={activeTab === 'pupils' ? `${state.pupils.length} pupil(s) registered` : activeTab === 'rooms' ? `${state.rooms.length} room(s) registered` : activeTab === 'lessonGroups' ? 'Split a class into groups with different subjects per group (e.g., Boys/Girls, Advanced/Beginners)' : `${state.classes.length} class(es) registered`}
        action={
          <div className="flex gap-2">
            {activeTab === 'classes' && <>
              <Button variant="secondary" onClick={() => { sounds.click(); setBulkOpen(true) }}>Bulk Import</Button>
              <Button onClick={openAdd}>+ Add Class</Button>
            </>}
            {activeTab === 'pupils' && <>
              <Button variant="secondary" onClick={() => pupilsRef.current?.openBulkImport()}>Bulk Import</Button>
              <Button onClick={() => pupilsRef.current?.openAdd()}>+ Add Pupil</Button>
            </>}
            {activeTab === 'rooms' && <Button onClick={() => roomsRef.current?.openAdd()}>+ Add Room</Button>}
            {activeTab === 'lessonGroups' && <Button onClick={() => lessonGroupsRef.current?.openAdd()}>+ Add Division</Button>}
          </div>
        }
      />

      <div className="mb-4">
        <Tabs
          tabs={[
            { id: 'classes', label: 'Classes' },
            { id: 'pupils', label: 'Pupils' },
            { id: 'rooms', label: 'Rooms' },
            { id: 'lessonGroups', label: 'Lesson Groups' },
          ]}
          active={activeTab}
          onChange={(id) => { setActiveTab(id); sounds.click() }}
        />
      </div>

      {activeTab === 'pupils' ? (
        <Pupils ref={pupilsRef} embedded searchQuery={searchQuery} />
      ) : activeTab === 'rooms' ? (
        <ManageRooms ref={roomsRef} embedded searchQuery={searchQuery} />
      ) : activeTab === 'lessonGroups' ? (
        <LessonGroups ref={lessonGroupsRef} embedded searchQuery={searchQuery} />
      ) : (
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

      {filteredClasses.length === 0 && searchQuery ? (
        <Card className="p-6">
          <EmptyState
            icon="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            title="No classes found"
            subtitle={`No classes match "${searchQuery}"`}
          />
        </Card>
      ) : filteredClasses.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            title="No classes yet"
            subtitle="Add classes to start building your timetables"
            action={<Button onClick={openAdd}>+ Add Class</Button>}
          />
        </Card>
      ) : viewMode === 'list' ? (
        <Card className="overflow-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left text-xs font-bold text-slate-600 px-4 py-3">Class</th>
                <th className="text-left text-xs font-bold text-slate-600 px-4 py-3">Grade</th>
                <th className="text-left text-xs font-bold text-slate-600 px-4 py-3">Section</th>
                <th className="text-left text-xs font-bold text-slate-600 px-4 py-3">Class Teacher</th>
                <th className="text-center text-xs font-bold text-slate-600 px-4 py-3">Shared</th>
                <th className="text-right text-xs font-bold text-slate-600 px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClasses.map(cls => (
                <tr key={cls.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-semibold text-slate-800">{cls.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{cls.grade || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{cls.section || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{getTeacherName(cls.classTeacher) || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    {cls.isShared && cls.sharedWithTeachers && cls.sharedWithTeachers.length > 0 ? (
                      <div className="flex flex-wrap gap-1 justify-center">
                        {cls.sharedWithTeachers.slice(0, 2).map(tid => {
                          const teacher = state.teachers.find(t => t.id === tid)
                          return teacher ? (
                            <Badge key={tid} color="amber" className="text-xs">{teacher.name.split(' ')[0]}</Badge>
                          ) : null
                        })}
                        {cls.sharedWithTeachers.length > 2 && (
                          <Badge color="slate" className="text-xs">+{cls.sharedWithTeachers.length - 2}</Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(cls)} className="text-slate-400 hover:text-brand-600 mr-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => handleDelete(cls.id)} className="text-slate-400 hover:text-red-500">
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
          {filteredClasses.map(cls => (
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
                  if (!sec) return null
                  return (
                    <div className="flex flex-wrap gap-1">
                      <Badge color="blue">{sec.name}</Badge>
                      {sec.session && sec.session !== 'full' && (
                        <Badge color={sec.session === 'morning' ? 'amber' : 'teal'}>
                          {sec.session === 'morning' ? 'Morning' : 'Afternoon'}
                        </Badge>
                      )}
                    </div>
                  )
                })()}
                {cls.classTeacher && (
                  <p className="text-xs text-slate-500">Class Teacher: {getTeacherName(cls.classTeacher) || 'Unknown'}</p>
                )}
                {cls.isShared && cls.sharedWithTeachers && cls.sharedWithTeachers.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {cls.sharedWithTeachers.map(tid => {
                      const teacher = state.teachers.find(t => t.id === tid)
                      return teacher ? (
                        <Badge key={tid} color="amber" title="Student Teacher">{teacher.name}</Badge>
                      ) : null
                    })}
                  </div>
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
                <option key={s.id} value={s.id}>{s.name}{s.session && s.session !== 'full' ? ` (${s.session === 'morning' ? 'Morning' : 'Afternoon'})` : ''}</option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">Assign a section if this class follows a different schedule (e.g., Primary vs Secondary).</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Grade" value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} placeholder="Enter grade" />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Section Label</label>
              <select
                value={form.section}
                onChange={e => setForm({ ...form, section: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="">-- Select Label --</option>
                {getSectionLabelOptions().map(label => (
                  <option key={label} value={label}>{label}</option>
                ))}
              </select>
            </div>
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
          <div className="border border-slate-200 rounded-lg p-4 space-y-3">
            <Toggle
              checked={form.isShared}
              onChange={(v) => { setForm({ ...form, isShared: v, sharedWithTeachers: v ? form.sharedWithTeachers : [] }); sounds.click() }}
              label="Shared Class (Student Teacher / Practicals)"
            />
            <p className="text-xs text-slate-500">Mark if this class is shared with student teachers for practicals.</p>
            {form.isShared && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Shared With (Teachers)</label>
                <input
                  type="text"
                  value={teacherSearch}
                  onChange={e => setTeacherSearch(e.target.value)}
                  placeholder="Search teachers..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 mb-2"
                />
                <div className="space-y-2 max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2">
                  {state.teachers.filter(t => 
                    t.name.toLowerCase().includes(teacherSearch.toLowerCase())
                  ).map(t => (
                    <label key={t.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={form.sharedWithTeachers.includes(t.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setForm({ ...form, sharedWithTeachers: [...form.sharedWithTeachers, t.id] })
                          } else {
                            setForm({ ...form, sharedWithTeachers: form.sharedWithTeachers.filter(id => id !== t.id) })
                          }
                          sounds.click()
                        }}
                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      />
                      <span className="text-slate-700">{t.name}</span>
                    </label>
                  ))}
                  {state.teachers.filter(t => 
                    t.name.toLowerCase().includes(teacherSearch.toLowerCase())
                  ).length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-2">No teachers found</p>
                  )}
                </div>
                {form.sharedWithTeachers.length === 0 && (
                  <p className="text-xs text-slate-400 mt-1">No teachers selected</p>
                )}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? 'Update' : 'Add'}</Button>
          </div>
        </div>
      </Modal>

      <BulkImportModal open={bulkOpen} onClose={() => setBulkOpen(false)} type="classes" />
        </>
      )}
    </div>
  )
}
