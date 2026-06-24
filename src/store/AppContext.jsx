import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'shikola-timetable-data'

const defaultData = {
  school: null,
  settings: {
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    periods: [
      { id: 1, name: 'Period 1', start: '08:00', end: '08:40' },
      { id: 2, name: 'Period 2', start: '08:40', end: '09:20' },
      { id: 3, name: 'Period 3', start: '09:20', end: '10:00' },
      { id: 4, name: 'Break', start: '10:00', end: '10:20', isBreak: true },
      { id: 5, name: 'Period 4', start: '10:20', end: '11:00' },
      { id: 6, name: 'Period 5', start: '11:00', end: '11:40' },
      { id: 7, name: 'Lunch', start: '11:40', end: '12:20', isBreak: true },
      { id: 8, name: 'Period 6', start: '12:20', end: '13:00' },
      { id: 9, name: 'Period 7', start: '13:00', end: '13:40' },
      { id: 10, name: 'Period 8', start: '13:40', end: '14:20' },
    ],
  },
  appearance: {
    primaryColor: '#2563eb',
    accentColor: '#3b82f6',
    showSchoolHeader: true,
    showTeacherInCell: true,
    showRoomInCell: true,
    cellFontSize: 'auto',
    tableTheme: 'striped',
    soundEnabled: true,
  },
  academicPeriods: [],
  activePeriodId: null,
  sections: [],
  teachers: [],
  classes: [],
  subjects: [],
  rooms: [],
  timetable: [],
  lastDeleted: null,
  storageWarning: null,
  telemetry: {
    registered: true,
    analyticsEnabled: true,
    crashReportingEnabled: true,
    registrationConsent: true,
    consentTimestamp: null,
  },
}

export function getScheduleForClass(state, classId) {
  const cls = state.classes.find(c => c.id === classId)
  if (cls?.sectionId) {
    const section = state.sections.find(s => s.id === cls.sectionId)
    if (section) return { days: section.days, periods: section.periods }
  }
  return { days: state.settings.days, periods: state.settings.periods }
}

export const PERIOD_TYPES = {
  week: { label: 'Weekly', weeks: 1, description: '1 week timetable' },
  term: { label: 'Term', weeks: 13, description: '~13 weeks (one term)' },
  quarter: { label: 'Quarter', weeks: 10, description: '~10 weeks (one quarter)' },
  semester: { label: 'Semester', weeks: 20, description: '~20 weeks (one semester)' },
  year: { label: 'Full Year', weeks: 40, description: '~40 weeks (full academic year)' },
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { ...defaultData, ...parsed }
    }
  } catch (e) {
    console.error('Failed to load data:', e)
  }
  return defaultData
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_SCHOOL':
      return { ...state, school: action.payload }

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } }

    case 'ADD_TEACHER':
      return { ...state, teachers: [...state.teachers, { ...action.payload, id: genId() }] }

    case 'BULK_ADD_TEACHERS':
      return { ...state, teachers: [...state.teachers, ...action.payload.map(t => ({ ...t, id: genId() }))] }

    case 'UPDATE_TEACHER':
      return {
        ...state,
        teachers: state.teachers.map(t => t.id === action.payload.id ? { ...t, ...action.payload } : t),
      }

    case 'DELETE_TEACHER': {
      const deleted = state.teachers.find(t => t.id === action.payload)
      const deletedEntries = state.timetable.filter(e => e.teacherId === action.payload)
      return {
        ...state,
        teachers: state.teachers.filter(t => t.id !== action.payload),
        timetable: state.timetable.filter(e => e.teacherId !== action.payload),
        lastDeleted: { type: 'teacher', data: deleted, timetableEntries: deletedEntries },
      }
    }

    case 'ADD_CLASS':
      return { ...state, classes: [...state.classes, { ...action.payload, id: genId() }] }

    case 'BULK_ADD_CLASSES':
      return { ...state, classes: [...state.classes, ...action.payload.map(c => ({ ...c, id: genId() }))] }

    case 'UPDATE_CLASS':
      return {
        ...state,
        classes: state.classes.map(c => c.id === action.payload.id ? { ...c, ...action.payload } : c),
      }

    case 'DELETE_CLASS': {
      const deleted = state.classes.find(c => c.id === action.payload)
      const deletedEntries = state.timetable.filter(e => e.classId === action.payload)
      return {
        ...state,
        classes: state.classes.filter(c => c.id !== action.payload),
        timetable: state.timetable.filter(e => e.classId !== action.payload),
        lastDeleted: { type: 'class', data: deleted, timetableEntries: deletedEntries },
      }
    }

    case 'ADD_SUBJECT':
      return { ...state, subjects: [...state.subjects, { ...action.payload, id: genId() }] }

    case 'BULK_ADD_SUBJECTS':
      return { ...state, subjects: [...state.subjects, ...action.payload.map(s => ({ ...s, id: genId() }))] }

    case 'UPDATE_SUBJECT':
      return {
        ...state,
        subjects: state.subjects.map(s => s.id === action.payload.id ? { ...s, ...action.payload } : s),
      }

    case 'DELETE_SUBJECT':
      return {
        ...state,
        subjects: state.subjects.filter(s => s.id !== action.payload),
      }

    case 'ADD_ROOM':
      return { ...state, rooms: [...state.rooms, { ...action.payload, id: genId() }] }

    case 'UPDATE_ROOM':
      return {
        ...state,
        rooms: state.rooms.map(r => r.id === action.payload.id ? { ...r, ...action.payload } : r),
      }

    case 'DELETE_ROOM': {
      const deleted = state.rooms.find(r => r.id === action.payload)
      const deletedEntries = state.timetable.filter(e => e.roomId !== action.payload)
      return {
        ...state,
        rooms: state.rooms.filter(r => r.id !== action.payload),
        timetable: state.timetable.filter(e => e.roomId !== action.payload),
        lastDeleted: { type: 'room', data: deleted, timetableEntries: deletedEntries },
      }
    }

    case 'SET_TIMETABLE_ENTRY': {
      const { day, periodId, teacherId, classId, subjectId, roomId, secondaryClassId, secondarySubjectId, secondaryTeacherId } = action.payload
      const existing = state.timetable.find(
        e => e.day === day && e.periodId === periodId && e.classId === classId
      )
      if (existing) {
        return {
          ...state,
          timetable: state.timetable.map(e =>
            e.id === existing.id
              ? { ...e, teacherId, subjectId, roomId, secondaryClassId: secondaryClassId || '', secondarySubjectId: secondarySubjectId || '', secondaryTeacherId: secondaryTeacherId || '' }
              : e
          ),
        }
      }
      return {
        ...state,
        timetable: [...state.timetable, { id: genId(), day, periodId, teacherId, classId, subjectId, roomId, secondaryClassId: secondaryClassId || '', secondarySubjectId: secondarySubjectId || '', secondaryTeacherId: secondaryTeacherId || '' }],
      }
    }

    case 'DELETE_TIMETABLE_ENTRY':
      return {
        ...state,
        timetable: state.timetable.filter(e => e.id !== action.payload),
      }

    case 'CLEAR_TIMETABLE': {
      const cleared = [...state.timetable]
      return { ...state, timetable: [], lastDeleted: { type: 'timetable', data: null, timetableEntries: cleared } }
    }

    case 'GENERATE_TIMETABLE': {
      const { entries, classIds } = action.payload
      const otherEntries = state.timetable.filter(e => !classIds.includes(e.classId))
      return { ...state, timetable: [...otherEntries, ...entries] }
    }

    case 'RESET_ALL':
      return { ...defaultData, lastDeleted: { type: 'all', data: state, timetableEntries: [] } }

    case 'IMPORT_DATA':
      return { ...defaultData, ...action.payload }

    case 'SET_APPEARANCE':
      return { ...state, appearance: { ...state.appearance, ...action.payload } }

    case 'ADD_ACADEMIC_PERIOD':
      return { ...state, academicPeriods: [...state.academicPeriods, { ...action.payload, id: genId() }] }

    case 'UPDATE_ACADEMIC_PERIOD':
      return {
        ...state,
        academicPeriods: state.academicPeriods.map(p => p.id === action.payload.id ? { ...p, ...action.payload } : p),
      }

    case 'DELETE_ACADEMIC_PERIOD':
      return {
        ...state,
        academicPeriods: state.academicPeriods.filter(p => p.id !== action.payload),
        activePeriodId: state.activePeriodId === action.payload ? null : state.activePeriodId,
      }

    case 'SET_ACTIVE_PERIOD':
      return { ...state, activePeriodId: action.payload }

    case 'ADD_SECTION':
      return { ...state, sections: [...state.sections, { ...action.payload, id: genId() }] }

    case 'UPDATE_SECTION':
      return {
        ...state,
        sections: state.sections.map(s => s.id === action.payload.id ? { ...s, ...action.payload } : s),
      }

    case 'DELETE_SECTION':
      return {
        ...state,
        sections: state.sections.filter(s => s.id !== action.payload),
        classes: state.classes.map(c => c.sectionId === action.payload ? { ...c, sectionId: '' } : c),
      }

    case 'COPY_TIMETABLE_TO_PERIOD': {
      const { fromPeriodId, toPeriodId } = action.payload
      const sourceEntries = state.timetable.filter(e => e.periodSlotId === fromPeriodId || (!e.periodSlotId && !fromPeriodId))
      const newEntries = sourceEntries.map(e => ({
        ...e,
        id: genId(),
        periodSlotId: toPeriodId,
      }))
      const otherEntries = state.timetable.filter(e => e.periodSlotId !== toPeriodId && (e.periodSlotId || null) !== (fromPeriodId || null))
      return { ...state, timetable: [...otherEntries, ...newEntries] }
    }

    case 'CLEAR_PERIOD_TIMETABLE': {
      const periodId = action.payload
      if (periodId) {
        return { ...state, timetable: state.timetable.filter(e => e.periodSlotId !== periodId) }
      }
      return { ...state, timetable: state.timetable.filter(e => !e.periodSlotId) }
    }

    case 'UNDO_DELETE': {
      const last = state.lastDeleted
      if (!last) return state
      if (last.type === 'teacher') {
        return {
          ...state,
          teachers: [...state.teachers, last.data],
          timetable: [...state.timetable, ...last.timetableEntries],
          lastDeleted: null,
        }
      }
      if (last.type === 'class') {
        return {
          ...state,
          classes: [...state.classes, last.data],
          timetable: [...state.timetable, ...last.timetableEntries],
          lastDeleted: null,
        }
      }
      if (last.type === 'room') {
        return {
          ...state,
          rooms: [...state.rooms, last.data],
          timetable: [...state.timetable, ...last.timetableEntries],
          lastDeleted: null,
        }
      }
      if (last.type === 'timetable') {
        return { ...state, timetable: last.timetableEntries, lastDeleted: null }
      }
      if (last.type === 'all') {
        return { ...last.data, lastDeleted: null }
      }
      return state
    }

    case 'CLEAR_UNDO':
      return { ...state, lastDeleted: null }

    case 'SET_STORAGE_WARNING':
      return { ...state, storageWarning: action.payload }

    case 'SET_TELEMETRY':
      return { ...state, telemetry: { ...state.telemetry, ...action.payload } }

    case 'SET_TELEMETRY_CONSENT':
      return {
        ...state,
        telemetry: {
          ...state.telemetry,
          ...action.payload,
          consentTimestamp: new Date().toISOString(),
        },
      }

    default:
      return state
  }
}

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadData)

  useEffect(() => {
    try {
      const serialized = JSON.stringify(state)
      localStorage.setItem(STORAGE_KEY, serialized)
      if (state.storageWarning) {
        dispatch({ type: 'SET_STORAGE_WARNING', payload: null })
      }
    } catch (e) {
      console.error('Failed to save data:', e)
      if (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014) {
        dispatch({ type: 'SET_STORAGE_WARNING', payload: 'Storage limit reached! The school logo or data may be too large. Consider removing the logo or exporting a backup.' })
      }
    }
  }, [state])

  const checkConflicts = useCallback((entry, existingTimetable = state.timetable) => {
    const conflicts = []
    const period = state.settings.periods.find(p => p.id === entry.periodId)
    if (period?.isBreak) {
      conflicts.push({ type: 'break', message: 'Cannot schedule during a break period' })
      return conflicts
    }

    for (const e of existingTimetable) {
      if (e.day !== entry.day || e.periodId !== entry.periodId) continue
      if (entry.id && e.id === entry.id) continue

      if (entry.teacherId && e.teacherId === entry.teacherId) {
        const teacher = state.teachers.find(t => t.id === entry.teacherId)
        const cls = state.classes.find(c => c.id === e.classId)
        conflicts.push({
          type: 'teacher',
          message: `Teacher ${teacher?.name || 'Unknown'} is already assigned to ${cls?.name || 'a class'} at this time`,
        })
      }
      // Check secondary teacher conflicts
      if (entry.secondaryTeacherId && e.teacherId === entry.secondaryTeacherId) {
        const teacher = state.teachers.find(t => t.id === entry.secondaryTeacherId)
        const cls = state.classes.find(c => c.id === e.classId)
        conflicts.push({
          type: 'teacher',
          message: `Secondary teacher ${teacher?.name || 'Unknown'} is already assigned to ${cls?.name || 'a class'} at this time`,
        })
      }
      if (entry.teacherId && e.secondaryTeacherId === entry.teacherId) {
        const teacher = state.teachers.find(t => t.id === entry.teacherId)
        const cls = state.classes.find(c => c.id === e.classId)
        conflicts.push({
          type: 'teacher',
          message: `Teacher ${teacher?.name || 'Unknown'} is already assigned as secondary teacher to ${cls?.name || 'a class'} at this time`,
        })
      }
      if (entry.secondaryTeacherId && e.secondaryTeacherId === entry.secondaryTeacherId) {
        const teacher = state.teachers.find(t => t.id === entry.secondaryTeacherId)
        conflicts.push({
          type: 'teacher',
          message: `Secondary teacher ${teacher?.name || 'Unknown'} is already assigned elsewhere at this time`,
        })
      }
      if (entry.classId && e.classId === entry.classId) {
        conflicts.push({
          type: 'class',
          message: 'This class already has a lesson at this time',
        })
      }
      if (entry.roomId && e.roomId === entry.roomId) {
        const room = state.rooms.find(r => r.id === entry.roomId)
        conflicts.push({
          type: 'room',
          message: `Room ${room?.name || 'Unknown'} is already booked at this time`,
        })
      }
    }
    return conflicts
  }, [state.timetable, state.teachers, state.classes, state.rooms, state.settings.periods])

  const value = {
    state,
    dispatch,
    checkConflicts,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
