import React, { useState, useEffect, useRef } from 'react'
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
import Pupils from './pages/Pupils.jsx'
import SubjectAssignments from './pages/SubjectAssignments.jsx'
import ManageRooms from './pages/ManageRooms.jsx'
import CompareTimetables from './pages/CompareTimetables.jsx'
import WhatsNew, { useWhatsNew } from './components/WhatsNew.jsx'
import { APP_VERSION } from './data/changelog.js'
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

export default function App() {
  const { state, dispatch } = useApp()
  const [page, setPage] = useState(() => localStorage.getItem('shikola-current-page') || 'home')
  const [loading, setLoading] = useState(true)
  const [loadProgress, setLoadProgress] = useState(0)
  const [showDocs, setShowDocs] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('shikola-sidebar-collapsed') === 'true')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [storageLimitModal, setStorageLimitModal] = useState(false)
  const [showUpdates, setShowUpdates] = useState(false)
  const [updateStatus, setUpdateStatus] = useState(null)
  const [installInfo, setInstallInfo] = useState(null)
  const { showWhatsNew, dismissWhatsNew } = useWhatsNew()

  useEffect(() => {
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
    }, duration)
    return () => { clearInterval(interval); clearTimeout(timer) }
  }, [])

  useEffect(() => {
    localStorage.setItem('shikola-current-page', page)
  }, [page])

  useEffect(() => {
    localStorage.setItem('shikola-sidebar-collapsed', sidebarCollapsed)
  }, [sidebarCollapsed])

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
                <a href={updateStatus.downloadUrl} target="_blank" rel="noopener noreferrer" className="block w-full text-center px-4 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium text-sm">Download Update</a>
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
    editor: <TimetableEditor navigate={navigate} searchQuery={searchQuery} />,
    generate: <GeneratePage navigate={navigate} searchQuery={searchQuery} />,
    view: <ViewPage navigate={navigate} searchQuery={searchQuery} />,
    settings: <Settings searchQuery={searchQuery} />,
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <StorageWarningBanner onOpenModal={() => setStorageLimitModal(true)} />
      <Sidebar
        current={page}
        navigate={navigate}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(v => !v)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />
      <div className="flex-1 overflow-auto flex flex-col min-w-0">
        {/* Header bar */}
        <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-3 md:px-6 py-2.5 flex items-center gap-3">
          {/* Mobile hamburger menu */}
          <button
            onClick={() => { sounds.click(); setMobileSidebarOpen(true) }}
            className="md:hidden p-2 -ml-1 text-slate-600 hover:text-brand-600 hover:bg-slate-50 rounded-lg transition-colors"
            title="Open menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo + App Name */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <img src="./logo.png" alt="Shikola logo" className="w-8 h-8 rounded-lg object-contain" />
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-slate-800 leading-tight">Shikola</h1>
              <p className="text-[10px] text-slate-500 leading-tight">Timetable Creator</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-md hidden md:block">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search teachers, classes, subjects, rooms..."
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Mobile search toggle */}
          <button
            onClick={() => { sounds.click(); setMobileSearchOpen(v => !v) }}
            className="md:hidden p-2 text-slate-600 hover:text-brand-600 hover:bg-slate-50 rounded-lg transition-colors"
            title="Search"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          <span className="text-xs text-slate-400 hidden sm:inline">{page === 'home' ? 'Home' : page.charAt(0).toUpperCase() + page.slice(1)}</span>
        </div>

        {/* Mobile search bar (expandable) */}
        {mobileSearchOpen && (
          <div className="md:hidden px-3 py-2 bg-white border-b border-slate-200">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                autoFocus
              />
            </div>
          </div>
        )}
        <div className="flex-1 overflow-auto">
          {pages[page]}
        </div>
      </div>
      <WhatsNew open={showWhatsNew} onClose={dismissWhatsNew} installInfo={installInfo} />
      <UndoToast />
      <SuccessToast />

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
              <a
                href={updateStatus.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center px-4 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium text-sm"
              >
                Download Update
              </a>
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
            You have exceeded the 15 MB storage limit. To continue using Shikola Timetable, please choose one of the following options:
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
