import React, { useState, useMemo, forwardRef, useImperativeHandle, useEffect } from 'react'
import { useApp, getScheduleForClass } from '../store/AppContext.jsx'
import { sounds } from '../utils/sounds.js'
import { Button, Card, PageHeader, Select, Badge, SkeletonCard } from '../components/UI.jsx'

const PrintPreview = forwardRef(function PrintPreview({ navigate, embedded, onBack }, ref) {
  const { state } = useApp()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000)
    return () => clearTimeout(timer)
  }, [])

  const [viewType, setViewType] = useState('class')
  const [selectedId, setSelectedId] = useState('')
  const [selectedDeptId, setSelectedDeptId] = useState('')
  const [sectionFilter, setSectionFilter] = useState('')
  const [fontSize, setFontSize] = useState(12)
  const [showTeacher, setShowTeacher] = useState(true)
  const [showRoom, setShowRoom] = useState(true)
  const [orientation, setOrientation] = useState('landscape')
  const [posterMode, setPosterMode] = useState(false)
  const [posterCols, setPosterCols] = useState(5)
  const [posterRows, setPosterRows] = useState(4)

  const schedule = useMemo(() => {
    if (viewType !== 'class' || !selectedId) return { days: state.settings.days, periods: state.settings.periods }
    return getScheduleForClass(state, selectedId)
  }, [state, selectedId, viewType])

  const teachingPeriods = schedule.periods.filter(p => !p.isBreak)

  const masterSchedule = useMemo(() => {
    const section = sectionFilter ? state.sections.find(s => s.id === sectionFilter) : null
    return section ? { days: section.days, periods: section.periods } : { days: state.settings.days, periods: state.settings.periods }
  }, [state, sectionFilter])

  const deptTeachers = useMemo(() => {
    if (viewType !== 'department' || !selectedDeptId) return []
    return state.teachers.filter(t => t.departmentId === selectedDeptId)
  }, [state.teachers, viewType, selectedDeptId])

  const deptTeacherIds = useMemo(() => new Set(deptTeachers.map(t => t.id)), [deptTeachers])

  const masterData = useMemo(() => {
    const classIdsInSection = sectionFilter
      ? state.classes.filter(c => c.sectionId === sectionFilter).map(c => c.id)
      : null
    return state.timetable
      .filter(e => !classIdsInSection || classIdsInSection.includes(e.classId))
      .map(e => ({
        ...e,
        teacherName: state.teachers.find(t => t.id === e.teacherId)?.name || '',
        className: state.classes.find(c => c.id === e.classId)?.name || '',
        subjectName: state.subjects.find(s => s.id === e.subjectId)?.name || '',
        roomName: state.rooms.find(r => r.id === e.roomId)?.name || '',
        secondaryClassName: e.secondaryClassId ? state.classes.find(c => c.id === e.secondaryClassId)?.name || '' : '',
        secondarySubjectName: e.secondarySubjectId ? state.subjects.find(s => s.id === e.secondarySubjectId)?.name || '' : '',
        secondaryTeacherName: e.secondaryTeacherId ? state.teachers.find(t => t.id === e.secondaryTeacherId)?.name || '' : '',
      }))
  }, [state.timetable, state.teachers, state.classes, state.subjects, state.rooms, sectionFilter])

  const deptMasterData = useMemo(() => {
    if (viewType !== 'department') return []
    return state.timetable
      .filter(e => deptTeacherIds.has(e.teacherId) || deptTeacherIds.has(e.secondaryTeacherId))
      .map(e => ({
        ...e,
        teacherName: state.teachers.find(t => t.id === e.teacherId)?.name || '',
        className: state.classes.find(c => c.id === e.classId)?.name || '',
        subjectName: state.subjects.find(s => s.id === e.subjectId)?.name || '',
        roomName: state.rooms.find(r => r.id === e.roomId)?.name || '',
        secondaryClassName: e.secondaryClassId ? state.classes.find(c => c.id === e.secondaryClassId)?.name || '' : '',
        secondarySubjectName: e.secondarySubjectId ? state.subjects.find(s => s.id === e.secondarySubjectId)?.name || '' : '',
        secondaryTeacherName: e.secondaryTeacherId ? state.teachers.find(t => t.id === e.secondaryTeacherId)?.name || '' : '',
      }))
  }, [state.timetable, state.teachers, state.classes, state.subjects, state.rooms, deptTeacherIds, viewType])

  const getCellData = (day, periodId) => {
    if (viewType === 'class' && selectedId) {
      return state.timetable.find(e => e.day === day && e.periodId === periodId && e.classId === selectedId)
    }
    if (viewType === 'teacher' && selectedId) {
      return state.timetable.find(e => e.day === day && e.periodId === periodId && (e.teacherId === selectedId || e.secondaryTeacherId === selectedId))
    }
    return null
  }

  const getCellDisplay = (day, periodId) => {
    const entry = getCellData(day, periodId)
    if (!entry) return null

    if (viewType === 'class') {
      const teacher = state.teachers.find(t => t.id === entry.teacherId)
      const subject = state.subjects.find(s => s.id === entry.subjectId)
      const room = state.rooms.find(r => r.id === entry.roomId)
      const secondaryClass = entry.secondaryClassId ? state.classes.find(c => c.id === entry.secondaryClassId) : null
      const secondarySubject = entry.secondarySubjectId ? state.subjects.find(s => s.id === entry.secondarySubjectId) : null
      const secondaryTeacher = entry.secondaryTeacherId ? state.teachers.find(t => t.id === entry.secondaryTeacherId) : null
      return { subject, teacher, room, secondaryClass, secondarySubject, secondaryTeacher, lessonLength: entry.lessonLength }
    } else {
      const cls = state.classes.find(c => c.id === entry.classId)
      const subject = state.subjects.find(s => s.id === entry.subjectId)
      const room = state.rooms.find(r => r.id === entry.roomId)
      return { subject, cls, room, lessonLength: entry.lessonLength }
    }
  }

  useImperativeHandle(ref, () => ({ handlePrint }))

  const handlePrint = () => {
    sounds.click()
    window.print()
  }

  const items = viewType === 'class' ? state.classes : state.teachers
  const selectedItemName = items.find(i => i.id === selectedId)?.name || ''
  const selectedDeptName = state.departments.find(d => d.id === selectedDeptId)?.name || ''

  const canPrint = viewType === 'master' || (viewType === 'department' && selectedDeptId) || ((viewType === 'class' || viewType === 'teacher') && selectedId)

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="print:hidden">
          {!embedded ? <PageHeader title="Print Preview" subtitle="Loading..." /> : null}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <div className="print:hidden">
        {!embedded ? (
          <PageHeader
            title="Print Preview"
            subtitle="WYSIWYG preview of your timetables before printing"
            action={
              <div className="flex items-center gap-3">
                <Button onClick={handlePrint} disabled={!canPrint}>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print
                  </span>
                </Button>
              </div>
            }
          />
        ) : null}

        {/* Controls */}
        <Card className="p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <Select
              label="View"
              value={viewType}
              onChange={e => { setViewType(e.target.value); setSelectedId(''); setSelectedDeptId('') }}
              options={
                <>
                  <option value="class">Class Timetable</option>
                  <option value="teacher">Teacher Timetable</option>
                  <option value="master">Master Timetable</option>
                  {state.departments.length > 0 && <option value="department">Department Timetable</option>}
                </>
              }
              className="w-40"
            />
            {viewType === 'department' ? (
              <Select
                label="Department"
                value={selectedDeptId}
                onChange={e => { setSelectedDeptId(e.target.value); sounds.click() }}
                options={
                  <>
                    <option value="">-- Select --</option>
                    {state.departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </>
                }
                className="w-48"
              />
            ) : (viewType === 'class' || viewType === 'teacher') ? (
              <Select
                label={viewType === 'class' ? 'Class' : 'Teacher'}
                value={selectedId}
                onChange={e => { setSelectedId(e.target.value); sounds.click() }}
                options={
                  <>
                    <option value="">-- Select --</option>
                    {items.map(i => (
                      <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                  </>
                }
                className="w-48"
              />
            ) : null}
            {viewType === 'master' && state.sections.length > 0 && (
              <Select
                label="Section"
                value={sectionFilter}
                onChange={e => { setSectionFilter(e.target.value); sounds.click() }}
                options={
                  <>
                    <option value="">All Sections</option>
                    {state.sections.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </>
                }
                className="w-40"
              />
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Font Size</label>
              <input
                type="range"
                min="8"
                max="18"
                value={fontSize}
                onChange={e => setFontSize(Number(e.target.value))}
                className="w-32 accent-brand-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Orientation</label>
              <select
                value={orientation}
                onChange={e => setOrientation(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="landscape">Landscape</option>
                <option value="portrait">Portrait</option>
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer mt-6">
              <input type="checkbox" checked={showTeacher} onChange={e => setShowTeacher(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-brand-600" />
              <span className="text-sm text-slate-700">Show Teacher</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer mt-6">
              <input type="checkbox" checked={showRoom} onChange={e => setShowRoom(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-brand-600" />
              <span className="text-sm text-slate-700">Show Room</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer mt-6">
              <input type="checkbox" checked={posterMode} onChange={e => setPosterMode(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-brand-600" />
              <span className="text-sm text-slate-700">Wall Poster Mode</span>
            </label>
            {posterMode && (
              <div className="flex items-center gap-3 mt-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Columns</label>
                  <input type="number" min="2" max="10" value={posterCols} onChange={e => setPosterCols(Math.max(2, Math.min(10, Number(e.target.value))))} className="w-20 px-2 py-1 border border-slate-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Rows</label>
                  <input type="number" min="2" max="10" value={posterRows} onChange={e => setPosterRows(Math.max(2, Math.min(10, Number(e.target.value))))} className="w-20 px-2 py-1 border border-slate-300 rounded-lg text-sm" />
                </div>
                <span className="text-xs text-slate-400 mt-5">{posterCols * posterRows} pages total</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Print Area */}
      {!canPrint ? (
        <Card className="p-6 print:hidden">
          <div className="text-center py-12">
            <p className="text-sm text-slate-500">
              {viewType === 'master'
                ? 'Master timetable will appear here'
                : viewType === 'department'
                  ? 'Select a department to preview the timetable'
                  : `Select a ${viewType === 'class' ? 'class' : 'teacher'} to preview the timetable`}
            </p>
          </div>
        </Card>
      ) : (
        <div className="print-area bg-white" style={{ fontSize: `${fontSize}px` }}>
          <style>{`
            @media print {
              body * { visibility: hidden; }
              .print-area, .print-area * { visibility: visible; }
              .print-area { width: 100%; }
              .print-hidden { display: none !important; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
              thead { display: table-header-group; }
              .print-header { page-break-after: avoid; }
              ${posterMode ? `
              .poster-page { page-break-after: always; break-after: page; }
              .poster-page:last-child { page-break-after: auto; }
              @page { size: ${orientation}; margin: 5mm; }
              ` : `
              @page { size: ${orientation}; margin: 10mm; }
              `}
            }
          `}</style>

          {/* Header */}
          <div className="text-center mb-4 print-header">
            {state.school?.logo && (
              <img src={state.school.logo} alt="School logo" className="w-12 h-12 mx-auto mb-2 object-contain" />
            )}
            {state.school?.name && <h1 className="text-lg font-bold text-slate-800">{state.school.name}</h1>}
            {state.school?.motto && <p className="text-xs text-slate-500">{state.school.motto}</p>}
            <h2 className="text-base font-semibold text-brand-700 mt-2">
              {viewType === 'master'
                ? 'Master Timetable'
                : viewType === 'department'
                  ? `Department Timetable: ${selectedDeptName}`
                  : `${viewType === 'class' ? 'Class' : 'Teacher'} Timetable: ${selectedItemName}`}
            </h2>
          </div>

          {/* Master / Department Timetable Grid */}
          {viewType === 'master' || viewType === 'department' ? (
            <table className="w-full border-collapse" style={{ fontSize: `${fontSize}px`, tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <th className="border-2 border-slate-300 bg-brand-600 text-white px-2 py-2 text-center font-bold" style={{ minWidth: '80px', width: '80px' }}>
                    Day / Period
                  </th>
                  {(viewType === 'master' ? masterSchedule.periods : state.settings.periods).map(period => (
                    <th
                      key={period.id}
                      className={`border-2 border-slate-300 px-2 py-2 text-center font-bold ${period.isBreak ? 'bg-slate-200 text-slate-500' : 'bg-brand-600 text-white'}`}
                    >
                      {period.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(viewType === 'master' ? masterSchedule.days : state.settings.days).map(day => (
                  <tr key={day}>
                    <td className="border-2 border-slate-300 bg-brand-50 text-brand-700 px-2 py-2 text-center font-bold">{day}</td>
                    {(viewType === 'master' ? masterSchedule.periods : state.settings.periods).map(period => {
                      if (period.isBreak) {
                        return <td key={period.id} className="border-2 border-slate-300 bg-slate-50 text-center text-slate-400 py-2">Break</td>
                      }
                      const data = viewType === 'master' ? masterData : deptMasterData
                      const entries = data.filter(e => e.day === day && e.periodId === period.id)
                      return (
                        <td key={period.id} className="border-2 border-slate-300 p-1 align-top">
                          {entries.length > 0 ? (
                            <div className="space-y-1">
                              {entries.map(e => (
                                <div key={e.id} className="text-[10px] bg-brand-50 rounded px-1 py-0.5">
                                  {viewType === 'master' ? (
                                    <>
                                      <p className="font-semibold text-brand-800">{e.className}</p>
                                      <p className="text-slate-600">{e.subjectName}</p>
                                      <p className="text-slate-400">{e.teacherName}</p>
                                    </>
                                  ) : (
                                    <>
                                      <p className="font-semibold text-brand-800">{e.teacherName}</p>
                                      <p className="text-slate-600">{e.className} - {e.subjectName}</p>
                                      <p className="text-slate-400">{e.roomName}</p>
                                    </>
                                  )}
                                  {e.secondaryClassName && (
                                    <div className="mt-0.5 pt-0.5 border-t border-brand-100">
                                      <p className="font-semibold text-amber-700">{viewType === 'master' ? e.secondaryClassName : e.secondaryTeacherName}</p>
                                      <p className="text-slate-500">{viewType === 'master' ? `${e.secondarySubjectName} (${e.secondaryTeacherName})` : `${e.secondaryClassName} - ${e.secondarySubjectName}`}</p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : posterMode ? (
            <div className="poster-grid">
              {Array.from({ length: posterRows }).map((_, rowIdx) => (
                <div key={rowIdx} className="poster-page" style={{ minHeight: '200mm', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ transform: `scale(${Math.min(posterCols, posterRows) > 3 ? 1.5 : 2})`, transformOrigin: 'center' }}>
                    <table className="w-full border-collapse" style={{ fontSize: `${fontSize}px` }}>
                      <thead>
                        <tr>
                          <th className="border-2 border-slate-300 bg-brand-600 text-white px-2 py-2 text-center font-bold" style={{ minWidth: '80px' }}>Day / Period</th>
                          {schedule.periods.map(period => (
                            <th key={period.id} className={`border-2 border-slate-300 px-2 py-2 text-center font-bold ${period.isBreak ? 'bg-slate-200 text-slate-500' : 'bg-brand-600 text-white'}`} style={{ minWidth: '100px' }}>
                              {period.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {schedule.days.map(day => (
                          <tr key={day}>
                            <td className="border-2 border-slate-300 bg-brand-50 text-brand-700 px-2 py-2 text-center font-bold">{day}</td>
                            {schedule.periods.map(period => {
                              if (period.isBreak) return <td key={period.id} className="border-2 border-slate-300 bg-slate-50 text-center text-slate-400 py-2">Break</td>
                              const display = getCellDisplay(day, period.id)
                              return (
                                <td key={period.id} className="border-2 border-slate-300 p-1 text-center align-middle">
                                  {display ? (
                                    <div>
                                      <p className="font-semibold text-slate-800">{display.subject?.name || '—'}</p>
                                      {showTeacher && viewType === 'class' && <p className="text-[11px] text-slate-500">{display.teacher?.name || '—'}</p>}
                                      {showRoom && <p className="text-[11px] text-slate-400">{display.room?.name || ''}</p>}
                                    </div>
                                  ) : <span className="text-slate-300">—</span>}
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
          <table className="w-full border-collapse" style={{ fontSize: `${fontSize}px` }}>
            <thead>
              <tr>
                <th className="border-2 border-slate-300 bg-brand-600 text-white px-2 py-2 text-center font-bold" style={{ minWidth: '80px' }}>
                  Day / Period
                </th>
                {schedule.periods.map(period => (
                  <th
                    key={period.id}
                    className={`border-2 border-slate-300 px-2 py-2 text-center font-bold ${period.isBreak ? 'bg-slate-200 text-slate-500' : 'bg-brand-600 text-white'}`}
                    style={{ minWidth: '100px' }}
                  >
                    {period.name}
                    <div className={`text-[10px] font-normal ${period.isBreak ? 'text-slate-400' : 'text-brand-100'}`}>
                      {period.start} - {period.end}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {schedule.days.map(day => (
                <tr key={day}>
                  <td className="border-2 border-slate-300 bg-brand-50 text-brand-700 px-2 py-2 text-center font-bold">
                    {day}
                  </td>
                  {schedule.periods.map(period => {
                    if (period.isBreak) {
                      return (
                        <td key={period.id} className="border-2 border-slate-300 bg-slate-50 text-center text-slate-400 py-2">
                          Break
                        </td>
                      )
                    }
                    const display = getCellDisplay(day, period.id)
                    return (
                      <td key={period.id} className="border-2 border-slate-300 p-1 text-center align-middle">
                        {display ? (
                          <div>
                            <p className="font-semibold text-slate-800">
                              {display.subject?.name || '—'}
                              {display.lessonLength > 1 && <span className="text-[10px] text-brand-600 ml-1">({display.lessonLength}x)</span>}
                            </p>
                            {showTeacher && viewType === 'class' && (
                              <p className="text-[11px] text-slate-500">{display.teacher?.name || '—'}</p>
                            )}
                            {showRoom && <p className="text-[11px] text-slate-400">{display.room?.name || ''}</p>}
                            {viewType === 'class' && display.secondaryClass && (
                              <div className="mt-1 pt-1 border-t border-slate-200">
                                <p className="text-[11px] font-medium text-amber-600">{display.secondaryClass.name}</p>
                                <p className="text-[10px] text-slate-500">{display.secondarySubject?.name} ({display.secondaryTeacher?.name || '—'})</p>
                              </div>
                            )}
                            {viewType === 'teacher' && <p className="text-[11px] text-slate-500">{display.cls?.name || '—'}</p>}
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          )}
          <div className="text-center mt-4 print:hidden">
            <p className="text-xs text-slate-400">Generated by Shikola Timetable Creator - Sepio Corp</p>
          </div>
          <div className="text-center mt-4 hidden print:block">
            <p style={{ fontSize: '8px', color: '#999' }}>Generated by Shikola Timetable Creator - Sepio Corp</p>
          </div>
        </div>
      )}
    </div>
  )
})

export default PrintPreview
