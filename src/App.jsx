import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useApp } from './store/AppContext.jsx'
import { sounds, setSoundEnabled } from './utils/sounds.js'
import { applyColorScale } from './utils/colors.js'
import { sendLaunchEvent, setupGlobalErrorHandler, trackEvent } from './utils/telemetry.js'
import { Spinner, ProgressBar, Modal } from './components/UI.jsx'
import SetupWizard from './pages/SetupWizard.jsx'
import About from './pages/About.jsx'
import Sidebar from './components/Sidebar.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ManageTeachers from './pages/ManageTeachers.jsx'
import ManageClasses from './pages/ManageClasses.jsx'
import ManageSubjects from './pages/ManageSubjects.jsx'
import TimetableEditor from './pages/TimetableEditor.jsx'
import SmartGenerate from './pages/SmartGenerate.jsx'
import ViewTimetables from './pages/ViewTimetables.jsx'
import Settings from './pages/Settings.jsx'
import Documentation from './pages/Documentation.jsx'
import Departments from './pages/Departments.jsx'
import TeacherConstraints from './pages/TeacherConstraints.jsx'
import CardRelationships from './pages/CardRelationships.jsx'
import PrintPreview from './pages/PrintPreview.jsx'
import Statistics from './pages/Statistics.jsx'
import TimetableVerification from './pages/TimetableVerification.jsx'
import Substitutions from './pages/Substitutions.jsx'
import LessonGroups from './pages/LessonGroups.jsx'
import SubjectAssignments from './pages/SubjectAssignments.jsx'
import ManageRooms from './pages/ManageRooms.jsx'
import CompareTimetables from './pages/CompareTimetables.jsx'
import BackupRestore from './pages/BackupRestore.jsx'
import WhatsNew, { useWhatsNew } from './components/WhatsNew.jsx'
import CommandPalette from './components/CommandPalette.jsx'
import { APP_VERSION, APP_CODENAME } from './data/changelog.js'
import LockScreen from './components/LockScreen.jsx'

function UndoToast() {
  const { state, dispatch } = useApp()
  const timerRef = useRef(null)

  useEffect(() => {
    if (state.lastDeleted) {
      timerRef.current = setTimeout(() => {
        dispatch({ type: 'CLEAR_UNDO' })
      }, 8000)
      return () => clearTimeout(timerRef.current)
    }
  }, [state.lastDeleted, dispatch])

  if (!state.lastDeleted) return null

  const labels = {
    teacher: 'Teacher',
    class: 'Class',
    room: 'Room',
    timetable: 'Timetable',
    all: 'All data',
  }
  const label = labels[state.lastDeleted.type] || 'Item'

  return (
    <div className="fixed bottom-4 right-4 z-[200] animate-fade-in">
      <div className="bg-slate-800 text-white rounded-lg shadow-xl px-4 py-3 flex items-center gap-4">
        <span className="text-sm">{label} deleted</span>
        <button
          onClick={() => { dispatch({ type: 'UNDO_DELETE' }); sounds.click() }}
          className="px-3 py-1 text-xs font-bold rounded bg-brand-600 hover:bg-brand-700 text-white transition-colors"
        >
          Undo
        </button>
        <button
          onClick={() => dispatch({ type: 'CLEAR_UNDO' })}
          className="text-slate-400 hover:text-white"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function SuccessToast() {
  const { state, dispatch } = useApp()
  const timerRef = useRef(null)

  useEffect(() => {
    if (state.successMessage) {
      timerRef.current = setTimeout(() => {
        dispatch({ type: 'CLEAR_SUCCESS_MESSAGE' })
      }, 3000)
      return () => clearTimeout(timerRef.current)
    }
  }, [state.successMessage, dispatch])

  if (!state.successMessage) return null

  return (
    <div className="fixed bottom-4 right-4 z-[200] animate-fade-in">
      <div className="bg-green-600 text-white rounded-lg shadow-xl px-4 py-3 flex items-center gap-3">
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-sm font-medium">{state.successMessage}</span>
        <button
          onClick={() => dispatch({ type: 'CLEAR_SUCCESS_MESSAGE' })}
          className="text-green-200 hover:text-white"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function StorageWarningBanner({ onOpenModal }) {
  const { state, dismissStorageWarning } = useApp()
  if (!state.storageWarning) return null
  return (
    <div className="fixed top-0 left-0 right-0 z-[200] bg-amber-500 text-white text-center py-2 px-4 text-sm flex items-center justify-center gap-3">
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <span className="flex-1">{state.storageWarning}</span>
      <button onClick={onOpenModal} className="text-white/90 hover:text-white underline font-medium">View Options</button>
      <button onClick={dismissStorageWarning} className="text-white/80 hover:text-white ml-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

function compareVersions(latest, current) {
  const l = latest.split('.').map(Number)
  const c = current.split('.').map(Number)
  for (let i = 0; i < Math.max(l.length, c.length); i++) {
    const lv = l[i] || 0
    const cv = c[i] || 0
    if (lv > cv) return true
    if (lv < cv) return false
  }
  return false
}

let hasShownSplash = false

export default function App() {
  const { state, dispatch } = useApp()
  const [page, setPage] = useState(() => localStorage.getItem('shikola-current-page') || 'home')
  const [loading, setLoading] = useState(!hasShownSplash)
  const [loadProgress, setLoadProgress] = useState(hasShownSplash ? 100 : 0)
  const [showDocs, setShowDocs] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const searchRef = useRef(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('shikola-sidebar-collapsed') === 'true')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [storageLimitModal, setStorageLimitModal] = useState(false)
  const [showUpdates, setShowUpdates] = useState(false)
  const [updateStatus, setUpdateStatus] = useState(null)
  const [installInfo, setInstallInfo] = useState(null)
  const [autoUpdateInfo, setAutoUpdateInfo] = useState(null)
  const [downloadProgress, setDownloadProgress] = useState(null)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const profileRef = useRef(null)
  const { showWhatsNew, dismissWhatsNew } = useWhatsNew()

  useEffect(() => {
    if (hasShownSplash) return
    const duration = 800
    const interval = setInterval(() => {
      setLoadProgress(prev => {
        const next = prev + (100 / (duration / 50))
        return next >= 100 ? 100 : next
      })
    }, 50)
    const timer = setTimeout(() => {
      setLoadProgress(100)
      setLoading(false)
      hasShownSplash = true
    }, duration)
    return () => { clearInterval(interval); clearTimeout(timer) }
  }, [])

  useEffect(() => {
    localStorage.setItem('shikola-current-page', page)
  }, [page])

  useEffect(() => {
    localStorage.setItem('shikola-sidebar-collapsed', sidebarCollapsed)
  }, [sidebarCollapsed])

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Command Palette: Ctrl+K to open
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setShowCommandPalette(v => !v)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  useEffect(() => {
    const { primaryColor, accentColor } = state.appearance || {}
    applyColorScale(primaryColor || '#2563eb', accentColor || '#3b82f6')
  }, [state.appearance?.primaryColor, state.appearance?.accentColor])

  useEffect(() => {
    setSoundEnabled(state.appearance?.soundEnabled !== false)
  }, [state.appearance?.soundEnabled])

  // Detect install vs update from Electron main process
  useEffect(() => {
    if (window.electronAPI?.getInstallInfo) {
      window.electronAPI.getInstallInfo().then((info) => {
        setInstallInfo(info)
        if (info?.isUpdate && state.telemetry?.analyticsEnabled) {
          trackEvent('app_updated', { from: info.previousVersion, to: info.currentVersion })
        } else if (info?.isFirstInstall && state.telemetry?.analyticsEnabled) {
          trackEvent('app_installed', { version: info.currentVersion })
        }
      }).catch(() => {})
    }
  }, [state.telemetry?.analyticsEnabled])

  // Auto-updater: listen for background update events from Electron
  useEffect(() => {
    const updater = window.electronAPI?.updater
    if (!updater) return

    updater.onAvailable((info) => {
      setDownloadProgress({ percent: 0 })
      if (state.telemetry?.analyticsEnabled) {
        trackEvent('update_available', { version: info.version })
      }
    })
    updater.onProgress((progress) => {
      setDownloadProgress(progress)
    })
    updater.onDownloaded((info) => {
      setDownloadProgress(null)
      setAutoUpdateInfo({
        version: info.version,
        releaseNotes: info.releaseNotes,
      })
      if (state.telemetry?.analyticsEnabled) {
        trackEvent('update_downloaded', { version: info.version })
      }
    })
    updater.onError(() => {
      setDownloadProgress(null)
    })
  }, [state.telemetry?.analyticsEnabled])

  // Telemetry: send launch event and set up crash handling based on consent
  useEffect(() => {
    const telemetry = state.telemetry || {}
    if (telemetry.analyticsEnabled) {
      sendLaunchEvent()
    }
    if (telemetry.crashReportingEnabled) {
      setupGlobalErrorHandler(true)
    }
  }, [state.telemetry?.analyticsEnabled, state.telemetry?.crashReportingEnabled])

  // Read installer consent on first launch (before school is set)
  useEffect(() => {
    if (!state.school && window.electronAPI?.telemetry?.getConsent) {
      window.electronAPI.telemetry.getConsent().then((consent) => {
        if (consent) {
          dispatch({ type: 'SET_TELEMETRY', payload: consent })
        }
      }).catch(() => {})
    }
  }, [state.school])

  const navigate = (p) => {
    sounds.navigate()
    setPage(p)
    if (state.telemetry?.analyticsEnabled) {
      trackEvent('page_viewed', { page: p })
    }
  }

  useEffect(() => {
    if (window.electronAPI?.onMenuAction) {
      window.electronAPI.onMenuAction((category, action) => {
        if (category === 'help' && action === 'about') {
          setShowAbout(true)
          return
        }
        if (category === 'help' && action === 'docs') {
          setShowDocs(true)
          return
        }
        if (category === 'help' && action === 'check-updates') {
          setShowUpdates(true)
          setUpdateStatus('checking')
          const checkUpdates = window.electronAPI?.checkForUpdates
            ? window.electronAPI.checkForUpdates()
            : fetch('https://api.github.com/repos/sepiocorp/shikola.timetable.app/releases/latest')
                .then(res => res.json())
                .then(data => data?.tag_name
                  ? { success: true, tag_name: data.tag_name, html_url: data.html_url, body: data.body }
                  : { success: false, error: 'Could not retrieve update information.' }
                )
          Promise.resolve(checkUpdates)
            .then(result => {
              if (result?.success && result.tag_name) {
                const latest = result.tag_name.replace(/^v/, '')
                const isNewer = compareVersions(latest, APP_VERSION)
                if (isNewer) {
                  setUpdateStatus({ status: 'available', latestVersion: latest, currentVersion: APP_VERSION, downloadUrl: result.html_url, releaseNotes: result.body })
                } else {
                  setUpdateStatus({ status: 'up-to-date', latestVersion: latest, currentVersion: APP_VERSION })
                }
              } else {
                setUpdateStatus({ status: 'error', message: result?.error || 'Could not retrieve update information.' })
              }
            })
            .catch(() => {
              setUpdateStatus({ status: 'error', message: 'Failed to check for updates. Please check your internet connection.' })
            })
          return
        }
        const menuMap = {
          'timetable:smart-generate': 'generate',
          'timetable:view-timetables': 'view',
          'timetable:manage-classes': 'classes',
          'timetable:timetable-editor': 'editor',
        }
        const target = menuMap[`${category}:${action}`]
        if (target) navigate(target)
      })
    }
  }, [])

  const TeachersPage = ManageTeachers
  const ClassesPage = ManageClasses
  const SubjectsPage = ManageSubjects
  const DepartmentsPage = Departments
  const GeneratePage = SmartGenerate
  const ViewPage = ViewTimetables

  const pageTitles = {
    home: { title: 'Home', subtitle: 'Dashboard overview' },
    teachers: { title: 'Teachers', subtitle: 'Manage teaching staff' },
    classes: { title: 'Classes', subtitle: 'Manage classes and sections' },
    subjects: { title: 'Subjects', subtitle: 'Manage subjects offered' },
    departments: { title: 'Departments', subtitle: 'Manage academic departments' },
    rooms: { title: 'Rooms', subtitle: 'Manage rooms and facilities' },
    editor: { title: 'Timetable Editor', subtitle: 'Create and modify timetables' },
    generate: { title: 'Smart Generate', subtitle: 'Auto-generate timetables' },
    view: { title: 'View Timetables', subtitle: 'View and export timetables' },
    print: { title: 'Print Preview', subtitle: 'Preview and print timetables' },
    constraints: { title: 'Teacher Constraints', subtitle: 'Set availability and limits' },
    relationships: { title: 'Card Relationships', subtitle: 'Define scheduling rules' },
    verify: { title: 'Verify Timetable', subtitle: 'Check for conflicts' },
    statistics: { title: 'Statistics', subtitle: 'Detailed timetable analytics' },
    substitutions: { title: 'Substitutions', subtitle: 'Manage teacher absences' },
    backup: { title: 'Backup & Restore', subtitle: 'Save and restore data' },
    lessonGroups: { title: 'Lesson Groups', subtitle: 'Manage lesson groupings' },
    subjectAssignments: { title: 'Subject Assignments', subtitle: 'Assign subjects to teachers' },
    compare: { title: 'Compare Timetables', subtitle: 'Compare multiple timetables' },
    settings: { title: 'Settings', subtitle: 'School and system configuration' },
  }

  const searchResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return []
    const results = []
    Object.entries(pageTitles).forEach(([id, info]) => {
      if (info.title.toLowerCase().includes(q) || info.subtitle.toLowerCase().includes(q)) {
        results.push({ type: 'page', id, label: info.title, desc: info.subtitle })
      }
    })
    state.teachers.forEach(t => {
      if (t.name.toLowerCase().includes(q)) results.push({ type: 'entity', page: 'teachers', label: t.name, desc: 'Teacher' })
    })
    state.classes.forEach(c => {
      if (c.name.toLowerCase().includes(q)) results.push({ type: 'entity', page: 'classes', label: c.name, desc: 'Class' })
    })
    state.subjects.forEach(s => {
      if (s.name.toLowerCase().includes(q)) results.push({ type: 'entity', page: 'subjects', label: s.name, desc: 'Subject' })
    })
    state.rooms.forEach(r => {
      if (r.name.toLowerCase().includes(q)) results.push({ type: 'entity', page: 'rooms', label: r.name, desc: 'Room' })
    })
    state.departments.forEach(d => {
      if (d.name.toLowerCase().includes(q)) results.push({ type: 'entity', page: 'departments', label: d.name, desc: 'Department' })
    })
    return results.slice(0, 8)
  }, [searchQuery, pageTitles, state.teachers, state.classes, state.subjects, state.rooms, state.departments])

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50">
        <div className="flex items-center gap-3 mb-6">
          <img src="./logo.png" alt="Shikola logo" className="w-12 h-12 rounded-xl object-contain" />
          <div>
            <h1 className="text-xl font-bold text-slate-800">Shikola Timetable Creator</h1>
            <p className="text-sm text-slate-500">by Sepio Corp</p>
          </div>
        </div>
        <div className="w-56 mt-2">
          <ProgressBar value={loadProgress} max={100} />
        </div>
        <p className="mt-4 text-sm text-slate-500">Loading your workspace...</p>
      </div>
    )
  }

  if (!state.school) {
    return (
      <>
        <SetupWizard onShowAbout={() => setShowAbout(true)} onShowDocs={() => setShowDocs(true)} />
        <Modal open={showDocs} onClose={() => setShowDocs(false)} title="Documentation" maxWidth="max-w-4xl">
          <Documentation />
        </Modal>
        <Modal open={showAbout} onClose={() => setShowAbout(false)} title="About Shikola Timetable Creator" maxWidth="max-w-3xl">
          <About />
        </Modal>
        <Modal open={showUpdates} onClose={() => setShowUpdates(false)} title="Check for Updates" maxWidth="max-w-md">
          <div className="p-6">
            {updateStatus === 'checking' && (
              <div className="flex flex-col items-center py-8">
                <svg className="animate-spin w-8 h-8 text-brand-600 mb-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-sm text-slate-600">Checking for updates...</p>
              </div>
            )}
            {updateStatus?.status === 'up-to-date' && (
              <div className="flex flex-col items-center py-8">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-slate-700">You're up to date!</p>
                <p className="text-xs text-slate-500 mt-1">Shikola Timetable Creator v{updateStatus.currentVersion} is the latest version.</p>
              </div>
            )}
            {updateStatus?.status === 'available' && (
              <div className="py-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Update available!</p>
                    <p className="text-xs text-slate-500">v{updateStatus.currentVersion} → v{updateStatus.latestVersion}</p>
                  </div>
                </div>
                {updateStatus.releaseNotes && (
                  <div className="bg-slate-50 rounded-lg p-3 mb-4 max-h-40 overflow-y-auto">
                    <p className="text-xs font-medium text-slate-600 mb-1">Release Notes:</p>
                    <p className="text-xs text-slate-500 whitespace-pre-wrap">{updateStatus.releaseNotes}</p>
                  </div>
                )}
                <button
                  onClick={async () => {
                    const result = await window.electronAPI?.updater?.downloadUpdate()
                    if (result?.success) {
                      setShowUpdates(false)
                    } else if (window.electronAPI?.updater) {
                      setUpdateStatus(prev => ({ ...prev, status: 'error', message: result?.error || 'Failed to start download.' }))
                    } else if (updateStatus.downloadUrl) {
                      window.open(updateStatus.downloadUrl, '_blank', 'noopener,noreferrer')
                    }
                  }}
                  className="block w-full text-center px-4 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium text-sm"
                >
                  Download Update
                </button>
              </div>
            )}
            {updateStatus?.status === 'error' && (
              <div className="flex flex-col items-center py-8">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-slate-700">Unable to check for updates</p>
                <p className="text-xs text-slate-500 mt-1 text-center">{updateStatus.message}</p>
                <a href="https://shikola.org" target="_blank" rel="noopener noreferrer" className="mt-4 text-xs px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium">Visit shikola.org</a>
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <button onClick={() => setShowUpdates(false)} className="w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium">Close</button>
            </div>
          </div>
        </Modal>
      </>
    )
  }

  if (state.appLocked) {
    return <LockScreen lockReason={state.lockReason} />
  }

  const pages = {
    home: <Dashboard navigate={navigate} searchQuery={searchQuery} />,
    teachers: <TeachersPage navigate={navigate} searchQuery={searchQuery} />,
    classes: <ClassesPage navigate={navigate} searchQuery={searchQuery} />,
    subjects: <SubjectsPage navigate={navigate} searchQuery={searchQuery} />,
    departments: <DepartmentsPage navigate={navigate} searchQuery={searchQuery} />,
    rooms: <ManageRooms navigate={navigate} searchQuery={searchQuery} />,
    editor: <TimetableEditor navigate={navigate} searchQuery={searchQuery} />,
    generate: <GeneratePage navigate={navigate} searchQuery={searchQuery} />,
    view: <ViewPage navigate={navigate} searchQuery={searchQuery} />,
    print: <PrintPreview navigate={navigate} />,
    constraints: <TeacherConstraints navigate={navigate} />,
    relationships: <CardRelationships navigate={navigate} />,
    verify: <TimetableVerification navigate={navigate} />,
    statistics: <Statistics navigate={navigate} />,
    substitutions: <Substitutions navigate={navigate} />,
    backup: <BackupRestore />,
    lessonGroups: <LessonGroups navigate={navigate} />,
    subjectAssignments: <SubjectAssignments navigate={navigate} />,
    compare: <CompareTimetables navigate={navigate} />,
    settings: <Settings searchQuery={searchQuery} />,
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      <StorageWarningBanner onOpenModal={() => setStorageLimitModal(true)} />
      {/* Header bar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3 flex items-center justify-between gap-4 z-30 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger menu */}
            <button
              onClick={() => { sounds.click(); setMobileSidebarOpen(true) }}
              className="md:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title="Open menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* App name */}
            <div className="flex items-center gap-2">
              <img src="./logo.png" alt="Shikola logo" className="w-7 h-7 rounded-lg object-contain" />
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold text-slate-800 leading-tight">{pageTitles[page]?.title || 'Shikola'}</h1>
                <p className="text-xs text-slate-400 leading-tight">{pageTitles[page]?.subtitle || 'Timetable Creator'}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div ref={searchRef} className="relative hidden sm:block">
              <div className="flex items-center bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 w-64">
                <svg className="w-4 h-4 text-slate-400 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 011-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  placeholder="Search pages..."
                  className="bg-transparent text-sm text-slate-600 placeholder-slate-400 focus:outline-none flex-1"
                />
                {searchQuery ? (
                  <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={() => setShowCommandPalette(true)}
                    className="text-[10px] font-medium text-slate-400 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded border border-slate-200 transition-colors"
                    title="Open Command Palette (Ctrl+K)"
                  >
                    Ctrl K
                  </button>
                )}
              </div>
              {searchFocused && searchQuery && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50 max-h-80 overflow-y-auto">
                  {searchResults.map((result, i) => (
                    <button
                      key={`${result.type}-${result.label}-${i}`}
                      onClick={() => {
                        sounds.click()
                        navigate(result.type === 'page' ? result.id : result.page)
                        setSearchFocused(false)
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 011-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{result.label}</p>
                        <p className="text-xs text-slate-400 truncate">{result.desc}</p>
                      </div>
                      {result.type === 'entity' && (
                        <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded capitalize">{result.desc}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {searchFocused && searchQuery && searchResults.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-slate-200 py-3 z-50">
                  <p className="text-sm text-slate-400 text-center">No results found for "{searchQuery}"</p>
                </div>
              )}
            </div>

            {/* Mobile search toggle */}
            <button
              onClick={() => { sounds.click(); setMobileSearchOpen(v => !v) }}
              className="sm:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title="Search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 011-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Profile dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => { sounds.click(); setProfileDropdownOpen(v => !v) }}
                className="flex items-center gap-2 p-1 pr-2 rounded-lg hover:bg-slate-100 transition-colors"
                title="Profile"
              >
                {state.school?.logo ? (
                  <img src={state.school.logo} alt="School logo" className="w-8 h-8 rounded-lg object-contain bg-white border border-slate-200" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center">
                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <span className="text-sm font-medium text-slate-700 hidden sm:block max-w-[140px] truncate">{state.school?.name || 'School'}</span>
                <svg className={`w-4 h-4 text-slate-400 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 animate-fade-in">
                  {/* School info */}
                  <div className="px-4 py-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      {state.school?.logo ? (
                        <img src={state.school.logo} alt="School logo" className="w-10 h-10 rounded-lg object-contain bg-white border border-slate-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center">
                          <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{state.school?.name || 'Unknown School'}</p>
                        {state.school?.email && <p className="text-xs text-slate-400 truncate">{state.school.email}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <button
                    onClick={() => { setProfileDropdownOpen(false); navigate('settings'); sounds.click() }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </button>
                  <button
                    onClick={() => { setProfileDropdownOpen(false); setShowAbout(true); sounds.click() }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    About
                  </button>
                  <button
                    onClick={() => { setProfileDropdownOpen(false); setShowDocs(true); sounds.click() }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Documentation
                  </button>
                  <button
                    onClick={() => { setProfileDropdownOpen(false); setShowUpdates(true); sounds.click() }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Check for Updates
                  </button>
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <p className="px-4 py-2 text-xs text-slate-400">v{APP_VERSION} "{APP_CODENAME}"</p>
                  </div>
                </div>
              )}
            </div>
          </div>

        {/* Mobile search bar (expandable) */}
        {mobileSearchOpen && (
          <div className="sm:hidden px-4 py-3 bg-white border-b border-slate-200 flex-shrink-0">
            <div className="relative flex items-center bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <svg className="w-4 h-4 text-slate-400 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 011-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="bg-transparent text-sm text-slate-600 placeholder-slate-400 focus:outline-none flex-1"
                autoFocus
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          current={page}
          navigate={navigate}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(v => !v)}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />
        <div className="flex-1 overflow-y-auto min-w-0">
          {pages[page]}
        </div>
      </div>
      <WhatsNew open={showWhatsNew} onClose={dismissWhatsNew} installInfo={installInfo} />
      <CommandPalette open={showCommandPalette} onClose={() => setShowCommandPalette(false)} navigate={navigate} />
      <UndoToast />
      <SuccessToast />

      {/* Auto-update download progress toast */}
      {downloadProgress && (
        <div className="fixed bottom-4 right-4 z-[200] animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 px-4 py-3 w-72">
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-5 h-5 text-brand-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700">Downloading update...</p>
                <p className="text-xs text-slate-500">{downloadProgress.percent}%</p>
              </div>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-brand-600 rounded-full transition-all duration-300" style={{ width: `${downloadProgress.percent}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Auto-update ready notification toast */}
      {autoUpdateInfo && (
        <div className="fixed bottom-4 right-4 z-[200] animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 px-4 py-3 w-80">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-700">Update ready to install</p>
                <p className="text-xs text-slate-500 mt-0.5">v{autoUpdateInfo.version} has been downloaded. Restart to apply.</p>
              </div>
              <button
                onClick={() => setAutoUpdateInfo(null)}
                className="text-slate-400 hover:text-slate-600 flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  window.electronAPI?.updater?.installNow()
                  setAutoUpdateInfo(null)
                }}
                className="flex-1 px-3 py-2 bg-brand-600 text-white text-xs font-medium rounded-lg hover:bg-brand-700 transition-colors"
              >
                Install now & restart
              </button>
              <button
                onClick={() => {
                  window.electronAPI?.updater?.installOnQuit()
                  setAutoUpdateInfo(null)
                }}
                className="flex-1 px-3 py-2 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-200 transition-colors"
              >
                Install on quit
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal open={showDocs} onClose={() => setShowDocs(false)} title="Documentation" maxWidth="max-w-4xl">
        <Documentation />
      </Modal>
      <Modal open={showAbout} onClose={() => setShowAbout(false)} title="About Shikola Timetable Creator" maxWidth="max-w-3xl">
        <About />
      </Modal>

      {/* Check for Updates Modal */}
      <Modal open={showUpdates} onClose={() => setShowUpdates(false)} title="Check for Updates" maxWidth="max-w-md">
        <div className="p-6">
          {updateStatus === 'checking' && (
            <div className="flex flex-col items-center py-8">
              <svg className="animate-spin w-8 h-8 text-brand-600 mb-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-sm text-slate-600">Checking for updates...</p>
            </div>
          )}
          {updateStatus?.status === 'up-to-date' && (
            <div className="flex flex-col items-center py-8">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-700">You're up to date!</p>
              <p className="text-xs text-slate-500 mt-1">Shikola Timetable Creator v{updateStatus.currentVersion} is the latest version.</p>
            </div>
          )}
          {updateStatus?.status === 'available' && (
            <div className="py-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">Update available!</p>
                  <p className="text-xs text-slate-500">v{updateStatus.currentVersion} → v{updateStatus.latestVersion}</p>
                </div>
              </div>
              {updateStatus.releaseNotes && (
                <div className="bg-slate-50 rounded-lg p-3 mb-4 max-h-40 overflow-y-auto">
                  <p className="text-xs font-medium text-slate-600 mb-1">Release Notes:</p>
                  <p className="text-xs text-slate-500 whitespace-pre-wrap">{updateStatus.releaseNotes}</p>
                </div>
              )}
              <button
                onClick={async () => {
                  const result = await window.electronAPI?.updater?.downloadUpdate()
                  if (result?.success) {
                    setShowUpdates(false)
                  } else if (window.electronAPI?.updater) {
                    setUpdateStatus(prev => ({ ...prev, status: 'error', message: result?.error || 'Failed to start download.' }))
                  } else if (updateStatus.downloadUrl) {
                    window.open(updateStatus.downloadUrl, '_blank', 'noopener,noreferrer')
                  }
                }}
                className="block w-full text-center px-4 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium text-sm"
              >
                Download Update
              </button>
            </div>
          )}
          {updateStatus?.status === 'error' && (
            <div className="flex flex-col items-center py-8">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-700">Unable to check for updates</p>
              <p className="text-xs text-slate-500 mt-1 text-center">{updateStatus.message}</p>
              <a href="https://shikola.org" target="_blank" rel="noopener noreferrer" className="mt-4 text-xs px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium">Visit shikola.org</a>
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-slate-200">
            <button
              onClick={() => setShowUpdates(false)}
              className="w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Storage Limit Modal */}
      <Modal open={storageLimitModal} onClose={() => setStorageLimitModal(false)} title="Storage Limit Exceeded">
        <div className="p-6">
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
            <button
              onClick={() => setStorageLimitModal(false)}
              className="w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
