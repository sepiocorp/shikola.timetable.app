import React from 'react'

export default function LockScreen({ lockReason }) {
  const reason = lockReason || {}
  const message = reason.message || 'You have reached the limits of the Shikola Timetable Creator free tier.'

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-brand-600 to-brand-800 px-8 py-8 text-center">
          <img src="./logo.png" alt="Shikola logo" className="w-16 h-16 rounded-xl object-contain mx-auto mb-4 bg-white/10 p-2" />
          <h1 className="text-xl font-bold text-white">Shikola Timetable Creator</h1>
          <p className="text-sm text-brand-100 mt-1">Free Tier Limit Reached</p>
        </div>

        {/* Body */}
        <div className="px-8 py-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm text-amber-800">{message}</p>
            </div>
          </div>

          <p className="text-sm text-slate-600 mb-6 text-center">
            To continue managing your school's timetable without limits, please choose one of the options below:
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <a
              href="https://shikola.org"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-4 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-semibold text-sm shadow-md hover:shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Shikola Management System
            </a>

            <a
              href="mailto:sales@shikola.org?subject=Upgrade Request - Shikola Timetable Creator&body=I have reached the limits of the Shikola Timetable Creator free tier and would like to upgrade or get more information about the Shikola Management System."
              className="flex items-center justify-center gap-2 w-full px-4 py-4 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-semibold text-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Contact Sales
            </a>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-400">
              Shikola Timetable Creator is a free complimentary app with usage limits.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              The Shikola Management System offers unlimited entities, cloud storage, and advanced features.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
