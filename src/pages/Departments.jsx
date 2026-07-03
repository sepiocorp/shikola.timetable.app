import React, { useState } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { sounds } from '../utils/sounds.js'
import { Button, Input, Card, PageHeader, Modal, EmptyState, Badge, Tabs } from '../components/UI.jsx'

export default function Departments() {
  const { state, dispatch } = useApp()
  const [tab, setTab] = useState('departments')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', code: '', headTeacherId: '' })
  const [viewMode, setViewMode] = useState('list')

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', code: '', headTeacherId: '' })
    sounds.click()
    setModalOpen(true)
  }

  const openEdit = (dept) => {
    setEditing(dept)
    setForm({ name: dept.name, code: dept.code || '', headTeacherId: dept.headTeacherId || '' })
    sounds.click()
    setModalOpen(true)
  }

  const handleSave = () => {
    if (!form.name.trim()) {
      sounds.error()
      return
    }
    if (editing) {
      dispatch({ type: 'UPDATE_DEPARTMENT', payload: { ...editing, ...form } })
    } else {
      dispatch({ type: 'ADD_DEPARTMENT', payload: form })
    }
    sounds.add()
    setModalOpen(false)
  }

  const handleDelete = (id) => {
    if (confirm('Delete this department? Teachers and subjects in this department will be unassigned.')) {
      dispatch({ type: 'DELETE_DEPARTMENT', payload: id })
      sounds.delete()
    }
  }

  const getDeptTeachers = (deptId) => state.teachers.filter(t => t.departmentId === deptId)
  const getDeptSubjects = (deptId) => state.subjects.filter(s => s.departmentId === deptId)
  const getTeacherName = (id) => state.teachers.find(t => t.id === id)?.name || ''

  const assignTeacherToDept = (teacherId, deptId) => {
    const teacher = state.teachers.find(t => t.id === teacherId)
    if (teacher) {
      dispatch({ type: 'UPDATE_TEACHER', payload: { ...teacher, departmentId: deptId } })
      sounds.click()
    }
  }

  const assignSubjectToDept = (subjectId, deptId) => {
    const subject = state.subjects.find(s => s.id === subjectId)
    if (subject) {
      dispatch({ type: 'UPDATE_SUBJECT', payload: { ...subject, departmentId: deptId } })
      sounds.click()
    }
  }

  return (
    <div className="p-4 md:p-8">
      <PageHeader
        title={tab === 'assignments' ? 'Teacher & Subject Assignments' : 'Departments'}
        subtitle={tab === 'assignments' ? 'Assign teachers and subjects to departments' : `${state.departments.length} department(s) configured`}
        action={
          <div className="flex gap-2">
            {tab === 'departments' && <>
              <Button variant="secondary" onClick={() => { setViewMode(viewMode === 'list' ? 'grid' : 'list'); sounds.click() }}>
                {viewMode === 'list' ? 'Grid View' : 'List View'}
              </Button>
              <Button onClick={openAdd}>+ Add Department</Button>
            </>}
          </div>
        }
      />

      <div className="mb-4">
        <Tabs
          tabs={[
            { id: 'departments', label: 'Departments' },
            { id: 'assignments', label: 'Teacher & Subject Assignments' },
          ]}
          active={tab}
          onChange={(id) => { setTab(id); sounds.click() }}
        />
      </div>

      {tab === 'departments' ? (
        state.departments.length === 0 ? (
          <Card className="p-6">
            <EmptyState
              icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              title="No departments yet"
              subtitle="Add departments (e.g., Math, English, Science) to organize teachers and subjects"
              action={<Button onClick={openAdd}>+ Add Department</Button>}
            />
          </Card>
        ) : viewMode === 'list' ? (
          <Card className="overflow-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left text-xs font-bold text-slate-600 px-4 py-3">Department</th>
                  <th className="text-left text-xs font-bold text-slate-600 px-4 py-3">Code</th>
                  <th className="text-left text-xs font-bold text-slate-600 px-4 py-3">Head</th>
                  <th className="text-left text-xs font-bold text-slate-600 px-4 py-3">Teachers</th>
                  <th className="text-left text-xs font-bold text-slate-600 px-4 py-3">Subjects</th>
                  <th className="text-right text-xs font-bold text-slate-600 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {state.departments.map(dept => (
                  <tr key={dept.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-semibold text-slate-800">{dept.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{dept.code || '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{getTeacherName(dept.headTeacherId) || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge color="blue">{getDeptTeachers(dept.id).length}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge color="slate">{getDeptSubjects(dept.id).length}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(dept)} className="text-slate-400 hover:text-brand-600 mr-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(dept.id)} className="text-slate-400 hover:text-red-500">
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
            {state.departments.map(dept => (
              <Card key={dept.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center">
                      <span className="text-sm font-bold text-brand-700">
                        {dept.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{dept.name}</p>
                      {dept.code && <p className="text-xs text-slate-500">Code: {dept.code}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(dept)} className="text-slate-400 hover:text-brand-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => handleDelete(dept.id)} className="text-slate-400 hover:text-red-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  {dept.headTeacherId && <p className="text-xs text-slate-500">Head: {getTeacherName(dept.headTeacherId)}</p>}
                  <div className="flex gap-2">
                    <Badge color="blue">{getDeptTeachers(dept.id).length} teachers</Badge>
                    <Badge color="slate">{getDeptSubjects(dept.id).length} subjects</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-6">
          {state.departments.length === 0 ? (
            <Card className="p-6">
              <EmptyState
                icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"
                title="No departments to assign to"
                subtitle="Create departments first, then assign teachers and subjects here"
                action={<Button onClick={() => { setTab('departments'); openAdd() }}>+ Add Department</Button>}
              />
            </Card>
          ) : (
            <>
              <Card className="p-5">
                <h3 className="text-sm font-bold text-slate-700 mb-4">Assign Teachers to Departments</h3>
                <div className="overflow-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left text-xs font-bold text-slate-600 px-3 py-2">Teacher</th>
                        <th className="text-left text-xs font-bold text-slate-600 px-3 py-2">Current Subjects</th>
                        <th className="text-left text-xs font-bold text-slate-600 px-3 py-2">Department</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.teachers.map(teacher => (
                        <tr key={teacher.id} className="border-b border-slate-100">
                          <td className="px-3 py-2 text-sm font-medium text-slate-800">{teacher.name}</td>
                          <td className="px-3 py-2 text-xs text-slate-500">
                            {(teacher.subjects || []).map(id => state.subjects.find(s => s.id === id)?.name).filter(Boolean).join(', ') || '—'}
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={teacher.departmentId || ''}
                              onChange={e => assignTeacherToDept(teacher.id, e.target.value)}
                              className="px-2 py-1 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                            >
                              <option value="">— None —</option>
                              {state.departments.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card className="p-5">
                <h3 className="text-sm font-bold text-slate-700 mb-4">Assign Subjects to Departments</h3>
                <div className="overflow-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left text-xs font-bold text-slate-600 px-3 py-2">Subject</th>
                        <th className="text-left text-xs font-bold text-slate-600 px-3 py-2">Code</th>
                        <th className="text-left text-xs font-bold text-slate-600 px-3 py-2">Department</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.subjects.map(subject => (
                        <tr key={subject.id} className="border-b border-slate-100">
                          <td className="px-3 py-2 text-sm font-medium text-slate-800">
                            <span className="inline-flex items-center gap-2">
                              <span className="w-3 h-3 rounded" style={{ backgroundColor: subject.color || '#3b82f6' }} />
                              {subject.name}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs text-slate-500">{subject.code || '—'}</td>
                          <td className="px-3 py-2">
                            <select
                              value={subject.departmentId || ''}
                              onChange={e => assignSubjectToDept(subject.id, e.target.value)}
                              className="px-2 py-1 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                            >
                              <option value="">— None —</option>
                              {state.departments.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Department' : 'Add Department'}>
        <div className="space-y-4">
          <Input label="Department Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., Mathematics" />
          <Input label="Department Code" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="e.g., MATH" />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Head of Department</label>
            <select
              value={form.headTeacherId}
              onChange={e => setForm({ ...form, headTeacherId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="">— Select Teacher —</option>
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
    </div>
  )
}
