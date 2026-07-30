import React, { useRef, useEffect, useState } from 'react'
import { sounds } from '../utils/sounds.js'

const menuItems = [
  { id: 'home', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
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
  const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, height: 0, opacity: 0 })
  const itemRefs = useRef({})

  const handleNav = (id) => {
    sounds.click()
    navigate(id)
    if (onCloseMobile) onCloseMobile()
  }

  useEffect(() => {
    if (collapsed) {
      setIndicatorStyle(prev => ({ ...prev, opacity: 0 }))
      return
    }
    const activeItem = itemRefs.current[current]
    if (activeItem) {
      const { offsetTop, offsetHeight } = activeItem
      setIndicatorStyle({ top: offsetTop, height: offsetHeight, opacity: 1 })
    }
  }, [current, collapsed])

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
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto pt-6 pb-4 px-3 space-y-1 text-sm relative">
          {!collapsed && (
            <div
              className="absolute left-0 w-1 bg-slate-800 rounded-r-full transition-all duration-300 ease-out"
              style={{ top: indicatorStyle.top, height: indicatorStyle.height, opacity: indicatorStyle.opacity }}
            />
          )}
          {menuItems.map(item => (
            <button
              key={item.id}
              ref={el => itemRefs.current[item.id] = el}
              onClick={() => handleNav(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center text-sm font-medium transition-colors ${
                collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'
              } ${
                current === item.id
                  ? 'bg-slate-100 text-slate-900 rounded-lg font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-lg'
              }`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              {!collapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="p-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center">Powered By Shikola Inc</p>
          </div>
        )}
      </div>
    </>
  )
}
