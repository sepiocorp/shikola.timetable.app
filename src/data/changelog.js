export const APP_VERSION = '1.0.7'

export const CHANGELOG = [
  {
    version: '1.0.7',
    codename: 'Titan',
    date: '2026-07-19',
    title: 'What\'s New in v1.0.7',
    changes: [
      { type: 'feature', text: 'Added Command Palette (Ctrl+K) for instant navigation to any page, teacher, class, subject, or room' },
      { type: 'feature', text: 'All pages now accessible via routing — Rooms, Pupils, Print Preview, Teacher Constraints, Card Relationships, Timetable Verification, Statistics, Substitutions, Backup & Restore, Lesson Groups, Subject Assignments, and Compare Timetables' },
      { type: 'improvement', text: 'Increased storage limit from 15 MB to 50 MB for larger datasets' },
    ],
  },
  {
    version: '1.0.6',
    codename: 'Monster',
    date: '2026-07-17',
    title: 'What\'s New in v1.0.6',
    changes: [
      { type: 'feature', text: 'Break periods now included in all PDF and Excel exports (single, master, and bulk) with distinct gray styling' },
      { type: 'feature', text: 'Rich text formatting for multi-line cells in Excel exports (bold first line, smaller subsequent lines)' },
      { type: 'improvement', text: 'Subject name is now displayed first (before class/teacher) across all timetable views for consistency' },
      { type: 'improvement', text: 'Increased font size and weight of subject names in Timetable Editor, Print Preview, and View Timetables for better readability' },
      { type: 'fix', text: 'Fixed column ordering in CSV/Excel exports (Subject, Teacher, Class instead of Teacher, Class, Subject)' },
      { type: 'improvement', text: 'Adjusted column widths in Excel exports for better layout' },
    ],
  },
  {
    version: '1.0.5',
    codename: 'Monster',
    date: '2026-07-15',
    title: 'What\'s New in v1.0.5',
    changes: [
      { type: 'feature', text: 'Added in-app update checking via GitHub Releases (Help → Check for Updates)' },
      { type: 'feature', text: 'Added automated release publishing script for distributing new versions' },
      { type: 'improvement', text: 'Update modal now shows release notes and download link when a newer version is available' },
    ],
  },
  {
    version: '1.0.4',
    codename: 'Guardian',
    date: '2026-07-13',
    title: 'What\'s New in v1.0.4',
    changes: [
      { type: 'feature', text: 'Added an in-app Changelog / What\'s New dialog that appears automatically after each update' },
      { type: 'feature', text: 'Added a Changelog section to the About page so users can review past updates at any time' },
      { type: 'feature', text: 'Added a CHANGELOG.md file to the project root for developer reference' },
      { type: 'improvement', text: 'Version badge in About now reflects the current app version dynamically' },
    ],
  },
  {
    version: '1.0.3',
    codename: 'Galaxy',
    date: '2026-07-10',
    title: 'What\'s New in v1.0.3',
    changes: [
      { type: 'feature', text: 'Added storage limit monitoring (15 MB) with warning banner and telemetry notifications' },
      { type: 'feature', text: 'Added optional telemetry: analytics, crash reporting, and registration info sent to Sepio Corp' },
      { type: 'feature', text: 'Added installer consent flow for telemetry opt-in during setup' },
      { type: 'improvement', text: 'Improved NSIS installer settings for smoother app upgrades' },
    ],
  },
  {
    version: '1.0.2',
    codename: 'Gummy Bear',
    date: '2026-07-05',
    title: 'What\'s New in v1.0.2',
    changes: [
      { type: 'feature', text: 'Added Sections feature supporting multiple school units (Primary, Secondary) with sessions (Morning, Afternoon, Full Day)' },
      { type: 'feature', text: 'Classes can be assigned to sections and inherit per-section schedules and period times' },
      { type: 'feature', text: 'Session badges appear in Settings, ManageClasses, and ViewTimetables' },
      { type: 'improvement', text: 'Smart timetable generator now respects per-section schedules' },
    ],
  },
  {
    version: '1.0.1',
    codename: 'Bellybean',
    date: '2026-06-28',
    title: 'What\'s New in v1.0.1',
    changes: [
      { type: 'feature', text: 'Added success toast notifications for save actions' },
      { type: 'feature', text: 'Added PDF export with master grid layout' },
      { type: 'feature', text: 'Added academic period management in Settings (week, term, quarter, semester, full year)' },
      { type: 'improvement', text: 'Added loading skeleton states across pages for better UX' },
      { type: 'improvement', text: 'Improved Settings with period management and enhanced layout' },
    ],
  },
  {
    version: '1.0.0',
    codename: 'Bellybean',
    date: '2026-06-20',
    title: 'Initial Release — v1.0.0',
    changes: [
      { type: 'feature', text: 'Timetable editor with automatic conflict detection' },
      { type: 'feature', text: 'Smart auto-generate timetables for single or all classes' },
      { type: 'feature', text: 'Export timetables as PDF or CSV (A4–A1 paper sizes, bulk export)' },
      { type: 'feature', text: 'Teacher management with subject assignments and max period limits' },
      { type: 'feature', text: 'Customizable colors, themes, and school branding with logo upload' },
      { type: 'feature', text: 'Backup & restore, departments, lesson groups, statistics, substitutions' },
      { type: 'feature', text: 'Teacher constraints, timetable verification, and print preview' },
      { type: 'feature', text: 'Fully offline — all data stored locally on device' },
    ],
  },
]

export const CHANGELOG_ICONS = {
  feature: 'M13 10V3L4 14h7v7l9-11h-7z',
  improvement: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
  fix: 'M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.88-5.881M11.42 15.17l-5.88-5.881A2.652 2.652 0 019.67 4.5h.01M11.42 15.17l-1.41-1.41M9.68 4.54L4.5 9.72',
}

export const CHANGELOG_COLORS = {
  feature: 'text-brand-600 bg-brand-50',
  improvement: 'text-amber-600 bg-amber-50',
  fix: 'text-green-600 bg-green-50',
}
