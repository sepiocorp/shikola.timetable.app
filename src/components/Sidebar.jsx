import React, { useRef, useState, useEffect } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { sounds } from '../utils/sounds.js'

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { id: 'teachers', label: 'Teachers', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { id: 'classes', label: 'Classes', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { id: 'subjects', label: 'Subjects', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { id: 'departments', label: 'Departments', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z M3 7l2-2h12l2 2' },
  { id: 'editor', label: 'Timetable Editor', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { id: 'generate', label: 'Smart Generate', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { id: 'view', label: 'View Timetables', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
]

export default function Sidebar({ current, navigate, collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
  const { state } = useApp()
  const navRef = useRef(null)
  const [highlightStyle, setHighlightStyle] = useState({ transform: 'translateY(0)', height: 0 })

  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const activeBtn = nav.querySelector('[data-active="true"]')
    if (activeBtn) {
      const navRect = nav.getBoundingClientRect()
      const btnRect = activeBtn.getBoundingClientRect()
      setHighlightStyle({
        transform: `translateY(${btnRect.top - navRect.top + nav.scrollTop}px)`,
        height: btnRect.height,
        left: btnRect.left - navRect.left,
        width: btnRect.width,
      })
    }
  }, [current, collapsed])

  const handleNav = (id) => {
    sounds.click()
    navigate(id)
    if (onCloseMobile) onCloseMobile()
  }

  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <div className={`
        bg-white border-r border-slate-200 flex flex-col h-full transition-all duration-200
        ${collapsed ? 'w-16' : 'w-64'}
        ${mobileOpen ? 'fixed md:relative inset-y-0 left-0 z-50 translate-x-0' : 'fixed md:relative -translate-x-full md:translate-x-0'}
      `}>
        {/* Collapse toggle button (desktop only) */}
        <div className={`relative ${collapsed ? 'p-2' : 'p-3'} hidden md:block`}>
          <button
            onClick={() => { sounds.click(); onToggleCollapse() }}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="absolute top-1/2 -translate-y-1/2 -right-3 w-6 h-6 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-brand-600 hover:border-brand-300 flex items-center justify-center shadow-sm z-10 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d={collapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'} />
            </svg>
          </button>
        </div>

        {/* School Info */}
        {state.school && !collapsed && (
          <div className="px-5 py-4 bg-brand-50 border-b border-slate-200">
            <p className="text-xs font-semibold text-brand-800 truncate">{state.school.name}</p>
            <p className="text-xs text-slate-500 truncate">{state.school.academicYear}</p>
          </div>
        )}

        {/* Navigation */}
        <nav ref={navRef} className="flex-1 overflow-y-auto py-5 relative">
          {/* Sliding active highlight */}
          <div
            className="absolute left-0 right-0 bg-brand-50 border-r-2 border-brand-600 sidebar-tab-highlight pointer-events-none"
            style={highlightStyle}
          />
          {menuItems.map(item => (
            <button
              key={item.id}
              data-active={current === item.id}
              onClick={() => handleNav(item.id)}
              title={collapsed ? item.label : undefined}
              className={`relative w-full flex items-center text-sm font-medium transition-colors ${
                collapsed ? 'justify-center px-2 py-3.5' : 'gap-3.5 px-6 py-3.5'
              } ${
                current === item.id
                  ? 'text-brand-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              {!collapsed && item.label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="p-3 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center">Powered By Sepio Corp</p>
          </div>
        )}
      </div>
    </>
  )
}
