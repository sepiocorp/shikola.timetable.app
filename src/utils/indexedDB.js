const DB_NAME = 'ShikolaTimetableDB'
const DB_VERSION = 1
const STORE_NAME = 'appData'

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
  teacherTimeOff: {},
  teacherConstraints: {},
  cardRelationships: [],
  lessonTypes: [
    { id: 'single', name: 'Single', length: 1 },
    { id: 'double', name: 'Double', length: 2 },
    { id: 'triple', name: 'Triple', length: 3 },
  ],
  lessonDivisions: [],
  lessonGroups: [],
  jointClasses: [],
  multiWeekCycle: 1,
  lockedEntries: [],
  substitutions: [],
  supervision: [],
  customFields: [],
  departments: [],
  subjectAssignments: [],
  sharedRooms: [],
  sharedClasses: [],
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
  appLocked: false,
  lockReason: null,
  telemetry: {
    registered: true,
    analyticsEnabled: true,
    crashReportingEnabled: true,
    registrationConsent: true,
    consentTimestamp: null,
  },
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

let db = null

async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = event.target.result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME)
      }
    }
  })
}

async function getData() {
  if (!db) await openDB()
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get('appData')

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const data = request.result
      if (data) {
        resolve(deepMergeDefaults(defaultData, data))
      } else {
        resolve(defaultData)
      }
    }
  })
}

async function setData(data) {
  if (!db) await openDB()
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(data, 'appData')

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

async function migrateFromLocalStorage() {
  const LOCAL_STORAGE_KEY = 'shikola-timetable-data'
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      await setData(parsed)
      // Don't remove from localStorage yet, keep as backup
      console.log('Migrated data from localStorage to IndexedDB')
      return true
    }
  } catch (e) {
    console.error('Failed to migrate from localStorage:', e)
  }
  return false
}

async function getStorageUsage() {
  if (!db) await openDB()
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get('appData')

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const data = request.result
      if (data) {
        const size = new Blob([JSON.stringify(data)]).size
        resolve(size)
      } else {
        resolve(0)
      }
    }
  })
}

export {
  openDB,
  getData,
  setData,
  migrateFromLocalStorage,
  getStorageUsage,
  defaultData,
}
