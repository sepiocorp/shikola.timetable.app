import React, { useState, useMemo, useEffect, useRef } from 'react'
import { useApp, getScheduleForClass } from '../store/AppContext.jsx'
import { sounds } from '../utils/sounds.js'
import { Button, Select, Card, PageHeader, EmptyState, Spinner, SkeletonCard, Tabs, Checkbox } from '../components/UI.jsx'
import { exportTimetablePDF, exportMasterPDF, exportCSV, exportMasterCSV, exportBulkPDF, exportBulkCSV } from '../utils/export.js'
import Statistics from './Statistics.jsx'
import TimetableVerification from './TimetableVerification.jsx'
import PrintPreview from './PrintPreview.jsx'

const PAPER_SIZES = ['a4', 'a3', 'a2', 'a1']
const ORIENTATIONS = ['portrait', 'landscape']

export default function ViewTimetables({ navigate, searchQuery }) {
  const { state, dispatch } = useApp()
  const [viewType, setViewType] = useState('class')
  const [selectedId, setSelectedId] = useState('')
  const [selectedDeptId, setSelectedDeptId] = useState('')
  const [paperSize, setPaperSize] = useState('a4')
  const [orientation, setOrientation] = useState('landscape')
  const [exporting, setExporting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [bulkMode, setBulkMode] = useState(false)
  const verificationRef = useRef(null)
  const printRef = useRef(null)
  const [bulkType, setBulkType] = useState('classes')
  const [selectedBulkIds, setSelectedBulkIds] = useState([])
  const [sectionFilter, setSectionFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [pageTab, setPageTab] = useState('view')

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000)
    return () => clearTimeout(timer)
  }, [])

  const activePeriod = state.academicPeriods.find(p => p.id === state.activePeriodId)
  const periodLabel = activePeriod ? activePeriod.name : ''

  const activeSchedule = useMemo(() => {
    if (viewType === 'class' && selectedId) return getScheduleForClass(state, selectedId)
    return { days: state.settings.days, periods: state.settings.periods }
  }, [state, viewType, selectedId])

  const deptTeachers = useMemo(() => {
    if (viewType !== 'department' || !selectedDeptId) return []
    return state.teachers.filter(t => t.departmentId === selectedDeptId)
  }, [state.teachers, viewType, selectedDeptId])

  const deptTeacherIds = useMemo(() => new Set(deptTeachers.map(t => t.id)), [deptTeachers])

  const teachingPeriods = activeSchedule.periods.filter(p => !p.isBreak)

  const buildRows = (entries, teacherId = null, schedule = activeSchedule) => {
    const rows = {}
    for (const day of schedule.days) {
      rows[day] = {}
      for (const entry of entries.filter(e => e.day === day)) {
        if (teacherId) {
          // Teacher view mode: show class info instead of teacher name
          const parts = []
          if (entry.teacherId === teacherId) {
            const cls = state.classes.find(c => c.id === entry.classId)
            const subject = state.subjects.find(s => s.id === entry.subjectId)
            const room = state.rooms.find(r => r.id === entry.roomId)
            if (cls) parts.push(cls.name)
            if (subject) parts.push(subject.name)
            if (room) parts.push(room.name)
          } else if (entry.secondaryTeacherId === teacherId) {
            const secClass = state.classes.find(c => c.id === entry.secondaryClassId)
            const secSubject = state.subjects.find(s => s.id === entry.secondarySubjectId)
            if (secClass) parts.push(secClass.name)
            if (secSubject) parts.push(secSubject.name)
            parts.push('(Secondary)')
          }
          if (parts.length > 0) {
            rows[day][entry.periodId] = parts.join('\n')
          }
        } else {
          const teacher = state.teachers.find(t => t.id === entry.teacherId)
          const subject = state.subjects.find(s => s.id === entry.subjectId)
          const room = state.rooms.find(r => r.id === entry.roomId)
          const parts = []
          if (subject) parts.push(subject.name)
          if (teacher) parts.push(teacher.name)
          if (room) parts.push(room.name)
          if (entry.secondaryClassId) {
            const secClass = state.classes.find(c => c.id === entry.secondaryClassId)
            const secSubject = state.subjects.find(s => s.id === entry.secondarySubjectId)
            const secTeacher = state.teachers.find(t => t.id === entry.secondaryTeacherId)
            const secParts = []
            if (secClass) secParts.push(secClass.name)
            if (secSubject) secParts.push(secSubject.name)
            if (secTeacher) secParts.push(secTeacher.name)
            parts.push('│ ' + secParts.join(' / '))
          }
          rows[day][entry.periodId] = parts.join('\n')
        }
      }
    }
    return rows
  }

  const currentEntries = useMemo(() => {
    if (viewType === 'class') {
      return state.timetable.filter(e => e.classId === selectedId)
    } else if (viewType === 'teacher') {
      return state.timetable.filter(e => e.teacherId === selectedId || e.secondaryTeacherId === selectedId)
    } else if (viewType === 'department') {
      return state.timetable.filter(e => deptTeacherIds.has(e.teacherId) || deptTeacherIds.has(e.secondaryTeacherId))
    }
    return []
  }, [state.timetable, selectedId, viewType, deptTeacherIds])

  const currentRows = useMemo(() => buildRows(currentEntries, viewType === 'teacher' ? selectedId : null), [currentEntries, viewType, selectedId])

  const deptMasterData = useMemo(() => {
    if (viewType !== 'department') return []
    return currentEntries.map(e => ({
      ...e,
      teacherName: state.teachers.find(t => t.id === e.teacherId)?.name || '',
      className: state.classes.find(c => c.id === e.classId)?.name || '',
      subjectName: state.subjects.find(s => s.id === e.subjectId)?.name || '',
      roomName: state.rooms.find(r => r.id === e.roomId)?.name || '',
      secondaryClassName: e.secondaryClassId ? state.classes.find(c => c.id === e.secondaryClassId)?.name || '' : '',
      secondarySubjectName: e.secondarySubjectId ? state.subjects.find(s => s.id === e.secondarySubjectId)?.name || '' : '',
      secondaryTeacherName: e.secondaryTeacherId ? state.teachers.find(t => t.id === e.secondaryTeacherId)?.name || '' : '',
    }))
  }, [currentEntries, state.teachers, state.classes, state.subjects, state.rooms, viewType])

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

  const getExportTitle = () => {
    if (viewType === 'class') {
      const cls = state.classes.find(c => c.id === selectedId)
      return cls ? `${cls.name} Timetable` : 'Class Timetable'
    } else if (viewType === 'teacher') {
      const teacher = state.teachers.find(t => t.id === selectedId)
      return teacher ? `${teacher.name} Timetable` : 'Teacher Timetable'
    } else if (viewType === 'department') {
      const dept = state.departments.find(d => d.id === selectedDeptId)
      return dept ? `${dept.name} Department Timetable` : 'Department Timetable'
    }
    return 'Master Timetable'
  }

  const handleExportPDF = () => {
    setExporting(true)
    setTimeout(() => {
      if (viewType === 'master' || viewType === 'department') {
        exportMasterPDF({
          days: state.settings.days,
          periods: state.settings.periods,
          timetables: viewType === 'department' ? deptMasterData : masterData,
          paperSize,
          orientation,
          school: state.school,
          periodLabel,
          title: viewType === 'department' ? getExportTitle() : undefined,
        })
      } else {
        const subtitle = viewType === 'class'
          ? state.classes.find(c => c.id === selectedId)?.name
          : state.teachers.find(t => t.id === selectedId)?.name
        exportTimetablePDF({
          title: getExportTitle(),
          subtitle,
          days: activeSchedule.days,
          periods: activeSchedule.periods,
          rows: currentRows,
          paperSize,
          orientation,
          school: state.school,
          periodLabel,
        })
      }
      setExporting(false)
    }, 100)
  }

  const handleExportCSV = () => {
    setExporting(true)
    setTimeout(() => {
      if (viewType === 'master' || viewType === 'department') {
        exportMasterCSV({
          days: state.settings.days,
          periods: state.settings.periods,
          timetables: viewType === 'department' ? deptMasterData : masterData,
          periodLabel,
        })
      } else {
        exportCSV({
          title: getExportTitle(),
          days: activeSchedule.days,
          periods: activeSchedule.periods,
          rows: currentRows,
        })
      }
      setExporting(false)
    }, 100)
  }

  const buildBulkItems = () => {
    let sourceList = bulkType === 'classes' ? state.classes : bulkType === 'teachers' ? state.teachers : state.departments
    if (sectionFilter && bulkType === 'classes') {
      sourceList = sourceList.filter(c => c.sectionId === sectionFilter)
    }
    const filtered = selectedBulkIds.length > 0
      ? sourceList.filter(item => selectedBulkIds.includes(item.id))
      : sourceList
    return filtered.map(item => {
      if (bulkType === 'departments') {
        const deptTeachers = state.teachers.filter(t => t.departmentId === item.id)
        const deptTeacherIds = new Set(deptTeachers.map(t => t.id))
        const entries = state.timetable.filter(e => deptTeacherIds.has(e.teacherId) || deptTeacherIds.has(e.secondaryTeacherId))
        const deptMasterData = entries.map(e => ({
          ...e,
          teacherName: state.teachers.find(t => t.id === e.teacherId)?.name || '',
          className: state.classes.find(c => c.id === e.classId)?.name || '',
          subjectName: state.subjects.find(s => s.id === e.subjectId)?.name || '',
          roomName: state.rooms.find(r => r.id === e.roomId)?.name || '',
          secondaryClassName: e.secondaryClassId ? state.classes.find(c => c.id === e.secondaryClassId)?.name || '' : '',
          secondarySubjectName: e.secondarySubjectId ? state.subjects.find(s => s.id === e.secondarySubjectId)?.name || '' : '',
          secondaryTeacherName: e.secondaryTeacherId ? state.teachers.find(t => t.id === e.secondaryTeacherId)?.name || '' : '',
        }))
        return { ...item, deptMasterData, schedule: activeSchedule }
      }
      const itemSchedule = bulkType === 'classes' ? getScheduleForClass(state, item.id) : activeSchedule
      const entries = bulkType === 'classes'
        ? state.timetable.filter(e => e.classId === item.id)
        : state.timetable.filter(e => e.teacherId === item.id || e.secondaryTeacherId === item.id)
      return { ...item, rows: buildRows(entries, bulkType === 'teachers' ? item.id : null, itemSchedule), schedule: itemSchedule }
    })
  }

  const handleBulkExportPDF = () => {
    const items = buildBulkItems()
    if (items.length === 0) {
      sounds.error()
      return
    }
    setExporting(true)
    setTimeout(() => {
      exportBulkPDF({
        items,
        days: state.settings.days,
        periods: state.settings.periods,
        school: state.school,
        paperSize,
        orientation,
        bulkType,
        periodLabel,
        getScheduleForClassFn: (classId) => getScheduleForClass(state, classId),
      })
      setExporting(false)
    }, 200)
  }

  const handleBulkExportCSV = () => {
    const items = buildBulkItems()
    if (items.length === 0) {
      sounds.error()
      return
    }
    setExporting(true)
    setTimeout(() => {
      exportBulkCSV({
        items,
        days: state.settings.days,
        periods: state.settings.periods,
        bulkType,
        periodLabel,
        getScheduleForClassFn: (classId) => getScheduleForClass(state, classId),
      })
      setExporting(false)
    }, 200)
  }

  const toggleBulkId = (id) => {
    sounds.click()
    setSelectedBulkIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const toggleAllBulk = () => {
    const sourceList = bulkType === 'classes' ? state.classes : bulkType === 'teachers' ? state.teachers : state.departments
    sounds.click()
    if (selectedBulkIds.length === sourceList.length) {
      setSelectedBulkIds([])
    } else {
      setSelectedBulkIds(sourceList.map(i => i.id))
    }
  }

  const viewOptions = (viewType === 'class' && sectionFilter)
    ? state.classes.filter(c => c.sectionId === sectionFilter)
    : viewType === 'class' ? state.classes
    : viewType === 'teacher' && departmentFilter
    ? state.teachers.filter(t => t.departmentId === departmentFilter)
    : state.teachers
  const bulkSourceList = (bulkType === 'classes' && sectionFilter)
    ? state.classes.filter(c => c.sectionId === sectionFilter)
    : bulkType === 'classes' ? state.classes
    : bulkType === 'teachers' && departmentFilter
    ? state.teachers.filter(t => t.departmentId === departmentFilter)
    : bulkType === 'teachers' ? state.teachers
    : bulkType === 'departments' ? state.departments : state.departments

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <PageHeader title="View Timetables" subtitle="Loading..." />
        <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      {exporting && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
          <Spinner size="xl" />
          <p className="mt-4 text-sm font-medium text-slate-600">Generating export...</p>
        </div>
      )}

      <PageHeader
        title={pageTab === 'statistics' ? 'Statistics' : pageTab === 'verify' ? 'Timetable Verification' : pageTab === 'print' ? 'Print Preview' : bulkMode ? 'Bulk Export' : 'View Timetables'}
        subtitle={pageTab === 'statistics' ? 'Analyze gaps, teacher load, and timetable efficiency' : pageTab === 'verify' ? 'Validate your data and timetable against all constraints before and after generation' : pageTab === 'print' ? 'WYSIWYG preview of your timetables before printing' : 'View and export timetables as PDF or CSV'}
        action={
          <div className="flex items-center gap-2">
            {periodLabel && (
              <span className="inline-flex items-center px-3 py-1 rounded-lg bg-brand-100 text-brand-700 text-sm font-medium">
                {periodLabel}
              </span>
            )}
            {pageTab === 'verify' && <Button onClick={() => verificationRef.current?.runVerification()} disabled={state.classes.length === 0}>Run Verification</Button>}
            {pageTab === 'print' && <Button onClick={() => printRef.current?.handlePrint()}>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </span>
            </Button>}
          </div>
        }
      />

      <div className="mb-4">
        <Tabs
          tabs={[
            { id: 'single', label: 'Single Timetable' },
            { id: 'bulk', label: 'Bulk Export' },
            { id: 'statistics', label: 'Statistics' },
            { id: 'verify', label: 'Verification' },
            { id: 'print', label: 'Print Preview' },
          ]}
          active={pageTab === 'view' ? (bulkMode ? 'bulk' : 'single') : pageTab}
          onChange={(id) => {
            if (id === 'single') { setPageTab('view'); setBulkMode(false); }
            else if (id === 'bulk') { setPageTab('view'); setBulkMode(true); }
            else { setPageTab(id); }
            sounds.click()
          }}
        />
      </div>

      {pageTab === 'statistics' ? (
        <Statistics embedded navigate={navigate} />
      ) : pageTab === 'verify' ? (
        <TimetableVerification ref={verificationRef} embedded />
      ) : pageTab === 'print' ? (
        <PrintPreview ref={printRef} embedded navigate={navigate} />
      ) : (
        <>

      {/* Academic Period Selector */}
      {state.academicPeriods.length > 0 && (
        <Card className="p-3 mb-4 bg-brand-50 border-brand-200">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-brand-800">Academic Period:</span>
            <select
              value={state.activePeriodId || ''}
              onChange={e => { sounds.click(); dispatch({ type: 'SET_ACTIVE_PERIOD', payload: e.target.value || null }) }}
              className="px-3 py-1.5 border border-brand-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="">No period (default)</option>
              {state.academicPeriods.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
              ))}
            </select>
          </div>
        </Card>
      )}

      {bulkMode ? (
        /* Bulk Export Mode */
        <div>
          <Card className="p-4 mb-6">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bulk Type</label>
                <select
                  value={bulkType}
                  onChange={e => { setBulkType(e.target.value); setSelectedBulkIds([]); sounds.click() }}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="classes">All Class Timetables</option>
                  <option value="teachers">All Teacher Timetables</option>
                  {state.departments.length > 0 && <option value="departments">All Department Timetables</option>}
                </select>
              </div>
              {state.sections.length > 0 && bulkType === 'classes' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Section Filter</label>
                  <select
                    value={sectionFilter}
                    onChange={e => { setSectionFilter(e.target.value); setSelectedBulkIds([]); sounds.click() }}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  >
                    <option value="">All Sections</option>
                    {state.sections.map(s => (
                      <option key={s.id} value={s.id}>{s.name}{s.session && s.session !== 'full' ? ` (${s.session === 'morning' ? 'Morning' : 'Afternoon'})` : ''}</option>
                    ))}
                  </select>
                </div>
              )}
              {state.departments.length > 0 && bulkType === 'teachers' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department Filter</label>
                  <select
                    value={departmentFilter}
                    onChange={e => { setDepartmentFilter(e.target.value); setSelectedBulkIds([]); sounds.click() }}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  >
                    <option value="">All Departments</option>
                    {state.departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Paper Size</label>
                <select
                  value={paperSize}
                  onChange={e => { setPaperSize(e.target.value); sounds.click() }}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  {PAPER_SIZES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Orientation</label>
                <select
                  value={orientation}
                  onChange={e => { setOrientation(e.target.value); sounds.click() }}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  {ORIENTATIONS.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                </select>
              </div>
              <div className="ml-auto flex items-end gap-3">
                <Button variant="secondary" onClick={handleBulkExportCSV} disabled={bulkSourceList.length === 0}>
                  Bulk Spreadsheet
                </Button>
                <Button onClick={handleBulkExportPDF} disabled={bulkSourceList.length === 0}>
                  Bulk PDF ({selectedBulkIds.length || bulkSourceList.length} files)
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-700">
                Select {bulkType === 'classes' ? 'Classes' : bulkType === 'teachers' ? 'Teachers' : 'Departments'} to Export
              </h3>
              <button
                onClick={toggleAllBulk}
                className="text-xs text-brand-600 hover:text-brand-700 font-medium"
              >
                {selectedBulkIds.length === bulkSourceList.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              {selectedBulkIds.length > 0
                ? `${selectedBulkIds.length} selected - will export only selected`
                : `All ${bulkSourceList.length} will be exported (click to select specific ones)`}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 md:grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {bulkSourceList.map(item => (
                <label
                  key={item.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedBulkIds.includes(item.id)
                      ? 'border-brand-600 bg-brand-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Checkbox
                    checked={selectedBulkIds.includes(item.id)}
                    onChange={() => toggleBulkId(item.id)}
                  />
                  <span className="text-sm text-slate-700">{item.name}</span>
                </label>
              ))}
            </div>
          </Card>
        </div>
      ) : (
        /* Single Export Mode */
        <div>
          {/* Controls */}
          <Card className="p-4 mb-6">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">View Type</label>
                <select
                  value={viewType}
                  onChange={e => { setViewType(e.target.value); setSelectedId(''); setSelectedDeptId(''); sounds.click() }}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="class">Class Timetable</option>
                  <option value="teacher">Teacher Timetable</option>
                  <option value="master">Master Timetable</option>
                  {state.departments.length > 0 && <option value="department">Department Timetable</option>}
                </select>
              </div>

              {/* Section Filter */}
          {state.sections.length > 0 && viewType === 'class' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Section</label>
              <select
                value={sectionFilter}
                onChange={e => { setSectionFilter(e.target.value); setSelectedId(''); sounds.click() }}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="">All Sections</option>
                {state.sections.map(s => (
                  <option key={s.id} value={s.id}>{s.name}{s.session && s.session !== 'full' ? ` (${s.session === 'morning' ? 'Morning' : 'Afternoon'})` : ''}</option>
                ))}
              </select>
            </div>
          )}

          {viewType === 'department' ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Select Department</label>
                  <select
                    value={selectedDeptId}
                    onChange={e => { setSelectedDeptId(e.target.value); sounds.click() }}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white min-w-[200px]"
                  >
                    <option value="">-- Select --</option>
                    {state.departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              ) : viewType !== 'master' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {viewType === 'class' ? 'Select Class' : 'Select Teacher'}
                  </label>
                  <select
                    value={selectedId}
                    onChange={e => { setSelectedId(e.target.value); sounds.click() }}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white min-w-[200px]"
                  >
                    <option value="">-- Select --</option>
                    {viewOptions.map(item => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {state.departments.length > 0 && viewType === 'teacher' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                  <select
                    value={departmentFilter}
                    onChange={e => { setDepartmentFilter(e.target.value); setSelectedId(''); sounds.click() }}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  >
                    <option value="">All Departments</option>
                    {state.departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {state.sections.length > 0 && (viewType === 'master' || bulkMode) && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Section Filter</label>
                  <select
                    value={sectionFilter}
                    onChange={e => { setSectionFilter(e.target.value); setSelectedBulkIds([]); sounds.click() }}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  >
                    <option value="">All Sections</option>
                    {state.sections.map(s => (
                      <option key={s.id} value={s.id}>{s.name}{s.session && s.session !== 'full' ? ` (${s.session === 'morning' ? 'Morning' : 'Afternoon'})` : ''}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="ml-auto flex items-end gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Paper Size</label>
                  <select
                    value={paperSize}
                    onChange={e => { setPaperSize(e.target.value); sounds.click() }}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  >
                    {PAPER_SIZES.map(s => (
                      <option key={s} value={s}>{s.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Orientation</label>
                  <select
                    value={orientation}
                    onChange={e => { setOrientation(e.target.value); sounds.click() }}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  >
                    {ORIENTATIONS.map(o => (
                      <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <Button variant="secondary" onClick={handleExportCSV} disabled={viewType === 'department' ? !selectedDeptId : viewType !== 'master' && !selectedId}>
                  Export Spreadsheet
                </Button>
                <Button onClick={handleExportPDF} disabled={viewType === 'department' ? !selectedDeptId : viewType !== 'master' && !selectedId}>
                  Export PDF
                </Button>
              </div>
            </div>
          </Card>

          {/* Timetable Display */}
          {viewType === 'master' ? (
            <MasterTimetableView state={state} masterData={masterData} navigate={navigate} sectionFilter={sectionFilter} />
          ) : viewType === 'department' ? (
            selectedDeptId ? (
              <DepartmentTimetableView state={state} deptMasterData={deptMasterData} navigate={navigate} deptName={getExportTitle()} />
            ) : (
              <Card className="p-6">
                <EmptyState
                  icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"
                  title="Select a department"
                  subtitle="Choose a department to view all its teachers' timetables"
                />
              </Card>
            )
          ) : selectedId ? (
            <TimetableView
              state={state}
              schedule={activeSchedule}
              entries={currentEntries}
              rows={currentRows}
              title={getExportTitle()}
              navigate={navigate}
            />
          ) : (
            <Card className="p-6">
              <EmptyState
                icon="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                title="Select to view"
                subtitle={viewType === 'class' ? 'Choose a class to view its timetable' : 'Choose a teacher to view their timetable'}
              />
            </Card>
          )}
        </div>
      )}
        </>
      )}
    </div>
  )
}

function TimetableView({ state, schedule, entries, rows, title, navigate }) {
  const days = schedule?.days || state.settings.days
  const periods = schedule?.periods || state.settings.periods
  if (entries.length === 0) {
    return (
      <Card className="p-6">
        <EmptyState
          icon="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          title="No entries"
          subtitle="This timetable has not been created yet. Use the Timetable Editor or Smart Generate to create it."
          action={
            <div className="flex gap-2">
              <Button variant="success" onClick={() => navigate('generate')}>Smart Generate</Button>
              <Button variant="secondary" onClick={() => navigate('editor')}>Open Editor</Button>
            </div>
          }
        />
      </Card>
    )
  }

  return (
    <Card className="p-4 overflow-auto">
      <h3 className="text-lg font-bold text-slate-800 mb-4">{title}</h3>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border border-slate-200 bg-brand-50 text-brand-700 text-xs font-bold px-3 py-2 text-center">
              Day / Period
            </th>
            {periods.map(period => (
              <th
                key={period.id}
                className={`border border-slate-200 text-xs font-bold px-3 py-2 text-center min-w-[140px] ${
                  period.isBreak ? 'bg-slate-100 text-slate-400' : 'bg-brand-600 text-white'
                }`}
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
          {days.map(day => (
            <tr key={day}>
              <td className="border border-slate-200 bg-brand-50 text-brand-700 text-xs font-bold px-3 py-2 text-center">
                {day}
              </td>
              {periods.map(period => {
                if (period.isBreak) {
                  return (
                    <td key={period.id} className="border border-slate-200 bg-slate-50 text-center text-xs text-slate-400 py-2">
                      Break
                    </td>
                  )
                }
                const cellText = rows[day]?.[period.id]
                return (
                  <td key={period.id} className="border border-slate-200 p-2 text-center">
                    {cellText ? (
                      <div className="text-xs">
                        {cellText.split('\n').map((line, i) => (
                          <p key={i} className={i === 0 ? 'font-semibold text-slate-800' : 'text-slate-500'}>{line}</p>
                        ))}
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
    </Card>
  )
}

function MasterTimetableView({ state, masterData, navigate, sectionFilter }) {
  const section = sectionFilter ? state.sections.find(s => s.id === sectionFilter) : null
  const masterDays = section ? section.days : state.settings.days
  const masterPeriods = section ? section.periods : state.settings.periods
  const filteredMasterData = sectionFilter
    ? masterData.filter(e => {
        const cls = state.classes.find(c => c.id === e.classId)
        return cls?.sectionId === sectionFilter
      })
    : masterData
  if (filteredMasterData.length === 0) {
    return (
      <Card className="p-6">
        <EmptyState
          icon="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          title="No timetable entries"
          subtitle="Create timetables using the Timetable Editor or Smart Generate first"
          action={
            <div className="flex gap-2">
              <Button variant="success" onClick={() => navigate('generate')}>Smart Generate</Button>
              <Button variant="secondary" onClick={() => navigate('editor')}>Open Editor</Button>
            </div>
          }
        />
      </Card>
    )
  }

  return (
    <Card className="p-4 overflow-auto">
      <h3 className="text-lg font-bold text-slate-800 mb-4">Master Timetable</h3>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border border-slate-200 bg-brand-50 text-brand-700 text-xs font-bold px-3 py-2 text-center sticky left-0 z-10">
              Day / Period
            </th>
            {masterPeriods.map(period => (
              <th
                key={period.id}
                className={`border border-slate-200 text-xs font-bold px-2 py-2 text-center min-w-[160px] ${
                  period.isBreak ? 'bg-slate-100 text-slate-400' : 'bg-brand-600 text-white'
                }`}
              >
                {period.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {masterDays.map(day => (
            <tr key={day}>
              <td className="border border-slate-200 bg-brand-50 text-brand-700 text-xs font-bold px-3 py-2 text-center sticky left-0 z-10">
                {day}
              </td>
              {masterPeriods.map(period => {
                if (period.isBreak) {
                  return (
                    <td key={period.id} className="border border-slate-200 bg-slate-50 text-center text-xs text-slate-400 py-2">
                      Break
                    </td>
                  )
                }
                const entries = filteredMasterData.filter(e => e.day === day && e.periodId === period.id)
                return (
                  <td key={period.id} className="border border-slate-200 p-1 align-top">
                    {entries.length > 0 ? (
                      <div className="space-y-1">
                        {entries.map(e => (
                          <div key={e.id} className="text-[10px] bg-brand-50 rounded px-1 py-0.5">
                            <p className="font-semibold text-brand-800">{e.className}</p>
                            <p className="text-slate-600">{e.subjectName}</p>
                            <p className="text-slate-400">{e.teacherName}</p>
                            {e.secondaryClassName && (
                              <div className="mt-0.5 pt-0.5 border-t border-brand-100">
                                <p className="font-semibold text-amber-700">{e.secondaryClassName}</p>
                                <p className="text-slate-500">{e.secondarySubjectName}</p>
                                <p className="text-slate-400">{e.secondaryTeacherName}</p>
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
    </Card>
  )
}

function DepartmentTimetableView({ state, deptMasterData, navigate, deptName }) {
  const masterDays = state.settings.days
  const masterPeriods = state.settings.periods

  if (deptMasterData.length === 0) {
    return (
      <Card className="p-6">
        <EmptyState
          icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"
          title="No timetable entries"
          subtitle="No teachers in this department have timetable entries yet. Use the Timetable Editor or Smart Generate to create them."
          action={
            <div className="flex gap-2">
              <Button variant="success" onClick={() => navigate('generate')}>Smart Generate</Button>
              <Button variant="secondary" onClick={() => navigate('editor')}>Open Editor</Button>
            </div>
          }
        />
      </Card>
    )
  }

  return (
    <Card className="p-4 overflow-auto">
      <h3 className="text-lg font-bold text-slate-800 mb-4">{deptName}</h3>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border border-slate-200 bg-brand-50 text-brand-700 text-xs font-bold px-3 py-2 text-center sticky left-0 z-10">
              Day / Period
            </th>
            {masterPeriods.map(period => (
              <th
                key={period.id}
                className={`border border-slate-200 text-xs font-bold px-2 py-2 text-center min-w-[160px] ${
                  period.isBreak ? 'bg-slate-100 text-slate-400' : 'bg-brand-600 text-white'
                }`}
              >
                {period.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {masterDays.map(day => (
            <tr key={day}>
              <td className="border border-slate-200 bg-brand-50 text-brand-700 text-xs font-bold px-3 py-2 text-center sticky left-0 z-10">
                {day}
              </td>
              {masterPeriods.map(period => {
                if (period.isBreak) {
                  return (
                    <td key={period.id} className="border border-slate-200 bg-slate-50 text-center text-xs text-slate-400 py-2">
                      Break
                    </td>
                  )
                }
                const entries = deptMasterData.filter(e => e.day === day && e.periodId === period.id)
                return (
                  <td key={period.id} className="border border-slate-200 p-1 align-top">
                    {entries.length > 0 ? (
                      <div className="space-y-1">
                        {entries.map(e => (
                          <div key={e.id} className="text-[10px] bg-brand-50 rounded px-1 py-0.5">
                            <p className="font-semibold text-brand-800">{e.teacherName}</p>
                            <p className="text-slate-600">{e.className} - {e.subjectName}</p>
                            <p className="text-slate-400">{e.roomName}</p>
                            {e.secondaryClassName && (
                              <div className="mt-0.5 pt-0.5 border-t border-brand-100">
                                <p className="font-semibold text-amber-700">{e.secondaryTeacherName}</p>
                                <p className="text-slate-500">{e.secondaryClassName} - {e.secondarySubjectName}</p>
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
    </Card>
  )
}
