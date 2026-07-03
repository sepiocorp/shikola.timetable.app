# Shikola Timetable Creator

**Offline timetable creator for schools** — by Sepio Corp

Copyright &copy; 2026 Sepio Corp. All rights reserved.

---

## Overview

Shikola Timetable Creator is a powerful, offline-first desktop application designed to help schools create, manage, and export professional timetables with ease. It provides automatic conflict detection, smart timetable generation, and flexible export options — all without requiring an internet connection.

## Features

- **Timetable Editor** — Create and edit class timetables with automatic conflict detection
- **Auto-Generate** — Automatically generate timetables for single or all classes with smart teacher and room assignment
- **Export & Print** — Export timetables as PDF or CSV in multiple paper sizes (A4–A1) with bulk export support
- **Teacher Management** — Manage teachers with subject assignments and maximum period limits
- **Customization** — Customize colors, themes, display options, and school branding with logo upload
- **Academic Periods** — Organize timetables by week, term, quarter, semester, or full academic year
- **Bulk Import** — Import teachers, classes, subjects, and rooms via CSV files

## Data Privacy

All core data — school information, teachers, classes, subjects, rooms, and timetables — is stored **100% locally** on your device. You can export backups as JSON files and import them on any device.

### Telemetry (Enabled by Default)

The app includes telemetry features that are **enabled by default** to help Sepio Corp improve the application and provide better support. By accepting the EULA during installation, you consent to the following data collection:

- **School Registration** — Sends school name, phone, email, address, and IP address to Sepio Corp so we know which schools use our application
- **Anonymous Analytics** — Sends non-identifiable event data (e.g., "timetable generated", "PDF exported") to help us understand feature usage. No personal data is included
- **Crash Reporting** — Automatically sends error reports (error type, message, stack trace, system info, IP address) when the app crashes, helping us fix bugs faster

You can disable any or all telemetry features at any time in Settings → Privacy & Telemetry. Data is never sold or shared with third parties.

## Tech Stack

- React 18
- Electron
- Vite
- Tailwind CSS
- jsPDF (PDF export)
- PapaParse (CSV import/export)
- ExcelJS (Excel export)

## Installation

### Download the Installer

1. Download the latest installer from the releases page.
2. Run the installer (`Shikola Timetable Creator Setup.exe`).
3. Read and accept the End User License Agreement (EULA) presented during installation.
4. Choose your installation directory (or use the default).
5. Complete the installation and launch the application.

### Portable Version

A portable version (`Shikola Timetable Creator.exe`) is also available for users who prefer not to install the application. Simply extract and run the executable.

## Usage

1. **First Launch** — Complete the setup wizard by entering your school information and optionally uploading a logo.
2. **Manage Teachers** — Add teachers and assign subjects with maximum period limits.
3. **Manage Classes** — Create classes and assign subjects to each class.
4. **Manage Subjects** — Define subjects with color coding for visual distinction.
5. **Manage Rooms** — Add available rooms for timetable assignments.
6. **Smart Generate** — Automatically generate timetables with conflict-free teacher and room assignments.
7. **Timetable Editor** — Manually create or adjust timetables with real-time conflict detection.
8. **View Timetables** — View generated timetables and export them as PDF or CSV.
9. **Settings** — Customize appearance, colors, sounds, and manage data backups.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` | Undo last action |
| `Ctrl+Y` | Redo |
| `Ctrl+C` | Copy |
| `Ctrl+V` | Paste |
| `Ctrl+A` | Select All |

## Backup & Restore

- **Export Backup**: Go to Settings &rarr; Backup &rarr; Export to save all data as a JSON file.
- **Import Backup**: Go to Settings &rarr; Backup &rarr; Import to restore data from a previously exported JSON file.

## License

This software is proprietary. See the [LICENSE](./LICENSE) file for the full license text.

The End User License Agreement (EULA) is presented during installation and is also available at `build/license.txt`.

## Copyright

Copyright &copy; 2026 Sepio Corp. All rights reserved.

This software is the intellectual property of Sepio Corp. Unauthorized copying, distribution, modification, or reverse engineering of this software is strictly prohibited.

## Contact

**Sepio Corp**

Email: sepiopixel@gmail.com

## Disclaimer

THE SOFTWARE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND. Sepio Corp is not liable for any damages arising from the use of this software. Users are responsible for maintaining their own data backups.
