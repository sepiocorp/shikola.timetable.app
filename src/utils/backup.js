const BACKUP_KEY = 'shikola-timetable-backups'

export function createBackup(state) {
  const backup = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    timestamp: new Date().toISOString(),
    data: JSON.stringify(state),
    schoolName: state.school?.name || 'Unknown',
    label: `${state.school?.name || 'School'} - ${new Date().toLocaleString()}`,
  }
  try {
    const existing = JSON.parse(localStorage.getItem(BACKUP_KEY) || '[]')
    existing.unshift(backup)
    localStorage.setItem(BACKUP_KEY, JSON.stringify(existing.slice(0, 20)))
  } catch (e) {
    console.error('Failed to save backup:', e)
  }
  return backup
}

export function getBackups() {
  try {
    return JSON.parse(localStorage.getItem(BACKUP_KEY) || '[]')
  } catch (e) {
    return []
  }
}

export function restoreBackup(backupId) {
  const backups = getBackups()
  const backup = backups.find(b => b.id === backupId)
  if (!backup) return null
  return JSON.parse(backup.data)
}

export function deleteBackup(backupId) {
  const backups = getBackups()
  const filtered = backups.filter(b => b.id !== backupId)
  localStorage.setItem(BACKUP_KEY, JSON.stringify(filtered))
}

export function exportBackup(state) {
  const data = JSON.stringify(state, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const ts = new Date().toISOString().replace(/[:.]/g, '-')
  link.href = url
  link.download = `shikola-backup-${ts}.json`
  link.click()
  URL.revokeObjectURL(url)
}

export function importBackup(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        resolve(data)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsText(file)
  })
}
