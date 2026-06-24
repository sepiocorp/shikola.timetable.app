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
import ManageRooms from './pages/ManageRooms.jsx'
import TimetableEditor from './pages/TimetableEditor.jsx'
import SmartGenerate from './pages/SmartGenerate.jsx'
import ViewTimetables from './pages/ViewTimetables.jsx'
import Settings from './pages/Settings.jsx'
import Documentation from './pages/Documentation.jsx'

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

function StorageWarningBanner() {
  const { state, dispatch } = useApp()
  if (!state.storageWarning) return null
  return (
    <div className="fixed top-0 left-0 right-0 z-[200] bg-amber-500 text-white text-center py-2 px-4 text-sm flex items-center justify-center gap-3">
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <span>{state.storageWarning}</span>
      <button onClick={() => dispatch({ type: 'SET_STORAGE_WARNING', payload: null })} className="text-white/80 hover:text-white">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

export default function App() {
  const { state, dispatch } = useApp()
  const [page, setPage] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [loadProgress, setLoadProgress] = useState(0)
  const [showDocs, setShowDocs] = useState(false)
  const [showAbout, setShowAbout] = useState(false)

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
    const { primaryColor, accentColor } = state.appearance || {}
    applyColorScale(primaryColor || '#2563eb', accentColor || '#3b82f6')
  }, [state.appearance?.primaryColor, state.appearance?.accentColor])

  useEffect(() => {
    setSoundEnabled(state.appearance?.soundEnabled !== false)
  }, [state.appearance?.soundEnabled])

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
      </>
    )
  }

  const pages = {
    dashboard: <Dashboard navigate={navigate} />,
    teachers: <ManageTeachers />,
    classes: <ManageClasses />,
    subjects: <ManageSubjects />,
    rooms: <ManageRooms />,
    editor: <TimetableEditor navigate={navigate} />,
    generate: <SmartGenerate navigate={navigate} />,
    view: <ViewTimetables navigate={navigate} />,
    settings: <Settings />,
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <StorageWarningBanner />
      <Sidebar current={page} navigate={navigate} />
      <div className="flex-1 overflow-auto">
        {pages[page]}
      </div>
      <UndoToast />

      <Modal open={showDocs} onClose={() => setShowDocs(false)} title="Documentation" maxWidth="max-w-4xl">
        <Documentation />
      </Modal>
      <Modal open={showAbout} onClose={() => setShowAbout(false)} title="About Shikola Timetable Creator" maxWidth="max-w-3xl">
        <About />
      </Modal>
    </div>
  )
}
