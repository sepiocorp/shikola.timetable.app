# Shikola Timetable - Feature Implementation Plan

## Features Extracted from aSc Timetables Analysis

### Phase 1: Core Scheduling Enhancements
- [x] 1. Teacher Time Off Grid — Per-teacher availability matrix (which periods they can/can't teach) — `TeacherConstraints.jsx`
- [x] 2. Teacher Constraints — Max windows/gaps per week, max consecutive periods, max/min lessons per day, max teaching days — `TeacherConstraints.jsx`
- [x] 3. Double/Triple Lessons — Lesson length variants (single, double, triple, short) — state `lessonTypes`, entries track `lessonLength`
- [x] 4. Card Relationships — Rules between subjects: must be same day, must be consecutive, can't be same day, distribution rules — `CardRelationships.jsx`
- [x] 5. Card Lock/Unlock — Lock placed cards so generator doesn't move them — `lockedEntries` state, generator preserves locked entries

### Phase 2: Class & Lesson Management
- [x] 6. Lesson Divisions/Groups — Split a class into groups (e.g., Boys/Girls, Advanced/Beginners) with different lessons per group — `LessonGroups.jsx`
- [x] 7. Joint Classes — Combine multiple classes for a single lesson — state `jointClasses`, generator supports `secondaryClassId`
- [x] 8. Multiple Teachers per Lesson — Support up to 4 teachers per lesson — entries support `secondaryTeacherId`, conflict checking active
- [x] 9. Classroom Assignment — Home classroom, shared rooms, permitted classrooms per lesson — `ManageRooms.jsx` with room types & shared flags
- [x] 10. Multi-Week Cycles — 2-week, 3-week, 4-week, 5-week timetable cycles — Settings advanced tab, `multiWeekCycle` state

### Phase 3: Verification & Statistics
- [x] 11. Timetable Verification — Test if spec is valid before generating; verify generated timetable meets all constraints — `TimetableVerification.jsx`
- [x] 12. Statistics Dashboard — Windows/gaps analysis, teacher load, misplaced cards, minutes taught — `Statistics.jsx`
- [x] 13. Compare Timetables — Compare current with saved version or another file — `CompareTimetables.jsx` (tab in View Timetables)

### Phase 4: Substitutions & Supervision
- [x] 14. Substitutions Management — Track absent teachers, assign substitutes with criteria — `Substitutions.jsx`
- [x] 15. Room Supervision — Assign supervision duties for rooms — tab in ManageRooms (Departments tab)
- [x] 16. Overtime Tracking — Track overtime lessons per teacher — section in Statistics page

### Phase 5: Export & Print
- [x] 17. Print Preview — WYSIWYG preview before printing — `PrintPreview.jsx`
- [x] 18. HTML Export — Export timetables as HTML for web publishing — `utils/htmlExport.js`
- [x] 19. Excel Export — Export all data to MS Excel — `utils/export.js` with exceljs
- [x] 20. Custom Fields on Cards — Custom text printed on timetable cells — Settings customFields tab
- [x] 21. Wall Poster Print — Multi-page poster layout (e.g., 5x4 A4 pages) — PrintPreview poster mode

### Phase 6: Advanced Features
- [x] 22. Lunch Break Constraints — Enforce lunch break in specific interval — Settings advanced tab, `lunchConstraint` state
- [x] 23. Education Blocks — Block scheduling for consecutive periods — Settings education tab
- [x] 24. Building Management — Multiple buildings, transit time between buildings — Settings advanced tab, `buildings` state
- [x] 25. Pupils/Seminars — Pupil management, seminar groups, pupil subject picks — `Pupils.jsx`
- [x] 26. Backup/Restore — Full data backup and restore — `BackupRestore.jsx` (embedded in Settings)
- [x] 27. Auto-Relaxation — Auto-relax constraints if timetable can't be generated — `autoRelax` state, generator supports it
- [x] 28. Multi-Language Support — Support multiple UI languages — Settings language selector (en/sw/fr), `language` state
- [ ] 29. Online Sharing — Publish timetables online (future — offline desktop app)
- [ ] 30. Database Sync — Server synchronization (future — offline desktop app)

## Implementation Notes
- All features follow existing UI patterns: Card, Modal, Button, Input, Select, Badge, Toggle, Tabs, ProgressBar
- State managed via AppContext reducer with localStorage persistence
- Generator in utils/generate.js enhanced for constraints, time-off, card relationships, auto-relax, subject assignments
- Sidebar navigation updated for new pages

## Implemented: Multi-Unit & Session Support
- [x] School Sections with session types (Morning, Afternoon, Full Day)
- [x] Each section has its own days, period schedule, and session-based default start times
- [x] Classes assigned to sections inherit the section's schedule
- [x] Session badges shown in Settings sections list, ManageClasses cards, and ViewTimetables filters
- [x] Section dropdowns show session type (e.g., "Primary (Morning)")
- [x] Timetable generation respects per-section schedules via getScheduleForClass()

## Wiring Status (pages embedded as tabs within main pages)
- [x] TeacherConstraints → tab in Teachers
- [x] Substitutions → tab in Teachers
- [x] SubjectAssignments → tab in Classes
- [x] LessonGroups → tab in Classes
- [x] Pupils → tab in Classes
- [x] CardRelationships → tab in Subjects
- [x] ManageRooms (with Room Supervision tab) → tab in Departments
- [x] TimetableVerification → tab in Smart Generate
- [x] PrintPreview (with Wall Poster mode) → tab in View Timetables
- [x] Statistics (with Overtime Tracking) → tab in View Timetables
- [x] CompareTimetables → tab in View Timetables
- [x] Education Blocks → tab in Settings
- [x] Custom Fields → tab in Settings
