import React from 'react'
import { useApp } from '../store/AppContext.jsx'
import { Card, PageHeader, Badge } from '../components/UI.jsx'
import { ChangelogList } from '../components/WhatsNew.jsx'
import { APP_VERSION } from '../data/changelog.js'

export default function About() {
  const { state } = useApp()

  const features = [
    { icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', title: 'Timetable Editor', desc: 'Create and edit class timetables with automatic conflict detection' },
    { icon: 'M13 10V3L4 14h7v7l9-11h-7z', title: 'Auto-Generate', desc: 'Automatically generate timetables for single or all classes with smart teacher and room assignment', aiLogo: true },
    { icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', title: 'Export & Print', desc: 'Export timetables as PDF or CSV in multiple paper sizes (A4-A1) with bulk export support' },
    { icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', title: 'Teacher Management', desc: 'Manage teachers with subject assignments and maximum period limits' },
    { icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', title: 'Customization', desc: 'Customize colors, themes, display options, and school branding with logo upload' },
    { icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5', title: 'Academic Periods', desc: 'Organize timetables by week, term, quarter, semester, or full academic year' },
  ]

  return (
    <div className="p-4 md:p-8">
      <PageHeader title="About" subtitle="Learn more about Shikola Timetable Creator" />

      {/* App Identity */}
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
              <Badge color="blue">Version {APP_VERSION}</Badge>
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

      {/* Features */}
      <h3 className="text-sm font-bold text-slate-700 mb-3">Key Features</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {features.map(feature => (
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

      {/* Data Privacy */}
      <Card className="p-6 mb-6">
        <h3 className="text-sm font-bold text-slate-700 mb-3">Data Privacy</h3>
        <div className="flex items-start gap-3 mb-3">
          <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-slate-600">
            <p className="font-semibold text-slate-700 mb-1">Local Storage with Optional Telemetry</p>
            <p className="text-xs">
              All your data — school information, teachers, classes, subjects, rooms, and timetables — is stored
              locally on your device. With your consent, the app can also send registration info, anonymous
              analytics, and crash reports to Sepio Corp. You control these options in
              Settings &rarr; Privacy & Telemetry.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge color="green">Local Storage</Badge>
          <Badge color="blue">Opt-In Telemetry</Badge>
          <Badge color="slate">No Third-Party Sharing</Badge>
        </div>
      </Card>

    

      {/* License & Copyright */}
      <Card className="p-6 mb-6">
        <h3 className="text-sm font-bold text-slate-700 mb-3">License & Copyright</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="text-sm text-slate-600">
              <p className="font-semibold text-slate-700">Proprietary License</p>
              <p className="text-xs mt-1">
                This software is proprietary and licensed by Sepio Corp. You may install and use it within your
                educational institution. Copying, distribution, reverse engineering, or sublicensing is prohibited.
                The full End User License Agreement (EULA) is presented during installation.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-slate-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <div className="text-sm text-slate-600">
              <p className="font-semibold text-slate-700">Copyright</p>
              <p className="text-xs mt-1">
                Copyright &copy; {new Date().getFullYear()} Sepio Corp. All rights reserved. Shikola Timetable Creator,
                its source code, compiled binaries, user interface, and documentation are the exclusive intellectual
                property of Sepio Corp.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="text-sm text-slate-600">
              <p className="font-semibold text-slate-700">Warranty Disclaimer</p>
              <p className="text-xs mt-1">
                THE SOFTWARE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND. Sepio Corp is not liable for any
                damages arising from the use of this software.
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
          <Badge color="blue">Proprietary</Badge>
          <Badge color="slate">Sepio Corp</Badge>
          <Badge color="green">Offline</Badge>
        </div>
      </Card>

      {/* Changelog */}
      <Card className="p-6 mb-6">
        <h3 className="text-sm font-bold text-slate-700 mb-4">Changelog</h3>
        <ChangelogList />
      </Card>

      {/* Footer */}
      <div className="text-center py-6">
        <p className="text-xs text-slate-400">&copy; {new Date().getFullYear()} Sepio Corp. All rights reserved.</p>
        <p className="text-xs text-slate-300 mt-1">Made with care for educators worldwide.</p>
      </div>
    </div>
  )
}
