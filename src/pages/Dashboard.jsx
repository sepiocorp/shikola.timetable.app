import React, { useState } from 'react'
import { useApp, getScheduleForClass } from '../store/AppContext.jsx'
import { Card, PageHeader, Button, SkeletonCard, ProgressBar, Badge } from '../components/UI.jsx'
import { sounds } from '../utils/sounds.js'

export default function Dashboard({ navigate, searchQuery }) {
  const { state } = useApp()
  const [loading, setLoading] = useState(false)

  const stats = [
    { label: 'Teachers', count: state.teachers.length, icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', page: 'teachers' },
    { label: 'Classes', count: state.classes.length, icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', page: 'classes' },
    { label: 'Subjects', count: state.subjects.length, icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', page: 'subjects' },
    { label: 'Rooms', count: state.rooms.length, icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5', page: 'rooms' },
  ]

  const teachingPeriods = state.settings.periods.filter(p => !p.isBreak)
  const totalSlots = state.settings.days.length * teachingPeriods.length
  const filledSlots = state.timetable.length
  const fillPercent = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0

  const activePeriod = state.academicPeriods.find(p => p.id === state.activePeriodId)

  const sectionStats = state.sections.map(section => {
    const sectionClasses = state.classes.filter(c => c.sectionId === section.id)
    const sectionEntries = state.timetable.filter(e => {
      const cls = state.classes.find(c => c.id === e.classId)
      return cls?.sectionId === section.id
    })
    const sectionTeachingPeriods = (section.periods || []).filter(p => !p.isBreak)
    const sectionTotalSlots = (section.days || []).length * sectionTeachingPeriods.length * sectionClasses.length
    return {
      name: section.name,
      classCount: sectionClasses.length,
      entryCount: sectionEntries.length,
      totalSlots: sectionTotalSlots,
      fillPercent: sectionTotalSlots > 0 ? Math.round((sectionEntries.length / sectionTotalSlots) * 100) : 0,
    }
  })

  const quickActions = [
    { label: 'Manage Teachers', desc: 'Add or edit teaching staff', page: 'teachers' },
    { label: 'Teacher Constraints', desc: 'Set availability and scheduling limits', page: 'constraints' },
    { label: 'Smart Generate', desc: 'Auto-generate timetables with smart scheduling', page: 'generate' },
    { label: 'Edit Timetable', desc: 'Create or modify timetables', page: 'editor' },
    { label: 'View & Export', desc: 'View and export timetables', page: 'view' },
    { label: 'Print Preview', desc: 'Preview and print timetables', page: 'print' },
    { label: 'Verify Timetable', desc: 'Check for conflicts and issues', page: 'verify' },
    { label: 'Statistics', desc: 'View detailed timetable statistics', page: 'statistics' },
    { label: 'Card Relationships', desc: 'Define subject scheduling rules', page: 'relationships' },
    { label: 'Substitutions', desc: 'Manage teacher absences', page: 'substitutions' },
    { label: 'Backup & Restore', desc: 'Save and restore data snapshots', page: 'backup' },
    { label: 'Settings', desc: 'Manage sections, periods, and school settings', page: 'settings' },
  ]

  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-5 text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 animate-pulse">
          <div className="h-4 w-48 bg-slate-200 rounded mb-4" />
          <div className="h-2 w-full bg-slate-200 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-5 text-sm">
      {/* Academic Period Banner */}
      {state.academicPeriods.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">Academic Period</p>
            <p className="text-xs text-slate-400 mt-1">
              {activePeriod ? `${activePeriod.name} (${activePeriod.type})` : 'No period selected - go to Settings to create one'}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { sounds.click(); navigate('settings') }}>Manage Periods</Button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
        {stats.map((stat, i) => {
          const gradients = [
            'from-slate-600 to-slate-800',
            'from-sky-500 to-sky-700',
            'from-emerald-500 to-teal-600',
            'from-amber-500 to-orange-600',
            'from-slate-500 to-slate-700',
          ]
          return (
            <div
              key={stat.label}
              onClick={() => { sounds.click(); navigate(stat.page) }}
              className={`rounded-xl bg-gradient-to-tr ${gradients[i % gradients.length]} text-white p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
            >
              <div>
                <div className="text-xs uppercase tracking-wide text-white/80">{stat.label}</div>
                <div className="mt-2 text-2xl font-semibold leading-none">{stat.count}</div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                </svg>
              </div>
            </div>
          )
        })}
      </div>

      {/* Timetable Progress */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="text-sm font-semibold text-slate-800 mb-4">Timetable Completion</div>
        <ProgressBar value={filledSlots} max={totalSlots} label={`${filledSlots} of ${totalSlots} slots filled across ${state.settings.days.length} days`} />
        {sectionStats.length > 0 && (
          <div className="mt-4 space-y-3">
            <p className="text-xs font-semibold text-slate-400">By Section:</p>
            {sectionStats.map(s => (
              <div key={s.name} className="flex items-center gap-3">
                <span className="text-xs font-medium text-slate-600 w-24">{s.name}</span>
                <div className="flex-1">
                  <ProgressBar value={s.entryCount} max={s.totalSlots || 1} />
                </div>
                <span className="text-xs text-slate-400 w-20 text-right">{s.entryCount}/{s.totalSlots} ({s.fillPercent}%)</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="text-sm font-semibold text-slate-800 mb-3">Quick Actions</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map(action => (
          <div
            key={action.label}
            onClick={() => { sounds.click(); navigate(action.page) }}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-semibold text-slate-800">{action.label}</p>
              <p className="text-xs text-slate-400 mt-1">{action.desc}</p>
            </div>
            <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        ))}
      </div>
    </div>
  )
}
