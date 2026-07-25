# Changelog

All notable changes to **Shikola Timetable Creator** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/) and this project adheres to [Semantic Versioning](https://semver.org/).

---

## [1.2.0] — Sunshine — 2026-07-25

### Added
- Automatic updates: new releases are now checked, downloaded, and optionally installed without manual interaction
- Background install option installs downloaded updates automatically when you quit the app
- Optional auto-restart with a 60-second countdown before installing and relaunching
- New Updates preferences in Settings → About to control automatic checks, background install, and auto-restart

### Changed
- Periodic update checks now run automatically every 60 minutes while the app is open

---

## [1.1.0] — Eclipse — 2026-07-22

### Added
- Complete UI redesign with modern styling, new fonts (Nunito, Varela Round, Inter), and smooth animations
- Dark mode support with system-aware theming
- Detects Shikola Management System installation — bypasses entity and storage limits when installed

### Changed
- Lock screen now auto-unlocks when limits are no longer exceeded
- Redesigned sidebar, dashboard, and all management pages for a cleaner experience
- About page now displays the version codename alongside the version number

### Removed
- Pupils page and all related code for a streamlined experience

---

## [1.0.8] — Titan — 2026-07-20

### Changed
- Added in-memory data caching — subsequent app loads and page navigations are now instant with no loading states
- Removed artificial 2-second loading delays from all 15 pages for near-instant page transitions
- Splash screen now only shows on first launch; skipped on subsequent loads

---

## [1.0.7] — Titan — 2026-07-19

### Added
- Command Palette (Ctrl+K) for instant navigation to any page, teacher, class, subject, or room
- All pages now accessible via routing — Rooms, Pupils, Print Preview, Teacher Constraints, Card Relationships, Timetable Verification, Statistics, Substitutions, Backup & Restore, Lesson Groups, Subject Assignments, and Compare Timetables

### Changed
- Increased storage limit from 15 MB to 50 MB for larger datasets

---

## [1.0.6] — Monster — 2026-07-17

### Added
- Break periods now included in all PDF and Excel exports (single, master, and bulk) with distinct gray styling
- Rich text formatting for multi-line cells in Excel exports (bold first line, smaller subsequent lines)

### Changed
- Subject name is now displayed first (before class/teacher) across all timetable views for consistency
- Increased font size and weight of subject names in Timetable Editor, Print Preview, and View Timetables for better readability
- Fixed column ordering in CSV/Excel exports (Subject, Teacher, Class instead of Teacher, Class, Subject)
- Adjusted column widths in Excel exports for better layout

---

## [1.0.5] — Monster — 2026-07-15

### Added
- In-app update checking via GitHub Releases (Help → Check for Updates)
- Automated release publishing script for distributing new versions

### Changed
- Update modal now shows release notes and download link when a newer version is available

---

## [1.0.4] — Guardian — 2026-07-13

### Added
- In-app Changelog / What's New dialog that appears automatically after each update
- Changelog section in the About page (accessible from Help → About and Settings → About)
- Changelog section in Settings → About tab
- CHANGELOG.md file in project root for developer reference

### Changed
- Version badge in About and Settings now reflects the current app version dynamically (was hardcoded to 1.0.0)

---

## [1.0.3] — Guardian — 2026-07-10

### Added
- Storage limit monitoring (100 MB) with warning banner and telemetry notifications
- Optional telemetry: analytics, crash reporting, and registration info sent to Sepio Corp
- Installer consent flow for telemetry opt-in during setup

### Changed
- Improved NSIS installer settings for smoother app upgrades

---

## [1.0.2] — Guardian — 2026-07-05

### Added
- Sections feature supporting multiple school units (Primary, Secondary) with sessions (Morning, Afternoon, Full Day)
- Classes can be assigned to sections and inherit per-section schedules and period times
- Session badges in Settings, ManageClasses, and ViewTimetables

### Changed
- Smart timetable generator now respects per-section schedules via `getScheduleForClass()`

---

## [1.0.1] — Bellybean — 2026-06-28

### Added
- Success toast notifications for save actions
- PDF export with master grid layout
- Academic period management in Settings (week, term, quarter, semester, full year)
- Loading skeleton states across pages for better UX

### Changed
- Improved Settings with period management and enhanced layout

---

## [1.0.0] — Bellybean — 2026-06-20

### Added
- Timetable editor with automatic conflict detection
- Smart auto-generate timetables for single or all classes
- Export timetables as PDF or CSV (A4–A1 paper sizes, bulk export)
- Teacher management with subject assignments and max period limits
- Customizable colors, themes, and school branding with logo upload
- Backup & restore, departments, lesson groups, statistics, substitutions
- Teacher constraints, timetable verification, and print preview
- Fully offline — all data stored locally on device
