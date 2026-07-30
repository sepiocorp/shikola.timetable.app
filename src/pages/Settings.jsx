import React, { useState, useEffect } from 'react'
import { useApp, PERIOD_TYPES } from '../store/AppContext.jsx'
import { sounds } from '../utils/sounds.js'
import { Button, Input, Select, Card, PageHeader, Modal, Toggle, Badge, Tabs, SkeletonCard } from '../components/UI.jsx'
import { sendRegistration, trackEvent } from '../utils/telemetry.js'
import BackupRestore from './BackupRestore.jsx'
import { ChangelogList } from '../components/WhatsNew.jsx'
import { APP_VERSION, APP_CODENAME } from '../data/changelog.js'
import LegalDocuments from './LegalDocuments.jsx'

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const COLOR_PRESETS = [
  { name: 'Blue', primary: '#2563eb', accent: '#3b82f6' },
  { name: 'Zambia Green', primary: '#198a00', accent: '#f36614' },
  { name: 'Teal', primary: '#0d9488', accent: '#14b8a6' },
  { name: 'Emerald', primary: '#059669', accent: '#10b981' },
  { name: 'Zambia Red', primary: '#d41c30', accent: '#2b67ce' },
  { name: 'Rose', primary: '#e11d48', accent: '#f43f5e' },
  { name: 'Zambia Orange', primary: '#f36614', accent: '#198a00' },
  { name: 'Slate', primary: '#475569', accent: '#64748b' },
]

const SUB_TABS = {
  school: [
    { id: 'info', label: 'Info' },
    { id: 'days', label: 'Days' },
    { id: 'periods', label: 'Periods' },
    { id: 'sections', label: 'Sections' },
    { id: 'academic', label: 'Academic' },
    { id: 'buildings', label: 'Buildings' },
  ],
  appearance: [
    { id: 'colors', label: 'Colors & Display' },
    { id: 'language', label: 'Language' },
    { id: 'fields', label: 'Custom Fields' },
  ],
  advanced: [
    { id: 'lunch', label: 'Lunch' },
    { id: 'cycle', label: 'Multi-Week' },
    { id: 'blocks', label: 'Blocks' },
  ],
  data: [
    { id: 'backup', label: 'Backup' },
    { id: 'restore', label: 'Restore' },
  ],
  legal: [
    { id: 'terms', label: 'Terms of Service' },
    { id: 'privacy', label: 'Privacy Policy' },
    { id: 'dpa', label: 'DPA' },
    { id: 'refund', label: 'Refund Policy' },
    { id: 'msa', label: 'MSA' },
    { id: 'cyberInsurance', label: 'Cyber Insurance' },
  ],
  about: [
    { id: 'about', label: 'About' },
    { id: 'customization', label: 'Customization' },
    { id: 'license', label: 'License' },
    { id: 'limits', label: 'Limits' },
    { id: 'privacy', label: 'Privacy' },
    { id: 'updates', label: 'Updates' },
    { id: 'changelog', label: 'Changelog' },
  ],
}

const DEFAULT_SUB_TAB = {
  school: 'info',
  appearance: 'colors',
  advanced: 'lunch',
  data: 'backup',
  legal: 'terms',
  about: 'about',
}

const ABOUT_FEATURES = [
  { icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', title: 'Timetable Editor', desc: 'Create and edit class timetables with automatic conflict detection' },
  { icon: 'M13 10V3L4 14h7v7l9-11h-7z', title: 'Auto-Generate', desc: 'Automatically generate timetables for single or all classes with smart teacher and room assignment', aiLogo: true },
  { icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', title: 'Export & Print', desc: 'Export timetables as PDF or CSV in multiple paper sizes (A4-A1) with bulk export support' },
  { icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', title: 'Teacher Management', desc: 'Manage teachers with subject assignments and maximum period limits' },
  { icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', title: 'Customization', desc: 'Customize colors, themes, display options, and school branding with logo upload' },
  { icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5', title: 'Academic Periods', desc: 'Organize timetables by week, term, quarter, semester, or full academic year' },
]

function BuildingForm({ onAdd }) {
  const [name, setName] = useState('')
  const [floors, setFloors] = useState('')

  const handleAdd = () => {
    if (!name.trim()) return
    onAdd({ name: name.trim(), floors: floors ? parseInt(floors) : undefined })
    setName('')
    setFloors('')
  }

  return (
    <div className="flex gap-3 items-end">
      <div className="flex-1">
        <label className="block text-sm font-medium text-slate-700 mb-1">Building Name</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="e.g., Science Block"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
      <div className="w-24">
        <label className="block text-sm font-medium text-slate-700 mb-1">Floors</label>
        <input
          type="number"
          min="1"
          value={floors}
          onChange={e => setFloors(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="1"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
      <Button size="sm" onClick={handleAdd}>Add</Button>
    </div>
  )
}

function EducationBlockForm({ onAdd, state }) {
  const [subjectId, setSubjectId] = useState('')
  const [classId, setClassId] = useState('')
  const [length, setLength] = useState(2)
  const [days, setDays] = useState([])

  const toggleDay = (day) => {
    setDays(d => d.includes(day) ? d.filter(x => x !== day) : [...d, day])
  }

  const handleAdd = () => {
    if (length < 2) return
    onAdd({ subjectId, classId, length: parseInt(length), days })
    setSubjectId(''); setClassId(''); setLength(2); setDays([])
  }

  return (
    <div className="border-t border-slate-200 pt-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Subject (optional)</label>
          <select value={subjectId} onChange={e => setSubjectId(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
            <option value="">Any subject</option>
            {state.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Class (optional)</label>
          <select value={classId} onChange={e => setClassId(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
            <option value="">All classes</option>
            {state.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Block Length (periods)</label>
          <input type="number" min="2" max="6" value={length} onChange={e => setLength(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Days (optional)</label>
        <div className="flex gap-2 flex-wrap">
          {state.settings.days.map(day => (
            <button key={day} onClick={() => toggleDay(day)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${days.includes(day) ? 'bg-brand-100 text-brand-700 border-brand-300' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>{day}</button>
          ))}
        </div>
      </div>
      <Button size="sm" onClick={handleAdd}>+ Add Block</Button>
    </div>
  )
}

function CustomFieldForm({ onAdd, state }) {
  const [key, setKey] = useState('')
  const [label, setLabel] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [classId, setClassId] = useState('')

  const handleAdd = () => {
    if (!key.trim() || !label.trim()) return
    onAdd({ key: key.trim(), label: label.trim(), subjectId, classId })
    setKey(''); setLabel(''); setSubjectId(''); setClassId('')
  }

  return (
    <div className="border-t border-slate-200 pt-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Field Key *</label>
          <input value={key} onChange={e => setKey(e.target.value)} placeholder="e.g., note, abbreviation" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Display Label *</label>
          <input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g., Room Note" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Subject (optional)</label>
          <select value={subjectId} onChange={e => setSubjectId(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
            <option value="">All subjects</option>
            {state.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Class (optional)</label>
          <select value={classId} onChange={e => setClassId(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
            <option value="">All classes</option>
            {state.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>
      <Button size="sm" onClick={handleAdd}>+ Add Field</Button>
    </div>
  )
}

export default function Settings({ searchQuery }) {
  const { state, dispatch, entityCount, entityLimit, validateLicense, clearLicense } = useApp()
  const [loading, setLoading] = useState(false)

  const [schoolForm, setSchoolForm] = useState(state.school || {})
  const [periods, setPeriods] = useState(state.settings.periods)
  const [selectedDays, setSelectedDays] = useState(state.settings.days)
  const [resetModal, setResetModal] = useState(false)
  const [settingsTab, setSettingsTab] = useState('school')
  const [subTab, setSubTab] = useState('info')
  const [periodModal, setPeriodModal] = useState(false)
  const [editingPeriod, setEditingPeriod] = useState(null)
  const [periodForm, setPeriodForm] = useState({ name: '', type: 'term', startDate: '', endDate: '' })
  const [appearance, setAppearance] = useState(state.appearance || {})
  const [sectionModal, setSectionModal] = useState(false)
  const [editingSection, setEditingSection] = useState(null)
  const [sectionForm, setSectionForm] = useState({ name: '', session: 'full', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], periods: [] })
  const [sectionNumPeriods, setSectionNumPeriods] = useState(8)
  const [storageLimitModal, setStorageLimitModal] = useState(false)
  const [licenseKeyInput, setLicenseKeyInput] = useState('')
  const [licenseValidating, setLicenseValidating] = useState(false)
  const [licenseError, setLicenseError] = useState(null)
  const [licenseSuccess, setLicenseSuccess] = useState(null)

  const handleSchoolSave = () => {
    dispatch({ type: 'SET_SCHOOL', payload: schoolForm })
    sounds.save()
    dispatch({ type: 'SET_SUCCESS_MESSAGE', payload: 'School info saved successfully' })
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      alert('Logo file size must be less than 2MB')
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      setSchoolForm({ ...schoolForm, logo: event.target.result })
      sounds.add()
    }
    reader.readAsDataURL(file)
  }

  const handlePeriodUpdate = (id, field, value) => {
    setPeriods(periods.map(p => p.id === id ? { ...p, [field]: value } : p))
    sounds.click()
  }

  const handleAddPeriod = () => {
    const teachingCount = periods.filter(p => !p.isBreak).length
    const lastPeriod = periods[periods.length - 1]
    let start = '08:00'
    if (lastPeriod?.end) {
      const [h, m] = lastPeriod.end.split(':').map(Number)
      const newM = m + 40
      const newH = h + Math.floor(newM / 60)
      start = `${String(newH).padStart(2, '0')}:${String(newM % 60).padStart(2, '0')}`
    }
    const [sh, sm] = start.split(':').map(Number)
    const endM = sm + 40
    const endH = sh + Math.floor(endM / 60)
    const end = `${String(endH).padStart(2, '0')}:${String(endM % 60).padStart(2, '0')}`
    const newId = Date.now()
    setPeriods([...periods, { id: newId, name: `Period ${teachingCount + 1}`, start, end }])
    sounds.add()
  }

  const handleAddBreak = () => {
    const lastPeriod = periods[periods.length - 1]
    let start = '10:00'
    if (lastPeriod?.end) {
      const [h, m] = lastPeriod.end.split(':').map(Number)
      const newM = m + 15
      const newH = h + Math.floor(newM / 60)
      start = `${String(newH).padStart(2, '0')}:${String(newM % 60).padStart(2, '0')}`
    }
    const [sh, sm] = start.split(':').map(Number)
    const endM = sm + 15
    const endH = sh + Math.floor(endM / 60)
    const end = `${String(endH).padStart(2, '0')}:${String(endM % 60).padStart(2, '0')}`
    const newId = Date.now() + 100
    setPeriods([...periods, { id: newId, name: 'Break', start, end, isBreak: true }])
    sounds.add()
  }

  const handleRemovePeriod = (id) => {
    setPeriods(periods.filter(p => p.id !== id))
    sounds.delete()
  }

  const handlePeriodsSave = () => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { periods } })
    sounds.save()
    dispatch({ type: 'SET_SUCCESS_MESSAGE', payload: 'Period times saved successfully' })
  }

  const handleDayToggle = (day) => {
    sounds.click()
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day))
    } else {
      setSelectedDays([...selectedDays, day])
    }
  }

  const handleDaysSave = () => {
    const ordered = ALL_DAYS.filter(d => selectedDays.includes(d))
    dispatch({ type: 'UPDATE_SETTINGS', payload: { days: ordered } })
    sounds.save()
    dispatch({ type: 'SET_SUCCESS_MESSAGE', payload: 'School days saved successfully' })
  }

  const handleReset = () => {
    dispatch({ type: 'RESET_ALL' })
    sounds.delete()
    setResetModal(false)
  }

  const handleAppearanceSave = () => {
    dispatch({ type: 'SET_APPEARANCE', payload: appearance })
    sounds.save()
    dispatch({ type: 'SET_SUCCESS_MESSAGE', payload: 'Appearance saved successfully' })
  }

  const openAddPeriod = () => {
    setEditingPeriod(null)
    setPeriodForm({ name: '', type: 'term', startDate: '', endDate: '' })
    sounds.click()
    setPeriodModal(true)
  }

  const openEditPeriod = (p) => {
    setEditingPeriod(p)
    setPeriodForm({ name: p.name, type: p.type, startDate: p.startDate || '', endDate: p.endDate || '' })
    sounds.click()
    setPeriodModal(true)
  }

  const handlePeriodSave = () => {
    if (!periodForm.name.trim()) {
      sounds.error()
      return
    }
    if (editingPeriod) {
      dispatch({ type: 'UPDATE_ACADEMIC_PERIOD', payload: { ...editingPeriod, ...periodForm } })
    } else {
      dispatch({ type: 'ADD_ACADEMIC_PERIOD', payload: periodForm })
    }
    sounds.add()
    setPeriodModal(false)
  }

  const handlePeriodDelete = (id) => {
    if (confirm('Delete this academic period?')) {
      dispatch({ type: 'DELETE_ACADEMIC_PERIOD', payload: id })
      sounds.delete()
    }
  }

  const handleSetActivePeriod = (id) => {
    dispatch({ type: 'SET_ACTIVE_PERIOD', payload: id || null })
    sounds.click()
  }

  const handleCopyToPeriod = (fromId, toId) => {
    if (confirm('Copy timetable entries from this period to the selected period?')) {
      dispatch({ type: 'COPY_TIMETABLE_TO_PERIOD', payload: { fromPeriodId: fromId, toPeriodId: toId } })
      sounds.success()
    }
  }

  const SESSION_START_TIMES = {
    morning: '07:00',
    afternoon: '13:00',
    full: '08:00',
  }

  const SESSION_LABELS = {
    morning: 'Morning',
    afternoon: 'Afternoon',
    full: 'Full Day',
  }

  const generateSectionPeriods = (num, session = 'full') => {
    const periods = []
    let currentTime = SESSION_START_TIMES[session] || '08:00'
    const periodDuration = 40
    const breakAfter = session === 'full' ? 4 : Math.min(4, Math.floor(num / 2))
    for (let i = 1; i <= num; i++) {
      const [h, m] = currentTime.split(':').map(Number)
      const endM = m + periodDuration
      const endH = h + Math.floor(endM / 60)
      const endTime = `${String(endH).padStart(2, '0')}:${String(endM % 60).padStart(2, '0')}`
      periods.push({ id: i, name: `Period ${i}`, start: currentTime, end: endTime })
      currentTime = endTime
      if (i === breakAfter && i < num) {
        const [bh, bm] = currentTime.split(':').map(Number)
        const breakEndM = bm + 15
        const breakEndH = bh + Math.floor(breakEndM / 60)
        const breakEnd = `${String(breakEndH).padStart(2, '0')}:${String(breakEndM % 60).padStart(2, '0')}`
        periods.push({ id: i + 100, name: 'Break', start: currentTime, end: breakEnd, isBreak: true })
        currentTime = breakEnd
      }
    }
    return periods
  }

  const openAddSection = () => {
    setEditingSection(null)
    setSectionForm({
      name: '',
      session: 'full',
      days: [...state.settings.days],
      periods: state.settings.periods.map(p => ({ ...p })),
    })
    setSectionNumPeriods(state.settings.periods.filter(p => !p.isBreak).length)
    sounds.click()
    setSectionModal(true)
  }

  const openEditSection = (section) => {
    setEditingSection(section)
    setSectionForm({
      name: section.name,
      session: section.session || 'full',
      days: [...(section.days || [])],
      periods: (section.periods || []).map(p => ({ ...p })),
    })
    setSectionNumPeriods((section.periods || []).filter(p => !p.isBreak).length)
    sounds.click()
    setSectionModal(true)
  }

  const handleSectionDayToggle = (day) => {
    sounds.click()
    setSectionForm(f => ({
      ...f,
      days: f.days.includes(day) ? f.days.filter(d => d !== day) : [...f.days, day],
    }))
  }

  const handleSectionPeriodUpdate = (id, field, value) => {
    setSectionForm(f => ({
      ...f,
      periods: f.periods.map(p => p.id === id ? { ...p, [field]: value } : p),
    }))
    sounds.click()
  }

  const handleSectionNumPeriodsChange = (num) => {
    setSectionNumPeriods(num)
    setSectionForm(f => ({ ...f, periods: generateSectionPeriods(num, f.session) }))
    sounds.click()
  }

  const handleSectionSessionChange = (session) => {
    setSectionForm(f => ({ ...f, session, periods: generateSectionPeriods(sectionNumPeriods, session) }))
    sounds.click()
  }

  const handleSectionSave = () => {
    if (!sectionForm.name.trim()) {
      sounds.error()
      return
    }
    const orderedDays = ALL_DAYS.filter(d => sectionForm.days.includes(d))
    const payload = { name: sectionForm.name, session: sectionForm.session || 'full', days: orderedDays, periods: sectionForm.periods }
    if (editingSection) {
      dispatch({ type: 'UPDATE_SECTION', payload: { ...editingSection, ...payload } })
    } else {
      dispatch({ type: 'ADD_SECTION', payload })
    }
    sounds.add()
    setSectionModal(false)
  }

  const handleSectionDelete = (id) => {
    if (confirm('Delete this section? Classes assigned to it will revert to the default schedule.')) {
      dispatch({ type: 'DELETE_SECTION', payload: id })
      sounds.delete()
    }
  }

  const handleExportData = () => {
    const data = JSON.stringify(state, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const d = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    const ts = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
    link.download = `shikola_backup_${ts}.json`
    link.click()
    URL.revokeObjectURL(url)
    sounds.export()
  }

  const handleImportData = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result)
        dispatch({ type: 'IMPORT_DATA', payload: data })
        sounds.success()
        alert('Data imported successfully!')
      } catch (err) {
        sounds.error()
        alert('Failed to import data: Invalid file')
      }
    }
    reader.readAsText(file)
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <PageHeader title="Settings" subtitle="Loading..." />
        <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <PageHeader title="Settings" subtitle="Configure school information, appearance, and timetable settings" />

      {/* Settings Tabs */}
      <div className="mb-6">
        <Tabs
          tabs={[
            { id: 'school', label: 'School' },
            { id: 'appearance', label: 'Appearance' },
            { id: 'advanced', label: 'Advanced' },
            { id: 'data', label: 'Data' },
            { id: 'legal', label: 'Legal' },
            { id: 'about', label: 'About' },
          ]}
          active={settingsTab}
          onChange={(id) => { setSettingsTab(id); setSubTab(DEFAULT_SUB_TAB[id] || (SUB_TABS[id] && SUB_TABS[id][0].id)); sounds.click() }}
        />
      </div>

      {/* Sub Tabs */}
      {SUB_TABS[settingsTab] && (
        <div className="mb-4">
          <Tabs
            tabs={SUB_TABS[settingsTab]}
            active={subTab}
            onChange={(id) => { setSubTab(id); sounds.click() }}
          />
        </div>
      )}

      {/* School Info Tab */}
      {settingsTab === 'school' && (
        <>
          {subTab === 'info' && (
          <Card className="p-6 mb-6">
            <h3 className="text-sm font-bold text-slate-700 mb-4">School Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="School Name" value={schoolForm.name || ''} onChange={e => setSchoolForm({ ...schoolForm, name: e.target.value })} className="col-span-2" />

              {/* Logo Upload */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">School Logo</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden bg-slate-50">
                    {schoolForm.logo ? (
                      <img src={schoolForm.logo} alt="School logo" className="w-full h-full object-contain" />
                    ) : (
                      <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label>
                      <input type="file" accept="image/png,image/jpeg,image/jpg,image/svg+xml" onChange={handleLogoUpload} className="hidden" />
                      <span className="inline-block px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 cursor-pointer">
                        Upload Logo
                      </span>
                    </label>
                    {schoolForm.logo && (
                      <button onClick={() => { setSchoolForm({ ...schoolForm, logo: null }); sounds.click() }} className="text-xs text-red-500 hover:text-red-600">
                        Remove Logo
                      </button>
                    )}
                    <p className="text-xs text-slate-400">PNG, JPG or SVG. Max 2MB.</p>
                  </div>
                </div>
              </div>

              <Input label="Motto" value={schoolForm.motto || ''} onChange={e => setSchoolForm({ ...schoolForm, motto: e.target.value })} className="col-span-2" />
              <Input label="Academic Year" value={schoolForm.academicYear || ''} onChange={e => setSchoolForm({ ...schoolForm, academicYear: e.target.value })} />
              <Select label="Term" value={schoolForm.term || 'Term 1'} onChange={e => setSchoolForm({ ...schoolForm, term: e.target.value })} options={
                <>
                  <option value="Term 1">Term 1</option>
                  <option value="Term 2">Term 2</option>
                  <option value="Term 3">Term 3</option>
                  <option value="Semester 1">Semester 1</option>
                  <option value="Semester 2">Semester 2</option>
                </>
              } />
              <Input label="Address" value={schoolForm.address || ''} onChange={e => setSchoolForm({ ...schoolForm, address: e.target.value })} className="col-span-2" />
              <Input label="Phone" value={schoolForm.phone || ''} onChange={e => setSchoolForm({ ...schoolForm, phone: e.target.value })} />
              <Input label="Email" value={schoolForm.email || ''} onChange={e => setSchoolForm({ ...schoolForm, email: e.target.value })} />
            </div>
            <div className="mt-4">
              <Button onClick={handleSchoolSave}>Save School Info</Button>
            </div>
          </Card>
          )}

          {subTab === 'days' && (
          <Card className="p-6 mb-6">
            <h3 className="text-sm font-bold text-slate-700 mb-4">School Days</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              {ALL_DAYS.map(day => (
                <button
                  key={day}
                  onClick={() => handleDayToggle(day)}
                  className={`px-3 py-2 rounded-lg text-sm border-2 transition-all ${
                    selectedDays.includes(day)
                      ? 'border-brand-600 bg-brand-50 text-brand-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
            <Button onClick={handleDaysSave}>Save Days</Button>
          </Card>
          )}

          {subTab === 'periods' && (
          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-700">Period Times</h3>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={handleAddBreak}>+ Break</Button>
                <Button size="sm" onClick={handleAddPeriod}>+ Period</Button>
              </div>
            </div>
            <div className="space-y-2">
              {periods.map(period => (
                <div key={period.id} className="flex items-center gap-3">
                  <Input
                    value={period.name}
                    onChange={e => handlePeriodUpdate(period.id, 'name', e.target.value)}
                    className="w-28"
                  />
                  {period.isBreak ? (
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">Break</span>
                  ) : (
                    <span className="text-xs text-brand-600 bg-brand-50 px-2 py-1 rounded">Teaching</span>
                  )}
                  <Input type="time" value={period.start} onChange={e => handlePeriodUpdate(period.id, 'start', e.target.value)} className="w-32" />
                  <span className="text-slate-400">to</span>
                  <Input type="time" value={period.end} onChange={e => handlePeriodUpdate(period.id, 'end', e.target.value)} className="w-32" />
                  <button
                    onClick={() => handleRemovePeriod(period.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                    title="Remove period"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
              {periods.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">No periods configured. Add one to get started.</p>
              )}
            </div>
            <div className="mt-4">
              <Button onClick={handlePeriodsSave}>Save Period Times</Button>
            </div>
          </Card>
          )}
        </>
      )}

      {settingsTab === 'school' && subTab === 'sections' && (
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-700">School Sections</h3>
            <Button size="sm" onClick={openAddSection}>+ Add Section</Button>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Create sections for different school units (e.g., Primary, Secondary) and sessions (Morning, Afternoon).
            Each section has its own days and period schedule. Assign classes to sections in the Classes page.
            Classes without a section use the default schedule.
          </p>

          {state.sections.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-slate-400">No sections created yet.</p>
              <p className="text-xs text-slate-400 mt-1">Add a section for each unit/session (e.g., Primary Morning, Secondary Afternoon).</p>
              <div className="mt-4">
                <Button size="sm" onClick={openAddSection}>+ Add Section</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {state.sections.map(section => {
                const classCount = state.classes.filter(c => c.sectionId === section.id).length
                const teachingPeriods = (section.periods || []).filter(p => !p.isBreak)
                return (
                  <div key={section.id} className="flex items-center justify-between p-4 rounded-lg border-2 border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center">
                        <span className="text-sm font-bold text-brand-700">
                          {section.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{section.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {section.session && section.session !== 'full' && (
                            <Badge color={section.session === 'morning' ? 'amber' : 'teal'}>{SESSION_LABELS[section.session] || section.session}</Badge>
                          )}
                          <Badge color="blue">{classCount} class(es)</Badge>
                          <span className="text-xs text-slate-500">{(section.days || []).length} days, {teachingPeriods.length} periods</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openEditSection(section)} className="text-slate-400 hover:text-brand-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => handleSectionDelete(section.id)} className="text-slate-400 hover:text-red-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      )}

      {settingsTab === 'school' && subTab === 'academic' && (
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-700">Academic Periods</h3>
            <Button size="sm" onClick={openAddPeriod}>+ Add Period</Button>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Create academic periods (week, term, quarter, semester, or full year) to organize and generate timetables for different time spans.
          </p>

          {state.academicPeriods.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-slate-400">No academic periods created yet.</p>
              <p className="text-xs text-slate-400 mt-1">Add one to start generating timetables for specific periods.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {state.academicPeriods.map(p => {
                const periodType = PERIOD_TYPES[p.type]
                return (
                  <div key={p.id} className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                    state.activePeriodId === p.id ? 'border-brand-600 bg-brand-50' : 'border-slate-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleSetActivePeriod(p.id)}
                        className={`w-5 h-5 rounded-full border-2 ${
                          state.activePeriodId === p.id ? 'border-brand-600 bg-brand-600' : 'border-slate-300'
                        }`}
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge color="blue">{periodType?.label || p.type}</Badge>
                          <span className="text-xs text-slate-500">{periodType?.description || ''}</span>
                          {p.startDate && <span className="text-xs text-slate-400">| {p.startDate} - {p.endDate || '...'}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openEditPeriod(p)} className="text-slate-400 hover:text-brand-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => handlePeriodDelete(p.id)} className="text-slate-400 hover:text-red-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Copy between periods */}
          {state.academicPeriods.length >= 2 && (
            <div className="mt-6 pt-4 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-600 mb-2">Copy Timetable Between Periods</h4>
              <CopyPeriodsControl periods={state.academicPeriods} onCopy={handleCopyToPeriod} />
            </div>
          )}
        </Card>
      )}

      {/* Appearance Tab */}
      {settingsTab === 'appearance' && subTab === 'colors' && (
        <Card className="p-6 mb-6">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Appearance & Customization</h3>

          {/* Color Presets */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Color Theme</label>
            <div className="flex flex-wrap gap-3">
              {COLOR_PRESETS.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => { setAppearance({ ...appearance, primaryColor: preset.primary, accentColor: preset.accent }); sounds.click() }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                    appearance.primaryColor === preset.primary ? 'border-slate-400 scale-105' : 'border-slate-200'
                  }`}
                >
                  <div className="flex gap-1">
                    <div className="w-5 h-5 rounded" style={{ backgroundColor: preset.primary }} />
                    <div className="w-5 h-5 rounded" style={{ backgroundColor: preset.accent }} />
                  </div>
                  <span className="text-xs font-medium text-slate-700">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Colors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Primary Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={appearance.primaryColor || '#2563eb'} onChange={e => setAppearance({ ...appearance, primaryColor: e.target.value })} className="w-10 h-10 rounded cursor-pointer" />
                <Input value={appearance.primaryColor || '#2563eb'} onChange={e => setAppearance({ ...appearance, primaryColor: e.target.value })} className="flex-1" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Accent Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={appearance.accentColor || '#3b82f6'} onChange={e => setAppearance({ ...appearance, accentColor: e.target.value })} className="w-10 h-10 rounded cursor-pointer" />
                <Input value={appearance.accentColor || '#3b82f6'} onChange={e => setAppearance({ ...appearance, accentColor: e.target.value })} className="flex-1" />
              </div>
            </div>
          </div>

          {/* Display Options */}
          <div className="space-y-3 mb-6">
            <h4 className="text-xs font-bold text-slate-600">Display Options</h4>
            <Toggle checked={appearance.showSchoolHeader !== false} onChange={v => setAppearance({ ...appearance, showSchoolHeader: v })} label="Show school header on exports" />
            <Toggle checked={appearance.showTeacherInCell !== false} onChange={v => setAppearance({ ...appearance, showTeacherInCell: v })} label="Show teacher name in timetable cells" />
            <Toggle checked={appearance.showRoomInCell !== false} onChange={v => setAppearance({ ...appearance, showRoomInCell: v })} label="Show room name in timetable cells" />
            <Toggle checked={appearance.soundEnabled !== false} onChange={v => setAppearance({ ...appearance, soundEnabled: v })} label="Enable sound effects" />
          </div>

          {/* Table Theme */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Table Theme</label>
            <div className="flex gap-3">
              {['striped', 'grid', 'plain'].map(theme => (
                <button
                  key={theme}
                  onClick={() => { setAppearance({ ...appearance, tableTheme: theme }); sounds.click() }}
                  className={`px-4 py-2 rounded-lg text-sm border-2 capitalize transition-all ${
                    (appearance.tableTheme || 'striped') === theme ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  {theme}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={handleAppearanceSave}>Save Appearance</Button>
        </Card>
      )}

      {/* Advanced Tab */}
      {settingsTab === 'advanced' && (
        <>
          {subTab === 'lunch' && (
          <Card className="p-6 mb-6">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Lunch Constraint</h3>
            <p className="text-xs text-slate-500 mb-4">Ensure lunch break is scheduled within a specific period range.</p>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">Enable lunch constraint</p>
                  <p className="text-xs text-slate-500">When enabled, generation will try to keep lunch within the specified range</p>
                </div>
                <Toggle
                  checked={state.lunchConstraint?.enabled || false}
                  onChange={(v) => { dispatch({ type: 'SET_LUNCH_CONSTRAINT', payload: { enabled: v } }); sounds.click() }}
                />
              </div>
              {state.lunchConstraint?.enabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Lunch after period</label>
                    <select
                      value={state.lunchConstraint.afterPeriodId || ''}
                      onChange={e => dispatch({ type: 'SET_LUNCH_CONSTRAINT', payload: { afterPeriodId: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                    >
                      <option value="">-- Select --</option>
                      {state.settings.periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Lunch before period</label>
                    <select
                      value={state.lunchConstraint.beforePeriodId || ''}
                      onChange={e => dispatch({ type: 'SET_LUNCH_CONSTRAINT', payload: { beforePeriodId: e.target.value } })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                    >
                      <option value="">-- Select --</option>
                      {state.settings.periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </Card>
          )}

          {subTab === 'cycle' && (
          <Card className="p-6 mb-6">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Multi-Week Cycle</h3>
            <p className="text-xs text-slate-500 mb-4">Set the number of weeks in the scheduling cycle (for rotating timetables).</p>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min="1"
                max="4"
                value={state.multiWeekCycle || 1}
                onChange={e => dispatch({ type: 'SET_MULTI_WEEK_CYCLE', payload: Math.max(1, Math.min(4, Number(e.target.value) || 1)) })}
                className="w-24 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <span className="text-sm text-slate-500">week(s) per cycle</span>
            </div>
          </Card>
          )}
        </>
      )}

      {/* Language - merged into Appearance */}
      {settingsTab === 'appearance' && subTab === 'language' && (
        <Card className="p-6 mb-6">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Language</h3>
          <p className="text-xs text-slate-500 mb-4">Interface language preference.</p>
          <div className="flex flex-wrap gap-3">
            {[
              { code: 'en', label: 'English' },
              { code: 'ch', label: 'Chokwe' },
              { code: 'bem', label: 'Bemba' },
              { code: 'ny', label: 'Nyanja' },
              { code: 'loz', label: 'Lozi' },
              { code: 'toi', label: 'Tonga' },
              { code: 'kqn', label: 'Kaonde' },
              { code: 'lue', label: 'Luvale' },
              { code: 'lun', label: 'Lunda' },
            ].map(lang => (
              <button
                key={lang.code}
                onClick={() => { dispatch({ type: 'SET_LANGUAGE', payload: lang.code }); sounds.click() }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                state.language === lang.code
                  ? 'bg-brand-100 text-brand-700 border border-brand-300'
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Buildings - merged into School */}
      {settingsTab === 'school' && subTab === 'buildings' && (
        <Card className="p-6 mb-6">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Buildings</h3>
          <p className="text-xs text-slate-500 mb-4">Manage campus buildings for room assignments.</p>
          <div className="space-y-2 mb-4">
            {state.buildings.map(b => (
              <div key={b.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-700">{b.name}</p>
                  {b.floors && <p className="text-xs text-slate-500">{b.floors} floor(s)</p>}
                </div>
                <button onClick={() => { dispatch({ type: 'DELETE_BUILDING', payload: b.id }); sounds.delete() }} className="text-slate-400 hover:text-red-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
            {state.buildings.length === 0 && <p className="text-sm text-slate-400">No buildings added yet.</p>}
          </div>
          <BuildingForm onAdd={(data) => { dispatch({ type: 'ADD_BUILDING', payload: data }); sounds.add() }} />
        </Card>
      )}

      {settingsTab === 'advanced' && subTab === 'blocks' && (
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-700">Education Blocks</h3>
              <p className="text-xs text-slate-500">Define blocks of consecutive periods for specific subjects (e.g., 3-period science lab).</p>
            </div>
          </div>
          {state.educationBlocks.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No education blocks defined yet.</p>
          ) : (
            <div className="space-y-2 mb-4">
              {state.educationBlocks.map(block => (
                <div key={block.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge color="slate">{block.length} periods</Badge>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{block.subjectId ? state.subjects.find(s => s.id === block.subjectId)?.name || 'Unknown' : 'Any subject'}</p>
                      <p className="text-xs text-slate-500">{block.classId ? state.classes.find(c => c.id === block.classId)?.name || 'Unknown' : 'All classes'} · {block.days?.join(', ') || 'Any day'}</p>
                    </div>
                  </div>
                  <button onClick={() => { dispatch({ type: 'DELETE_EDUCATION_BLOCK', payload: block.id }); sounds.delete() }} className="text-slate-400 hover:text-red-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          <EducationBlockForm onAdd={(data) => { dispatch({ type: 'ADD_EDUCATION_BLOCK', payload: data }); sounds.add() }} state={state} />
        </Card>
      )}

      {settingsTab === 'appearance' && subTab === 'fields' && (
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-700">Custom Fields on Cards</h3>
              <p className="text-xs text-slate-500">Add custom text that appears on timetable cells (e.g., room notes, teacher initials).</p>
            </div>
          </div>
          {state.customFields.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No custom fields defined yet.</p>
          ) : (
            <div className="space-y-2 mb-4">
              {state.customFields.map(field => (
                <div key={field.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge color="slate">{field.key}</Badge>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{field.label}</p>
                      <p className="text-xs text-slate-500">{field.subjectId ? `Subject: ${state.subjects.find(s => s.id === field.subjectId)?.name || 'Unknown'}` : 'All subjects'} · {field.classId ? `Class: ${state.classes.find(c => c.id === field.classId)?.name || 'Unknown'}` : 'All classes'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => {
                      const newLabel = prompt('Edit label:', field.label)
                      if (newLabel !== null) { dispatch({ type: 'UPDATE_CUSTOM_FIELD', payload: { ...field, label: newLabel } }); sounds.click() }
                    }} className="text-slate-400 hover:text-brand-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => { dispatch({ type: 'DELETE_CUSTOM_FIELD', payload: field.id }); sounds.delete() }} className="text-slate-400 hover:text-red-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <CustomFieldForm onAdd={(data) => { dispatch({ type: 'ADD_CUSTOM_FIELD', payload: data }); sounds.add() }} state={state} />
        </Card>
      )}

      {/* Data Tab */}
      {settingsTab === 'data' && (
        <>
          {subTab === 'backup' && (
          <Card className="p-6 mb-6">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Data Management</h3>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={handleExportData}>Export Backup (JSON)</Button>
              <label>
                <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
                <span className="inline-block px-4 py-2 text-sm font-medium rounded-lg bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 cursor-pointer">
                  Import Backup
                </span>
              </label>
              <Button variant="danger" onClick={() => { sounds.click(); setResetModal(true) }}>Reset All Data</Button>
            </div>
          </Card>
          )}

        </>
      )}

      {settingsTab === 'data' && subTab === 'restore' && (
        <BackupRestore embedded />
      )}

      {/* About Tab */}
      {settingsTab === 'legal' && (
        <LegalDocuments documentId={subTab} />
      )}

      {settingsTab === 'about' && (
        <>
          {subTab === 'about' && (
            <>
          <Card className="p-8 mb-6">
            <div className="flex items-center gap-6">
              {state.school?.logo ? (
                <img src={state.school.logo} alt="School logo" className="w-20 h-20 rounded-xl object-contain bg-white border border-slate-200" />
              ) : (
                <img src="./logo.png" alt="Shikola logo" className="w-20 h-20 rounded-xl object-contain" />
              )}
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Shikola Timetable Creator</h2>
                <p className="text-sm text-slate-500 mt-1">by Sepio Corp</p>
                <div className="flex items-center gap-2 mt-3">
                  <Badge color="blue">Version {APP_VERSION} "{APP_CODENAME}"</Badge>
                  <Badge color="green">Desktop App</Badge>
                  <Badge color="slate">Offline</Badge>
                </div>
              </div>
            </div>
            <p className="text-sm text-slate-600 mt-6 leading-relaxed">
              Shikola Timetable Creator is a powerful, offline-first desktop application designed to help schools
              create, manage, and export professional timetables with ease. Built with simplicity and efficiency in mind,
              it provides automatic conflict detection, smart timetable generation, and flexible export options — all
              without requiring an internet connection.
            </p>
          </Card>

          <h3 className="text-sm font-bold text-slate-700 mb-3">Key Features</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {ABOUT_FEATURES.map(feature => (
              <Card key={feature.title} className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                    {feature.aiLogo ? (
                      <img src="./ai.png" alt="AI" className="w-6 h-6 object-contain" />
                    ) : (
                      <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d={feature.icon} />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{feature.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{feature.desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
            </>
          )}

          {subTab === 'customization' && (
            <>
              <Card className="p-6 mb-6">
                <h3 className="text-sm font-bold text-slate-700 mb-4">Customization Capabilities</h3>
                <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                  Shikola Timetable Creator is highly customizable. Here's everything you can tailor to your school's needs:
                </p>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">Appearance &amp; Visual</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg">
                        <span className="text-brand-600 mt-0.5">&#10003;</span>
                        <div><p className="text-sm font-medium text-slate-700">Color Themes</p><p className="text-xs text-slate-500">8 presets + custom primary/accent color pickers</p></div>
                      </div>
                      <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg">
                        <span className="text-brand-600 mt-0.5">&#10003;</span>
                        <div><p className="text-sm font-medium text-slate-700">Table Themes</p><p className="text-xs text-slate-500">Striped, grid, or plain styles</p></div>
                      </div>
                      <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg">
                        <span className="text-brand-600 mt-0.5">&#10003;</span>
                        <div><p className="text-sm font-medium text-slate-700">Display Toggles</p><p className="text-xs text-slate-500">Show/hide school header, teacher, room in cells</p></div>
                      </div>
                      <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg">
                        <span className="text-brand-600 mt-0.5">&#10003;</span>
                        <div><p className="text-sm font-medium text-slate-700">Sound Effects</p><p className="text-xs text-slate-500">Enable or disable interaction sounds</p></div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">School Branding</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg">
                        <span className="text-brand-600 mt-0.5">&#10003;</span>
                        <div><p className="text-sm font-medium text-slate-700">School Profile</p><p className="text-xs text-slate-500">Name, motto, academic year, term, address, phone, email</p></div>
                      </div>
                      <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg">
                        <span className="text-brand-600 mt-0.5">&#10003;</span>
                        <div><p className="text-sm font-medium text-slate-700">Logo Upload</p><p className="text-xs text-slate-500">PNG, JPG or SVG up to 2MB — shown on exports</p></div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">Schedule Structure</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg">
                        <span className="text-brand-600 mt-0.5">&#10003;</span>
                        <div><p className="text-sm font-medium text-slate-700">School Days</p><p className="text-xs text-slate-500">Toggle any of 7 days on/off</p></div>
                      </div>
                      <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg">
                        <span className="text-brand-600 mt-0.5">&#10003;</span>
                        <div><p className="text-sm font-medium text-slate-700">Period Times</p><p className="text-xs text-slate-500">Full control over names, start/end, breaks</p></div>
                      </div>
                      <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg">
                        <span className="text-brand-600 mt-0.5">&#10003;</span>
                        <div><p className="text-sm font-medium text-slate-700">Sections</p><p className="text-xs text-slate-500">Custom units with own days, periods &amp; sessions</p></div>
                      </div>
                      <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg">
                        <span className="text-brand-600 mt-0.5">&#10003;</span>
                        <div><p className="text-sm font-medium text-slate-700">Academic Periods</p><p className="text-xs text-slate-500">Week, term, quarter, semester, or full year</p></div>
                      </div>
                      <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg">
                        <span className="text-brand-600 mt-0.5">&#10003;</span>
                        <div><p className="text-sm font-medium text-slate-700">Multi-Week Cycle</p><p className="text-xs text-slate-500">1–4 week rotating cycle for scheduling</p></div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">Advanced Scheduling</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg">
                        <span className="text-brand-600 mt-0.5">&#10003;</span>
                        <div><p className="text-sm font-medium text-slate-700">Lunch Constraint</p><p className="text-xs text-slate-500">Enforce lunch within a period range</p></div>
                      </div>
                      <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg">
                        <span className="text-brand-600 mt-0.5">&#10003;</span>
                        <div><p className="text-sm font-medium text-slate-700">Education Blocks</p><p className="text-xs text-slate-500">Multi-period blocks for specific subjects/classes</p></div>
                      </div>
                      <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg">
                        <span className="text-brand-600 mt-0.5">&#10003;</span>
                        <div><p className="text-sm font-medium text-slate-700">Buildings</p><p className="text-xs text-slate-500">Campus buildings with floor counts</p></div>
                      </div>
                      <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg">
                        <span className="text-brand-600 mt-0.5">&#10003;</span>
                        <div><p className="text-sm font-medium text-slate-700">Custom Fields on Cards</p><p className="text-xs text-slate-500">Custom text on timetable cells, scoped by subject/class</p></div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">Language &amp; Data</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg">
                        <span className="text-brand-600 mt-0.5">&#10003;</span>
                        <div><p className="text-sm font-medium text-slate-700">9 Languages</p><p className="text-xs text-slate-500">English, Chokwe, Bemba, Nyanja, Lozi, Tonga, Kaonde, Luvale, Lunda</p></div>
                      </div>
                      <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg">
                        <span className="text-brand-600 mt-0.5">&#10003;</span>
                        <div><p className="text-sm font-medium text-slate-700">Backup &amp; Restore</p><p className="text-xs text-slate-500">JSON export/import and reset</p></div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </>
          )}

          {subTab === 'license' && (
            <>
          <Card className="p-6 mb-6">
            <h3 className="text-sm font-bold text-slate-700 mb-4">License Key</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Activate your license key to unlock unlimited entities and storage. Each license key is tied to a specific school —
              it can only be used by the school it was issued for. Your school name in
              Settings &rarr; School &rarr; Info should be similar to the name on your license (minor variations like
              "Kabanana Primary" vs "Kabanana Primary School" are accepted).
            </p>

            {state.license?.valid ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
                  <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-green-800">License Active</p>
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-green-700">
                        <span className="font-medium">School:</span> {state.license.schoolName || 'N/A'}
                      </p>
                      <p className="text-xs text-green-700">
                        <span className="font-medium">Plan:</span> {state.license.plan || 'N/A'}
                      </p>
                      {state.license.expiresAt && (
                        <p className="text-xs text-green-700">
                          <span className="font-medium">Expires:</span> {new Date(state.license.expiresAt).toLocaleDateString()}
                        </p>
                      )}
                      <p className="text-xs text-green-700">
                        <span className="font-medium">Activated on:</span> {state.license.validatedAt ? new Date(state.license.validatedAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    {state.school?.name && state.license.schoolName && state.school.name.trim().toLowerCase() !== state.license.schoolName.trim().toLowerCase() && (
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs text-amber-700 font-semibold">School Name Mismatch</p>
                        <p className="text-xs text-amber-600 mt-1">
                          Your configured school name "{state.school.name}" does not appear to match the license school "{state.license.schoolName}".
                          Please update your school name in Settings &rarr; School &rarr; Info to be similar.
                        </p>
                      </div>
                    )}
                    <button
                      onClick={async () => { await clearLicense(); setLicenseSuccess(null); setLicenseError(null) }}
                      className="inline-block mt-3 text-xs px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium"
                    >
                      Remove License
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`flex items-start gap-3 p-4 rounded-lg border ${licenseError ? 'bg-red-50 border-red-200' : 'bg-brand-50 border-brand-200'}`}>
                  <svg className="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-700">Activate License</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Enter your license key below. The key will be verified against the school name configured in Settings.
                      {!state.school?.name && (
                        <span className="block mt-1 text-amber-600 font-medium">
                          No school name is configured yet. The license key will auto-fill your school name upon activation.
                        </span>
                      )}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        value={licenseKeyInput}
                        onChange={(e) => { setLicenseKeyInput(e.target.value); setLicenseError(null); setLicenseSuccess(null) }}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !licenseValidating && licenseKeyInput.trim()) {
                          setLicenseValidating(true); setLicenseError(null); setLicenseSuccess(null)
                          validateLicense(licenseKeyInput.trim()).then((result) => {
                            if (result.valid) { setLicenseSuccess('License activated successfully!'); setLicenseKeyInput('') }
                            else { setLicenseError(result.error || 'Invalid license key.') }
                          }).catch(() => setLicenseError('Failed to validate license key.'))
                            .finally(() => setLicenseValidating(false))
                        } }}
                        placeholder="SK-XXXXXX-XXXXXX-XXXXXX"
                        disabled={licenseValidating}
                        className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                      />
                      <button
                        onClick={async () => {
                          if (!licenseKeyInput.trim()) { setLicenseError('Please enter a license key.'); return }
                          setLicenseValidating(true)
                          setLicenseError(null)
                          setLicenseSuccess(null)
                          try {
                            const result = await validateLicense(licenseKeyInput.trim())
                            if (result.valid) {
                              setLicenseSuccess('License activated successfully!')
                              setLicenseKeyInput('')
                            } else {
                              setLicenseError(result.error || 'Invalid license key.')
                            }
                          } catch {
                            setLicenseError('Failed to validate license key.')
                          } finally {
                            setLicenseValidating(false)
                          }
                        }}
                        disabled={licenseValidating || !licenseKeyInput.trim()}
                        className="text-xs px-3 py-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {licenseValidating ? 'Validating...' : 'Activate'}
                      </button>
                    </div>
                    {licenseError && <p className="text-xs text-red-600 mt-1">{licenseError}</p>}
                    {licenseSuccess && <p className="text-xs text-green-600 mt-1">{licenseSuccess}</p>}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-xs font-semibold text-slate-600 mb-2">How License Verification Works</p>
                  <ul className="text-xs text-slate-500 space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span className="text-brand-600 mt-0.5">&#10003;</span>
                      <span>Each license key is uniquely tied to a specific school name.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-600 mt-0.5">&#10003;</span>
                      <span>If your school name is already set, it must be similar to the license's school name for activation to succeed.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-600 mt-0.5">&#10003;</span>
                      <span>If no school name is configured, the license will auto-fill it for you.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-600 mt-0.5">&#10003;</span>
                      <span>This prevents School A from using a license issued for School B.</span>
                    </li>
                  </ul>
                </div>

                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <svg className="w-5 h-5 text-slate-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-700">Don't have a license?</p>
                    <p className="text-xs text-slate-500 mt-1">Contact Sepio Corp to obtain a license key for your school.</p>
                    <a href="mailto:sales@shikola.org" className="inline-block mt-2 text-xs px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium">Email Sales</a>
                  </div>
                </div>
              </div>
            )}
          </Card>
            </>
          )}

          {subTab === 'limits' && (
            <>
          <Card className="p-6 mb-6">
            <h3 className="text-sm font-bold text-slate-700 mb-3">Free Tier Limits</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Total Entities:</span>
                <span className={`font-medium ${entityCount > entityLimit ? 'text-red-600' : entityCount > entityLimit * 0.8 ? 'text-amber-600' : 'text-slate-800'}`}>
                  {entityCount} / {entityLimit}
                  <span className="text-xs text-slate-400 ml-1">(teachers + classes + subjects + rooms)</span>
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${entityCount > entityLimit ? 'bg-red-500' : entityCount > entityLimit * 0.8 ? 'bg-amber-500' : 'bg-brand-500'}`}
                  style={{ width: `${Math.min(100, (entityCount / entityLimit) * 100)}%` }}
                />
              </div>
              {entityCount > entityLimit * 0.8 && entityCount <= entityLimit && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-700 font-semibold mb-1">Approaching Entity Limit</p>
                  <p className="text-xs text-amber-600">
                    You are nearing the free tier limit of {entityLimit} entities. Consider downloading the Shikola Management System for unlimited access.
                  </p>
                </div>
              )}
              {entityCount > entityLimit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs text-red-700 font-semibold mb-1">Entity Limit Exceeded</p>
                  <p className="text-xs text-red-600 mb-2">
                    You have exceeded the free tier limit of {entityLimit} entities. The app will be locked. Please download the Shikola Management System or contact sales.
                  </p>
                  <div className="flex gap-2">
                    <a href="https://shikola.org" target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium">Download SMS</a>
                    <a href="mailto:sales@shikola.org" className="text-xs px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium">Contact Sales</a>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-100">
                <span className="text-slate-600">Storage Used:</span>
                <span className="font-medium text-slate-800">
                  {(() => {
                    try {
                      const data = JSON.stringify(state)
                      const used = new Blob([data]).size
                      const usedMB = (used / (1024 * 1024)).toFixed(2)
                      return `${usedMB} MB`
                    } catch (e) {
                      return 'Unknown'
                    }
                  })()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Storage Type:</span>
                <span className="font-medium text-slate-800">IndexedDB</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Estimated Limit:</span>
                <span className="font-medium text-slate-800">50 MB</span>
              </div>
              {(() => {
                try {
                  const data = JSON.stringify(state)
                  const used = new Blob([data]).size
                  const usedMB = used / (1024 * 1024)
                  if (usedMB > 50) {
                    return (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-xs text-red-700 font-semibold mb-1">Storage Limit Exceeded</p>
                        <p className="text-xs text-red-600 mb-2">You have exceeded the 50 MB storage limit.</p>
                        <Button size="sm" onClick={() => setStorageLimitModal(true)}>View Options</Button>
                      </div>
                    )
                  }
                  return null
                } catch (e) {
                  return null
                }
              })()}
              {state.storageWarning && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-700">{state.storageWarning}</p>
                </div>
              )}
              <p className="text-xs text-slate-500">
                Your data is stored in IndexedDB with a 50 MB limit. If you need more storage, please contact us for assistance.
              </p>
            </div>
          </Card>

          <Card className="p-6 mb-6">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Upgrading &amp; Solutions</h3>
            <p className="text-xs text-slate-500 mb-4">
              The free tier has limits on entities and storage. To remove these restrictions, choose one of the options below:
            </p>
            <div className="space-y-3">
              {/* License Key */}
              <div className={`flex items-start gap-3 p-4 rounded-lg border ${state.license?.valid ? 'bg-green-50 border-green-200' : 'bg-brand-50 border-brand-200'}`}>
                <svg className="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-700">License Key</p>
                  {state.license?.valid ? (
                    <>
                      <p className="text-xs text-green-700 mt-1">
                        Your license is active{state.license.plan ? ` (${state.license.plan})` : ''}{state.license.schoolName ? ` — ${state.license.schoolName}` : ''}.
                      </p>
                      {state.license.expiresAt && (
                        <p className="text-xs text-slate-500 mt-0.5">Expires: {new Date(state.license.expiresAt).toLocaleDateString()}</p>
                      )}
                      <button
                        onClick={async () => { await clearLicense(); setLicenseSuccess(null); setLicenseError(null) }}
                        className="inline-block mt-2 text-xs px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium"
                      >
                        Remove License
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-slate-500 mt-1">If you have a subscription, enter your license key to unlock unlimited access.</p>
                      <div className="flex gap-2 mt-2">
                        <input
                          type="text"
                          value={licenseKeyInput}
                          onChange={(e) => { setLicenseKeyInput(e.target.value); setLicenseError(null); setLicenseSuccess(null) }}
                          onKeyDown={(e) => { if (e.key === 'Enter' && !licenseValidating && licenseKeyInput.trim()) {
                            setLicenseValidating(true); setLicenseError(null); setLicenseSuccess(null)
                            validateLicense(licenseKeyInput.trim()).then((result) => {
                              if (result.valid) { setLicenseSuccess('License activated successfully!'); setLicenseKeyInput('') }
                              else { setLicenseError(result.error || 'Invalid license key.') }
                            }).catch(() => setLicenseError('Failed to validate license key.'))
                              .finally(() => setLicenseValidating(false))
                          } }}
                          placeholder="XXXX-XXXX-XXXX-XXXX"
                          disabled={licenseValidating}
                          className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                        />
                        <button
                          onClick={async () => {
                            if (!licenseKeyInput.trim()) { setLicenseError('Please enter a license key.'); return }
                            setLicenseValidating(true)
                            setLicenseError(null)
                            setLicenseSuccess(null)
                            try {
                              const result = await validateLicense(licenseKeyInput.trim())
                              if (result.valid) {
                                setLicenseSuccess('License activated successfully!')
                                setLicenseKeyInput('')
                              } else {
                                setLicenseError(result.error || 'Invalid license key.')
                              }
                            } catch {
                              setLicenseError('Failed to validate license key.')
                            } finally {
                              setLicenseValidating(false)
                            }
                          }}
                          disabled={licenseValidating || !licenseKeyInput.trim()}
                          className="text-xs px-3 py-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {licenseValidating ? 'Validating...' : 'Activate'}
                        </button>
                      </div>
                      {licenseError && <p className="text-xs text-red-600 mt-1">{licenseError}</p>}
                      {licenseSuccess && <p className="text-xs text-green-600 mt-1">{licenseSuccess}</p>}
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-brand-50 rounded-lg border border-brand-200">
                <svg className="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-700">Download Shikola Management System (SMS)</p>
                  <p className="text-xs text-slate-500 mt-1">The full desktop application with unlimited entities, unlimited storage, and advanced management features.</p>
                  <a href="https://shikola.org" target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-xs px-3 py-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium">Download SMS</a>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <svg className="w-5 h-5 text-slate-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-700">Contact Sales</p>
                  <p className="text-xs text-slate-500 mt-1">Reach out to our team for licensing, bulk deployments, or custom solutions for your institution.</p>
                  <a href="mailto:sales@shikola.org" className="inline-block mt-2 text-xs px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium">Email Sales</a>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <svg className="w-5 h-5 text-slate-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-700">Contact Support</p>
                  <p className="text-xs text-slate-500 mt-1">Experiencing storage issues or need technical assistance? Our support team can help.</p>
                  <a href="mailto:support@shikola.org" className="inline-block mt-2 text-xs px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium">Email Support</a>
                </div>
              </div>
            </div>
          </Card>
            </>
          )}

          {subTab === 'privacy' && (
            <>
          <Card className="p-6 mb-6">
            <h3 className="text-sm font-bold text-slate-700 mb-3">Data Privacy</h3>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-slate-600">
                <p className="font-semibold text-slate-700 mb-1">Local Storage & Optional Telemetry</p>
                <p className="text-xs">
                  All your data — school information, teachers, classes, subjects, rooms, and timetables — is stored
                  locally on your device. With your consent, the app can also send registration info, anonymous
                  analytics, and crash reports to Sepio Corp. You can control these options in
                  Settings &rarr; Privacy & Telemetry.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 mb-6">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Privacy & Telemetry Settings</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Control what data Shikola Timetable Creator shares with Sepio Corp. These options are enabled by
              default to help us improve the application. You can disable any option at any time. Changes take
              effect immediately.
            </p>

            {/* Registration */}
            <div className={`rounded-lg border-2 p-4 mb-4 transition-all ${state.telemetry?.registered ? 'border-brand-600 bg-brand-50' : 'border-slate-200'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">School Registration</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Register your school with Sepio Corp. Sends school name, phone, email, address, and IP address.
                      This helps us know which schools use our application and provide better support.
                    </p>
                    {state.telemetry?.registered && (
                      <Badge color="green">Registered</Badge>
                    )}
                  </div>
                </div>
                <Toggle
                  checked={state.telemetry?.registered || false}
                  onChange={(v) => {
                    dispatch({ type: 'SET_TELEMETRY', payload: { registered: v, registrationConsent: v } })
                    if (v && state.school) {
                      sendRegistration(state.school).catch(() => {})
                    }
                    sounds.click()
                  }}
                />
              </div>
            </div>

            {/* Analytics */}
            <div className={`rounded-lg border-2 p-4 mb-4 transition-all ${state.telemetry?.analyticsEnabled ? 'border-brand-600 bg-brand-50' : 'border-slate-200'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Anonymous Usage Analytics</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Send anonymous event data (e.g., "timetable generated", "PDF exported", "page viewed")
                      to help us understand which features are most used. No personal data or school information is included.
                    </p>
                  </div>
                </div>
                <Toggle
                  checked={state.telemetry?.analyticsEnabled || false}
                  onChange={(v) => {
                    dispatch({ type: 'SET_TELEMETRY', payload: { analyticsEnabled: v } })
                    if (v) {
                      trackEvent('analytics_enabled', {})
                    }
                    sounds.click()
                  }}
                />
              </div>
            </div>

            {/* Crash Reporting */}
            <div className={`rounded-lg border-2 p-4 mb-4 transition-all ${state.telemetry?.crashReportingEnabled ? 'border-brand-600 bg-brand-50' : 'border-slate-200'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Crash Reporting</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Automatically send error reports when the application crashes. Reports include error type,
                      message, stack trace, system info (OS, app version), and IP address.
                    </p>
                  </div>
                </div>
                <Toggle
                  checked={state.telemetry?.crashReportingEnabled || false}
                  onChange={(v) => {
                    dispatch({ type: 'SET_TELEMETRY', payload: { crashReportingEnabled: v } })
                    sounds.click()
                  }}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 mb-6">
            <h3 className="text-sm font-bold text-slate-700 mb-3">Data We Collect (When Enabled)</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <svg className="w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-xs font-semibold text-slate-700">Registration Data</p>
                  <p className="text-xs text-slate-500">School name, phone, email, address, academic year, IP address</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-xs font-semibold text-slate-700">Analytics Data</p>
                  <p className="text-xs text-slate-500">Anonymous event names (e.g., "timetable_generated"), session ID, app version, OS info</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-xs font-semibold text-slate-700">Crash Report Data</p>
                  <p className="text-xs text-slate-500">Error type, message, stack trace, file/line info, system info, IP address</p>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-400">
                Data is sent securely to Sepio Corp and used only for product improvement and support.
                Your data is never sold or shared with third parties.
              </p>
            </div>
          </Card>
            </>
          )}

          {subTab === 'updates' && (
            <>
              <Card className="p-6 mb-6">
                <h3 className="text-sm font-bold text-slate-700 mb-4">Automatic Updates</h3>
                <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                  Shikola can automatically check for, download, and install updates. When a new version is
                  available, it is downloaded in the background. You can choose to install it immediately, on
                  quit, or let the app restart automatically.
                </p>

                <div className="space-y-4">
                  <div className={`rounded-lg border-2 p-4 transition-all ${state.autoUpdate?.enabled !== false ? 'border-brand-600 bg-brand-50' : 'border-slate-200'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">Download updates automatically</p>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            Check for new releases periodically and download installers in the background.
                            Disabling this means you'll only see updates when you manually check.
                          </p>
                        </div>
                      </div>
                      <Toggle
                        checked={state.autoUpdate?.enabled !== false}
                        onChange={(v) => {
                          dispatch({ type: 'SET_AUTO_UPDATE', payload: { enabled: v } })
                          sounds.click()
                        }}
                      />
                    </div>
                  </div>

                  <div className={`rounded-lg border-2 p-4 transition-all ${state.autoUpdate?.installOnQuit !== false ? 'border-brand-600 bg-brand-50' : 'border-slate-200'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 01-2 2v4a2 2 0 012 2h12a2 2 0 012-2v-4a2 2 0 01-2-2m-2-4h.01M17 16h.01" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">Install in the background when I quit</p>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            Downloaded updates are installed automatically the next time you close the app,
                            so you are never interrupted while working.
                          </p>
                        </div>
                      </div>
                      <Toggle
                        checked={state.autoUpdate?.installOnQuit !== false}
                        onChange={(v) => {
                          dispatch({ type: 'SET_AUTO_UPDATE', payload: { installOnQuit: v } })
                          sounds.click()
                        }}
                      />
                    </div>
                  </div>

                  <div className={`rounded-lg border-2 p-4 transition-all ${state.autoUpdate?.autoInstall ? 'border-brand-600 bg-brand-50' : 'border-slate-200'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">Restart and install automatically</p>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            After an update is downloaded, restart the app and install it without asking.
                            You'll see a 60-second countdown before the restart so you can postpone it.
                          </p>
                        </div>
                      </div>
                      <Toggle
                        checked={state.autoUpdate?.autoInstall || false}
                        onChange={(v) => {
                          dispatch({ type: 'SET_AUTO_UPDATE', payload: { autoInstall: v } })
                          sounds.click()
                        }}
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <p className="text-xs font-medium text-slate-700 mb-1">Current Version</p>
                    <p className="text-sm text-slate-600">Shikola Timetable Creator v{APP_VERSION} "{APP_CODENAME}"</p>
                  </div>
                </div>
              </Card>
            </>
          )}

          {subTab === 'changelog' && (
            <>
          <Card className="p-6 mb-6">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Changelog</h3>
            <ChangelogList />
          </Card>

          <div className="text-center py-6">
            <p className="text-xs text-slate-400">&copy; {new Date().getFullYear()} Shikola Timetable Creator powered by Sepio Corp. All rights reserved.</p>
            <p className="text-xs text-slate-300 mt-1">Made with care for educators worldwide.</p>
          </div>
            </>
          )}
        </>
      )}

      {/* Reset Modal */}
      <Modal open={resetModal} onClose={() => setResetModal(false)} title="Reset All Data">
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">
              This will permanently delete all school data, teachers, classes, subjects, rooms, and timetables.
              This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setResetModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleReset}>Yes, Reset Everything</Button>
          </div>
        </div>
      </Modal>

      {/* Academic Period Modal */}
      <Modal open={periodModal} onClose={() => setPeriodModal(false)} title={editingPeriod ? 'Edit Academic Period' : 'Add Academic Period'}>
        <div className="space-y-4">
          <Input label="Period Name *" value={periodForm.name} onChange={e => setPeriodForm({ ...periodForm, name: e.target.value })} placeholder="Enter period name" />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Period Type</label>
            <select
              value={periodForm.type}
              onChange={e => { setPeriodForm({ ...periodForm, type: e.target.value }); sounds.click() }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              {Object.entries(PERIOD_TYPES).map(([key, val]) => (
                <option key={key} value={key}>{val.label} - {val.description}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Start Date" type="date" value={periodForm.startDate} onChange={e => setPeriodForm({ ...periodForm, startDate: e.target.value })} />
            <Input label="End Date" type="date" value={periodForm.endDate} onChange={e => setPeriodForm({ ...periodForm, endDate: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setPeriodModal(false)}>Cancel</Button>
            <Button onClick={handlePeriodSave}>{editingPeriod ? 'Update' : 'Add'}</Button>
          </div>
        </div>
      </Modal>

      {/* Section Modal */}
      <Modal open={sectionModal} onClose={() => setSectionModal(false)} title={editingSection ? 'Edit Section' : 'Add Section'}>
        <div className="space-y-4">
          <Input label="Section Name *" value={sectionForm.name} onChange={e => setSectionForm({ ...sectionForm, name: e.target.value })} placeholder="e.g., Primary, Secondary" />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Session Type</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(SESSION_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => handleSectionSessionChange(key)}
                  className={`px-3 py-2 rounded-lg text-sm border-2 transition-all ${
                    sectionForm.session === key
                      ? 'border-brand-600 bg-brand-50 text-brand-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {sectionForm.session === 'morning' && 'Periods start at 07:00 by default.'}
              {sectionForm.session === 'afternoon' && 'Periods start at 13:00 by default.'}
              {sectionForm.session === 'full' && 'Periods start at 08:00 by default.'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Section Days</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {ALL_DAYS.map(day => (
                <button
                  key={day}
                  onClick={() => handleSectionDayToggle(day)}
                  className={`px-3 py-2 rounded-lg text-sm border-2 transition-all ${
                    sectionForm.days.includes(day)
                      ? 'border-brand-600 bg-brand-50 text-brand-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-brand-50 rounded-lg p-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Number of Periods: <span className="text-brand-700 font-bold">{sectionNumPeriods}</span>
            </label>
            <input
              type="range"
              min="4"
              max="12"
              value={sectionNumPeriods}
              onChange={e => handleSectionNumPeriodsChange(Number(e.target.value))}
              className="w-full accent-brand-600"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>4</span><span>8</span><span>12</span>
            </div>
          </div>

          {sectionForm.periods.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {sectionForm.periods.map(period => (
                <div key={period.id} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-700 w-24">{period.name}</span>
                  {period.isBreak ? (
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">Break</span>
                  ) : (
                    <span className="text-xs text-brand-600 bg-brand-50 px-2 py-1 rounded">Teaching</span>
                  )}
                  <Input type="time" value={period.start} onChange={e => handleSectionPeriodUpdate(period.id, 'start', e.target.value)} className="w-32" />
                  <span className="text-slate-400">to</span>
                  <Input type="time" value={period.end} onChange={e => handleSectionPeriodUpdate(period.id, 'end', e.target.value)} className="w-32" />
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setSectionModal(false)}>Cancel</Button>
            <Button onClick={handleSectionSave}>{editingSection ? 'Update' : 'Add'}</Button>
          </div>
        </div>
      </Modal>

      {/* Storage Limit Modal */}
      <Modal isOpen={storageLimitModal} onClose={() => setStorageLimitModal(false)}>
        <div className="p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-2">Storage Limit Exceeded</h3>
          <p className="text-sm text-slate-600 mb-4">
            You have exceeded the 50 MB storage limit. To continue using Shikola Timetable, please choose one of the following options:
          </p>
          <div className="space-y-3">
            <a
              href="https://shikola.org"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center px-4 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium"
            >
              Download Shikola Management System
            </a>
            <button
              onClick={() => window.location.href = 'mailto:support@shikola.org?subject=Storage Limit Exceeded - Shikola Timetable'}
              className="block w-full px-4 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
            >
              Contact Us via Email
            </button>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200">
            <Button variant="secondary" className="w-full" onClick={() => setStorageLimitModal(false)}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function CopyPeriodsControl({ periods, onCopy }) {
  const [fromId, setFromId] = useState('')
  const [toId, setToId] = useState('')

  return (
    <div className="flex items-end gap-3">
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">From</label>
        <select value={fromId} onChange={e => { setFromId(e.target.value); sounds.click() }} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
          <option value="">Default (no period)</option>
          {periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <svg className="w-4 h-4 text-slate-400 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
      </svg>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">To</label>
        <select value={toId} onChange={e => { setToId(e.target.value); sounds.click() }} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
          <option value="">Select target...</option>
          {periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <Button size="sm" variant="secondary" disabled={!toId} onClick={() => onCopy(fromId || null, toId)}>Copy</Button>
    </div>
  )
}
