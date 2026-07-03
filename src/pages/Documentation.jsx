import React, { useState } from 'react'
import { Card, PageHeader, Badge, Tabs } from '../components/UI.jsx'

export default function Documentation() {
  const [tab, setTab] = useState('getting-started')

  const sections = [
    { id: 'getting-started', label: 'Getting Started' },
    { id: 'user-guide', label: 'User Guide' },
    { id: 'license', label: 'License & Copyright' },
    { id: 'privacy', label: 'Privacy' },
  ]

  return (
    <div className="p-4 md:p-8">
      <PageHeader title="Documentation" subtitle="Guides, license, and legal information" />

      <Tabs tabs={sections} active={tab} onChange={setTab} />

      <div className="mt-6">
        {tab === 'getting-started' && <GettingStarted />}
        {tab === 'user-guide' && <UserGuide />}
        {tab === 'license' && <LicenseSection />}
        {tab === 'privacy' && <PrivacySection />}
      </div>
    </div>
  )
}

function GettingStarted() {
  const steps = [
    { num: 1, title: 'Install the Application', desc: 'Download and run the installer. Read and accept the End User License Agreement (EULA) during installation. Choose your installation directory and complete the setup.' },
    { num: 2, title: 'Complete the Setup Wizard', desc: 'On first launch, enter your school name, address, and optionally upload a school logo. This information appears on exported timetables.' },
    { num: 3, title: 'Add Teachers', desc: 'Navigate to Manage Teachers and add your teaching staff. Assign subjects to each teacher and set their maximum periods per day.' },
    { num: 4, title: 'Create Classes', desc: 'Go to Manage Classes and create your school\'s classes. Assign subjects to each class with the required number of periods per week.' },
    { num: 5, title: 'Define Subjects & Rooms', desc: 'Set up subjects with color coding for visual distinction. Add available rooms for timetable assignments.' },
    { num: 6, title: 'Generate Timetables', desc: 'Use Smart Generate to automatically create conflict-free timetables, or use the Timetable Editor for manual control.' },
    { num: 7, title: 'View & Export', desc: 'View your generated timetables and export them as PDF or CSV in various paper sizes.' },
  ]

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h3 className="text-sm font-bold text-slate-700 mb-4">Welcome to Shikola Timetable Creator</h3>
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          Shikola Timetable Creator is an offline desktop application for schools to create, manage, and export
          professional timetables. Follow the steps below to get started.
        </p>
      </Card>

      {steps.map(step => (
        <Card key={step.num} className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
              {step.num}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{step.title}</p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{step.desc}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

function UserGuide() {
  const guides = [
    {
      title: 'Smart Generate',
      icon: 'M13 10V3L4 14h7v7l9-11h-7z',
      desc: 'Automatically generate conflict-free timetables for a single class or all classes. The algorithm assigns teachers and rooms while respecting constraints like maximum periods, subject distribution, and teacher availability.',
      tips: [
        'Ensure all teachers have subjects assigned before generating',
        'Set maximum periods per teacher to avoid overbooking',
        'Generate for all classes at once or one at a time',
        'Review generated timetables in the Timetable Editor for manual adjustments',
      ],
    },
    {
      title: 'Timetable Editor',
      icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      desc: 'Manually create or edit timetables with real-time conflict detection. Drag and drop subjects into time slots, and the editor will warn you of any teacher or room conflicts.',
      tips: [
        'Conflicts are highlighted in red — resolve them before exporting',
        'Click a cell to add or edit a subject for that period',
        'Use the class selector to switch between different class timetables',
        'Changes are saved automatically to local storage',
      ],
    },
    {
      title: 'Export & Print',
      icon: 'M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z',
      desc: 'Export timetables as PDF or CSV files. Choose from multiple paper sizes (A4, A3, A2, A1) and export individual or all timetables at once.',
      tips: [
        'PDF exports include your school name and logo',
        'CSV exports can be opened in Excel or Google Sheets',
        'Use bulk export to generate all timetables in one click',
        'Print directly from the View Timetables page',
      ],
    },
    {
      title: 'Backup & Restore',
      icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
      desc: 'Export all your data as a JSON backup file and restore it on any device. This is useful for transferring data between computers or recovering from data loss.',
      tips: [
        'Create regular backups to prevent data loss',
        'Store backup files on an external drive or cloud storage',
        'Importing a backup replaces all current data',
        'Backups include all teachers, classes, subjects, rooms, and timetables',
      ],
    },
    {
      title: 'Bulk Import',
      icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
      desc: 'Import teachers, classes, subjects, and rooms in bulk using CSV files. This saves time when setting up the application for the first time.',
      tips: [
        'Download the CSV template from the import modal',
        'Ensure column headers match the template exactly',
        'Duplicate entries are skipped during import',
        'You can import multiple times — existing data is preserved',
      ],
    },
    {
      title: 'Settings & Customization',
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
      desc: 'Customize the application appearance with primary and accent colors, toggle sound effects, and manage data backups from the Settings page.',
      tips: [
        'Color changes apply instantly across the application',
        'Disable sound effects if you prefer a silent experience',
        'Export your data before making major changes',
        'Settings are saved locally and persist between sessions',
      ],
    },
  ]

  return (
    <div className="space-y-4">
      {guides.map(guide => (
        <Card key={guide.title} className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={guide.icon} />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-800">{guide.title}</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{guide.desc}</p>
              <div className="mt-3 space-y-1">
                {guide.tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <svg className="w-3.5 h-3.5 text-brand-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs text-slate-500">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

function LicenseSection() {
  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <svg className="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-sm font-bold text-slate-700">License Information</h3>
        </div>

        <div className="space-y-4 text-sm text-slate-600">
          <div>
            <p className="font-semibold text-slate-700 mb-1">Software License</p>
            <p className="text-xs leading-relaxed">
              Shikola Timetable Creator is proprietary software licensed by Sepio Corp. The software is licensed,
              not sold. You are granted a non-exclusive, non-transferable right to use the software within a
              single educational institution.
            </p>
          </div>

          <div>
            <p className="font-semibold text-slate-700 mb-1">Permitted Use</p>
            <ul className="text-xs space-y-1 ml-4 list-disc">
              <li>Install and use the software on any number of devices within your school</li>
              <li>Make backup copies for archival purposes</li>
              <li>Export and import your own data freely</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-slate-700 mb-1">Prohibited Actions</p>
            <ul className="text-xs space-y-1 ml-4 list-disc">
              <li>Copy, distribute, or sublicense the software to third parties</li>
              <li>Reverse engineer, decompile, or disassemble the software</li>
              <li>Rent, lease, or lend the software</li>
              <li>Remove or alter copyright notices</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-slate-700 mb-1">Warranty Disclaimer</p>
            <p className="text-xs leading-relaxed">
              THE SOFTWARE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND. Sepio Corp is not liable for any
              damages arising from the use of this software.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <svg className="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <h3 className="text-sm font-bold text-slate-700">Copyright Notice</h3>
        </div>
        <div className="text-sm text-slate-600 space-y-3">
          <p className="text-xs leading-relaxed">
            Copyright &copy; {new Date().getFullYear()} Sepio Corp. All rights reserved.
          </p>
          <p className="text-xs leading-relaxed">
            Shikola Timetable Creator, its source code, compiled binaries, user interface, documentation, and all
            associated materials are the exclusive intellectual property of Sepio Corp. The software is protected
            by copyright laws and international copyright treaties.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Badge color="blue">Version 1.0.0</Badge>
            <Badge color="slate">Proprietary License</Badge>
            <Badge color="green">Sepio Corp</Badge>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <svg className="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <h3 className="text-sm font-bold text-slate-700">Contact</h3>
        </div>
        <div className="text-sm text-slate-600">
          <p className="text-xs">For licensing inquiries, support, or questions:</p>
          <p className="text-xs font-semibold mt-2">Sepio Corp</p>
          <p className="text-xs text-slate-500">Email: sepiopixel@gmail.com</p>
        </div>
      </Card>
    </div>
  )
}

function PrivacySection() {
  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-sm font-bold text-slate-700">Local Storage</h3>
        </div>
        <div className="text-sm text-slate-600 space-y-3">
          <p className="text-xs leading-relaxed">
            All your core data is stored locally on your device. This includes school information, teachers,
            classes, subjects, rooms, timetables, and application settings. You can export backups as JSON files
            and import them on any device.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-green-800 mb-2">What stays on your device:</p>
            <ul className="text-xs text-green-700 space-y-1 ml-4 list-disc">
              <li>School information and logo</li>
              <li>Teacher records and subject assignments</li>
              <li>Class details and subject configurations</li>
              <li>Room information</li>
              <li>All generated timetables</li>
              <li>Application settings and preferences</li>
            </ul>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <svg className="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-sm font-bold text-slate-700">Optional Telemetry & Analytics</h3>
        </div>
        <div className="text-sm text-slate-600 space-y-3">
          <p className="text-xs leading-relaxed">
            Shikola Timetable Creator includes telemetry features that are <strong>enabled by default</strong> to
            help Sepio Corp improve the application and provide better support. You can disable any feature
            during setup or in Settings &rarr; Privacy & Telemetry at any time.
          </p>

          <div className="bg-brand-50 border border-brand-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-brand-800 mb-2">Registration (Opt-In)</p>
            <p className="text-xs text-brand-700 leading-relaxed">
              When enabled, sends your school name, phone number, email address, address, and IP address to
              Sepio Corp so we know which schools are using our application. This helps us provide better
              support and track adoption.
            </p>
          </div>

          <div className="bg-brand-50 border border-brand-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-brand-800 mb-2">Anonymous Analytics (Opt-In)</p>
            <p className="text-xs text-brand-700 leading-relaxed">
              When enabled, sends anonymous event data such as "timetable generated", "PDF exported", or
              "page viewed". No personal data or school information is included — only event names, a random
              session ID, app version, and OS info.
            </p>
          </div>

          <div className="bg-brand-50 border border-brand-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-brand-800 mb-2">Crash Reporting (Opt-In)</p>
            <p className="text-xs text-brand-700 leading-relaxed">
              When enabled, automatically sends error reports when the application crashes. Reports include
              error type, message, stack trace, system information (OS, app version), and IP address. This
              helps us diagnose and fix bugs faster.
            </p>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            You can enable or disable any of these options at any time in
            Settings &rarr; Privacy & Telemetry. Disabling an option immediately stops data transmission
            for that feature. Your consent choices are stored locally and persist between sessions.
          </p>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <svg className="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <h3 className="text-sm font-bold text-slate-700">Backup Responsibility</h3>
        </div>
        <div className="text-sm text-slate-600">
          <p className="text-xs leading-relaxed">
            Since all core data is stored locally, you are responsible for maintaining your own backups. We
            strongly recommend regularly exporting your data as a JSON backup file from
            Settings &rarr; Data &rarr; Export Backup. Store backup files on an external drive or cloud
            storage service of your choice.
          </p>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 className="text-sm font-bold text-slate-700">Data Usage & Sharing</h3>
        </div>
        <div className="text-sm text-slate-600 space-y-2">
          <p className="text-xs leading-relaxed">
            Data sent via telemetry features is used by Sepio Corp solely for product improvement, bug fixing,
            and user support. Your data is <strong>never sold or shared with third parties</strong>.
          </p>
          <p className="text-xs leading-relaxed">
            If you disable all telemetry options, the application makes no network requests and operates
            completely offline.
          </p>
        </div>
      </Card>
    </div>
  )
}
