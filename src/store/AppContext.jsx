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
  // Phase 1: Core scheduling
  teacherTimeOff: {},
  teacherConstraints: {},
  cardRelationships: [],
  lessonTypes: [
    { id: 'single', name: 'Single', length: 1 },
    { id: 'double', name: 'Double', length: 2 },
    { id: 'triple', name: 'Triple', length: 3 },
  ],
  // Phase 2: Class & lesson management
  lessonDivisions: [],
  lessonGroups: [],
  jointClasses: [],
  multiWeekCycle: 1,
  lockedEntries: [],
  // Phase 4: Substitutions & supervision
  substitutions: [],
  supervision: [],
  // Phase 5: Export & print
  customFields: [],
  // Departments, subject assignments, shared resources
  departments: [],
  subjectAssignments: [],
  sharedRooms: [],
  sharedClasses: [],
  // Phase 6: Advanced
  lunchConstraint: { enabled: false, afterPeriodId: null, beforePeriodId: null },
  educationBlocks: [],
  buildings: [],
  pupils: [],
  autoRelax: false,
  language: 'en',
  backupHistory: [],
  lastDeleted: null,
  successMessage: null,
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

function deepMergeDefaults(defaults, saved) {
  const result = { ...defaults }
  for (const key in saved) {
    if (
      saved[key] !== null &&
      typeof saved[key] === 'object' &&
      !Array.isArray(saved[key]) &&
      typeof defaults[key] === 'object' &&
      !Array.isArray(defaults[key])
    ) {
      result[key] = deepMergeDefaults(defaults[key], saved[key])
    } else {
      result[key] = saved[key]
    }
  }
  return result
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return deepMergeDefaults(defaultData, parsed)
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

    case 'UPDATE_SETTINGS': {
      const newSettings = { ...state.settings, ...action.payload }
      if (action.payload.periods) {
        const validPeriodIds = new Set(action.payload.periods.map(p => p.id))
        return {
          ...state,
          settings: newSettings,
          timetable: state.timetable.filter(e => validPeriodIds.has(e.periodId)),
        }
      }
      return { ...state, settings: newSettings }
    }

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

    case 'BULK_ADD_PUPILS':
      return { ...state, pupils: [...state.pupils, ...action.payload.map(p => ({ ...p, id: genId() }))] }

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
      const { day, periodId, teacherId, classId, subjectId, roomId, secondaryClassId, secondarySubjectId, secondaryTeacherId, lessonLength, lessonGroupId, locked } = action.payload
      const existing = state.timetable.find(
        e => e.day === day && e.periodId === periodId && e.classId === classId
      )
      if (existing) {
        return {
          ...state,
          timetable: state.timetable.map(e =>
            e.id === existing.id
              ? { ...e, teacherId, subjectId, roomId, secondaryClassId: secondaryClassId || '', secondarySubjectId: secondarySubjectId || '', secondaryTeacherId: secondaryTeacherId || '', lessonLength: lessonLength || 1, lessonGroupId: lessonGroupId || '', locked: locked || false }
              : e
          ),
        }
      }
      return {
        ...state,
        timetable: [...state.timetable, { id: genId(), day, periodId, teacherId, classId, subjectId, roomId, secondaryClassId: secondaryClassId || '', secondarySubjectId: secondarySubjectId || '', secondaryTeacherId: secondaryTeacherId || '', lessonLength: lessonLength || 1, lessonGroupId: lessonGroupId || '', locked: locked || false }],
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
      const lockedEntries = state.timetable.filter(e => classIds.includes(e.classId) && state.lockedEntries?.includes(e.id))
      return { ...state, timetable: [...otherEntries, ...lockedEntries, ...entries] }
    }

    case 'RESET_ALL':
      return { ...defaultData, lastDeleted: { type: 'all', data: state, timetableEntries: [] } }

    case 'IMPORT_DATA':
      return deepMergeDefaults(defaultData, action.payload)

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

    case 'UPDATE_SECTION': {
      const updatedSections = state.sections.map(s => s.id === action.payload.id ? { ...s, ...action.payload } : s)
      if (action.payload.periods) {
        const validPeriodIds = new Set(action.payload.periods.map(p => p.id))
        const sectionClassIds = new Set(
          state.classes.filter(c => c.sectionId === action.payload.id).map(c => c.id)
        )
        return {
          ...state,
          sections: updatedSections,
          timetable: state.timetable.filter(e =>
            !sectionClassIds.has(e.classId) || validPeriodIds.has(e.periodId)
          ),
        }
      }
      return { ...state, sections: updatedSections }
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

    case 'SET_SUCCESS_MESSAGE':
      return { ...state, successMessage: action.payload }

    case 'CLEAR_SUCCESS_MESSAGE':
      return { ...state, successMessage: null }

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

    // === Phase 1: Core Scheduling ===
    case 'SET_TEACHER_TIME_OFF':
      return { ...state, teacherTimeOff: { ...state.teacherTimeOff, ...action.payload } }

    case 'SET_TEACHER_CONSTRAINTS':
      return { ...state, teacherConstraints: { ...state.teacherConstraints, ...action.payload } }

    case 'SET_LESSON_TYPES':
      return { ...state, lessonTypes: action.payload }

    // === Phase 2: Class & Lesson Management ===
    case 'ADD_LESSON_DIVISION':
      return { ...state, lessonDivisions: [...state.lessonDivisions, { ...action.payload, id: genId() }] }

    case 'UPDATE_LESSON_DIVISION':
      return {
        ...state,
        lessonDivisions: state.lessonDivisions.map(d => d.id === action.payload.id ? { ...d, ...action.payload } : d),
      }

    case 'DELETE_LESSON_DIVISION':
      return { ...state, lessonDivisions: state.lessonDivisions.filter(d => d.id !== action.payload) }

    case 'ADD_LESSON_GROUP':
      return { ...state, lessonGroups: [...state.lessonGroups, { ...action.payload, id: genId() }] }

    case 'UPDATE_LESSON_GROUP':
      return {
        ...state,
        lessonGroups: state.lessonGroups.map(g => g.id === action.payload.id ? { ...g, ...action.payload } : g),
      }

    case 'DELETE_LESSON_GROUP':
      return { ...state, lessonGroups: state.lessonGroups.filter(g => g.id !== action.payload) }

    case 'ADD_JOINT_CLASS':
      return { ...state, jointClasses: [...state.jointClasses, { ...action.payload, id: genId() }] }

    case 'UPDATE_JOINT_CLASS':
      return {
        ...state,
        jointClasses: state.jointClasses.map(j => j.id === action.payload.id ? { ...j, ...action.payload } : j),
      }

    case 'DELETE_JOINT_CLASS':
      return { ...state, jointClasses: state.jointClasses.filter(j => j.id !== action.payload) }

    case 'SET_MULTI_WEEK_CYCLE':
      return { ...state, multiWeekCycle: action.payload }

    // === Phase 4: Substitutions & Supervision ===
    case 'ADD_SUPERVISION':
      return { ...state, supervision: [...state.supervision, { ...action.payload, id: genId() }] }

    case 'DELETE_SUPERVISION':
      return { ...state, supervision: state.supervision.filter(s => s.id !== action.payload) }

    // === Phase 5: Export & Print ===
    case 'ADD_CUSTOM_FIELD':
      return { ...state, customFields: [...state.customFields, { ...action.payload, id: genId() }] }

    case 'UPDATE_CUSTOM_FIELD':
      return {
        ...state,
        customFields: state.customFields.map(f => f.id === action.payload.id ? { ...f, ...action.payload } : f),
      }

    case 'DELETE_CUSTOM_FIELD':
      return { ...state, customFields: state.customFields.filter(f => f.id !== action.payload) }

    // === Phase 6: Advanced ===
    case 'SET_LUNCH_CONSTRAINT':
      return { ...state, lunchConstraint: { ...state.lunchConstraint, ...action.payload } }

    case 'ADD_EDUCATION_BLOCK':
      return { ...state, educationBlocks: [...state.educationBlocks, { ...action.payload, id: genId() }] }

    case 'DELETE_EDUCATION_BLOCK':
      return { ...state, educationBlocks: state.educationBlocks.filter(b => b.id !== action.payload) }

    case 'ADD_BUILDING':
      return { ...state, buildings: [...state.buildings, { ...action.payload, id: genId() }] }

    case 'UPDATE_BUILDING':
      return {
        ...state,
        buildings: state.buildings.map(b => b.id === action.payload.id ? { ...b, ...action.payload } : b),
      }

    case 'DELETE_BUILDING':
      return { ...state, buildings: state.buildings.filter(b => b.id !== action.payload) }

    case 'ADD_PUPIL':
      return { ...state, pupils: [...state.pupils, { ...action.payload, id: genId() }] }

    case 'UPDATE_PUPIL':
      return {
        ...state,
        pupils: state.pupils.map(s => s.id === action.payload.id ? { ...s, ...action.payload } : s),
      }

    case 'DELETE_PUPIL':
      return { ...state, pupils: state.pupils.filter(s => s.id !== action.payload) }

    case 'SET_AUTO_RELAX':
      return { ...state, autoRelax: action.payload }

    case 'SET_LANGUAGE':
      return { ...state, language: action.payload }

    case 'BACKUP_DATA': {
      const backup = { data: state, timestamp: new Date().toISOString(), id: genId() }
      return { ...state, backupHistory: [backup, ...state.backupHistory].slice(0, 10) }
    }

    case 'RESTORE_BACKUP':
      return { ...action.payload.data, lastDeleted: null }

    case 'DELETE_BACKUP':
      return { ...state, backupHistory: state.backupHistory.filter(b => b.id !== action.payload) }

    // === Departments ===
    case 'ADD_DEPARTMENT':
      return { ...state, departments: [...state.departments, { ...action.payload, id: genId() }] }

    case 'UPDATE_DEPARTMENT':
      return {
        ...state,
        departments: state.departments.map(d => d.id === action.payload.id ? { ...d, ...action.payload } : d),
      }

    case 'DELETE_DEPARTMENT':
      return {
        ...state,
        departments: state.departments.filter(d => d.id !== action.payload),
        teachers: state.teachers.map(t => t.departmentId === action.payload ? { ...t, departmentId: '' } : t),
        subjects: state.subjects.map(s => s.departmentId === action.payload ? { ...s, departmentId: '' } : s),
      }

    // === Subject Assignments ===
    case 'ADD_SUBJECT_ASSIGNMENT':
      return { ...state, subjectAssignments: [...state.subjectAssignments, { ...action.payload, id: genId() }] }

    case 'UPDATE_SUBJECT_ASSIGNMENT':
      return {
        ...state,
        subjectAssignments: state.subjectAssignments.map(a => a.id === action.payload.id ? { ...a, ...action.payload } : a),
      }

    case 'DELETE_SUBJECT_ASSIGNMENT':
      return { ...state, subjectAssignments: state.subjectAssignments.filter(a => a.id !== action.payload) }

    case 'BULK_SET_SUBJECT_ASSIGNMENTS':
      return { ...state, subjectAssignments: action.payload }

    // === Shared Rooms ===
    case 'ADD_SHARED_ROOM':
      return { ...state, sharedRooms: [...state.sharedRooms, { ...action.payload, id: genId() }] }

    case 'UPDATE_SHARED_ROOM':
      return {
        ...state,
        sharedRooms: state.sharedRooms.map(r => r.id === action.payload.id ? { ...r, ...action.payload } : r),
      }

    case 'DELETE_SHARED_ROOM':
      return { ...state, sharedRooms: state.sharedRooms.filter(r => r.id !== action.payload) }

    // === Shared Classes ===
    case 'ADD_SHARED_CLASS':
      return { ...state, sharedClasses: [...state.sharedClasses, { ...action.payload, id: genId() }] }

    case 'UPDATE_SHARED_CLASS':
      return {
        ...state,
        sharedClasses: state.sharedClasses.map(c => c.id === action.payload.id ? { ...c, ...action.payload } : c),
      }

    case 'DELETE_SHARED_CLASS':
      return { ...state, sharedClasses: state.sharedClasses.filter(c => c.id !== action.payload) }

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

    // Check teacher time off
    if (entry.teacherId) {
      const timeOff = state.teacherTimeOff?.[entry.teacherId]
      if (timeOff) {
        if (timeOff.daysOff?.includes(entry.day)) {
          const teacher = state.teachers.find(t => t.id === entry.teacherId)
          conflicts.push({ type: 'time_off', message: `Teacher ${teacher?.name || 'Unknown'} is unavailable on ${entry.day}` })
        }
        if (timeOff.periodsOff?.includes(`${entry.day}-${entry.periodId}`)) {
          const teacher = state.teachers.find(t => t.id === entry.teacherId)
          conflicts.push({ type: 'time_off', message: `Teacher ${teacher?.name || 'Unknown'} is unavailable at this period` })
        }
      }
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
  }, [state.timetable, state.teachers, state.classes, state.rooms, state.settings.periods, state.teacherTimeOff])

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
