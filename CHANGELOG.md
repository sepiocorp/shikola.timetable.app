# Changelog

All notable changes to **Shikola Timetable Creator** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/) and this project adheres to [Semantic Versioning](https://semver.org/).

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
