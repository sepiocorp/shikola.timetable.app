import React, { useState, useEffect } from 'react'
import { Modal, Badge } from './UI.jsx'
import { sounds } from '../utils/sounds.js'
import { CHANGELOG, CHANGELOG_ICONS, CHANGELOG_COLORS, APP_VERSION } from '../data/changelog.js'

const STORAGE_KEY = 'shikola-last-seen-version'

export function useWhatsNew() {
  const [showWhatsNew, setShowWhatsNew] = useState(false)

  useEffect(() => {
    const lastSeen = localStorage.getItem(STORAGE_KEY)
    if (lastSeen !== APP_VERSION) {
      const timer = setTimeout(() => {
        setShowWhatsNew(true)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const dismissWhatsNew = () => {
    localStorage.setItem(STORAGE_KEY, APP_VERSION)
    setShowWhatsNew(false)
    sounds.click()
  }

  return { showWhatsNew, dismissWhatsNew, setShowWhatsNew }
}

export default function WhatsNew({ open, onClose, installInfo }) {
  if (!open) return null

  const latest = CHANGELOG[0]
  const isUpdate = installInfo?.isUpdate
  const isFirstInstall = installInfo?.isFirstInstall

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-auto" onClick={e => e.stopPropagation()}>
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-brand-600 to-brand-700 text-white p-6 rounded-t-xl">
          <div className="flex items-center gap-3 mb-2">
            <img src="./logo.png" alt="Shikola" className="w-10 h-10 rounded-lg bg-white/20 object-contain" />
            <div>
              <h2 className="text-lg font-bold">{isUpdate ? 'Updated Successfully!' : isFirstInstall ? 'Welcome!' : "What's New"}</h2>
              <p className="text-xs text-brand-100">Shikola Timetable Creator</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-white/20">v{latest.version}</span>
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-white/20">{latest.codename}</span>
            <span className="text-xs text-brand-100">{latest.date}</span>
          </div>
          {isUpdate && installInfo?.previousVersion && (
            <p className="text-xs text-brand-100 mt-2">
              Updated from v{installInfo.previousVersion} to v{installInfo.currentVersion}
            </p>
          )}
        </div>

          {/* Changes */}
          <div className="p-6">
          <h3 className="text-sm font-bold text-slate-700 mb-4">{latest.title}</h3>
          <div className="space-y-3">
            {latest.changes.map((change, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${CHANGELOG_COLORS[change.type] || 'bg-slate-50 text-slate-600'}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={CHANGELOG_ICONS[change.type] || CHANGELOG_ICONS.feature} />
                  </svg>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed pt-0.5">{change.text}</p>
              </div>
            ))}
          </div>

          {/* Previous versions link hint */}
          {CHANGELOG.length > 1 && (
            <p className="text-xs text-slate-400 mt-5 pt-4 border-t border-slate-100">
              View full changelog in Settings &rarr; About &rarr; Changelog
            </p>
          )}

          {/* Action button */}
          <button
            onClick={onClose}
            className="w-full mt-5 px-4 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium text-sm"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  )
}

export function ChangelogList() {
  return (
    <div className="space-y-6">
      {CHANGELOG.map((entry) => (
        <div key={entry.version} className="border-b border-slate-100 last:border-0 pb-5 last:pb-0">
          <div className="flex items-center gap-2 mb-3">
            <Badge color="blue">v{entry.version}</Badge>
            <Badge color="slate">{entry.codename}</Badge>
            <span className="text-xs text-slate-400">{entry.date}</span>
          </div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">{entry.title}</h4>
          <div className="space-y-2.5">
            {entry.changes.map((change, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${CHANGELOG_COLORS[change.type] || 'bg-slate-50 text-slate-600'}`}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={CHANGELOG_ICONS[change.type] || CHANGELOG_ICONS.feature} />
                  </svg>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed pt-0.5">{change.text}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
