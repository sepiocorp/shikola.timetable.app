import React, { useState, useEffect } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { sounds } from '../utils/sounds.js'
import { Button, Card, PageHeader, EmptyState, Badge, SkeletonCard } from '../components/UI.jsx'
import { createBackup, getBackups, restoreBackup, deleteBackup, exportBackup, importBackup } from '../utils/backup.js'

export default function BackupRestore({ embedded }) {
  const { state, dispatch } = useApp()
  const [loading, setLoading] = useState(false)
  const [backups, setBackups] = useState([])
  const [importStatus, setImportStatus] = useState(null)

  useEffect(() => {
    setBackups(getBackups())
  }, [])

  const refreshBackups = () => setBackups(getBackups())

  const handleCreateBackup = () => {
    createBackup(state)
    sounds.save()
    refreshBackups()
  }

  const handleRestore = (backupId) => {
    const backup = backups.find(b => b.id === backupId)
    if (!backup) return
    if (confirm(`Restore backup from ${new Date(backup.timestamp).toLocaleString()}? This will replace all current data.`)) {
      const data = restoreBackup(backupId)
      if (data) {
        dispatch({ type: 'IMPORT_DATA', payload: data })
        sounds.success()
      }
    }
  }

  const handleDelete = (backupId) => {
    if (confirm('Delete this backup?')) {
      deleteBackup(backupId)
      sounds.delete()
      refreshBackups()
    }
  }

  const handleExport = () => {
    exportBackup(state)
    sounds.export()
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportStatus('importing')
    try {
      const data = await importBackup(file)
      dispatch({ type: 'IMPORT_DATA', payload: data })
      sounds.success()
      setImportStatus('success')
      setTimeout(() => setImportStatus(null), 3000)
    } catch (err) {
      sounds.error()
      setImportStatus('error')
      setTimeout(() => setImportStatus(null), 3000)
    }
    e.target.value = ''
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <PageHeader title="Backup & Restore" subtitle="Loading..." />
        <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <PageHeader
        title="Backup & Restore"
        subtitle="Create, restore, and manage data backups"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleExport}>Export JSON</Button>
            <Button onClick={handleCreateBackup}>+ Create Backup</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          {backups.length === 0 ? (
            <Card className="p-6">
              <EmptyState
                icon="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                title="No backups yet"
                subtitle="Create a backup to save your current data state"
                action={<Button onClick={handleCreateBackup}>+ Create Backup</Button>}
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {backups.map(backup => (
                <Card key={backup.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{backup.schoolName}</p>
                        <p className="text-xs text-slate-500">{new Date(backup.timestamp).toLocaleString()}</p>
                      </div>
                      <Badge color="slate">{(backup.data.length / 1024).toFixed(1)} KB</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => handleRestore(backup.id)}>Restore</Button>
                      <button onClick={() => handleDelete(backup.id)} className="text-slate-400 hover:text-red-500 p-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="text-sm font-bold text-slate-700 mb-3">Import Data</h3>
            <p className="text-xs text-slate-500 mb-3">Restore from an exported JSON backup file.</p>
            <label className="block">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
                id="import-backup-input"
              />
              <Button variant="secondary" className="w-full" onClick={() => document.getElementById('import-backup-input').click()}>
                Choose File...
              </Button>
            </label>
            {importStatus === 'importing' && <p className="text-xs text-blue-600 mt-2">Importing...</p>}
            {importStatus === 'success' && <p className="text-xs text-green-600 mt-2">Imported successfully!</p>}
            {importStatus === 'error' && <p className="text-xs text-red-600 mt-2">Import failed. Invalid file.</p>}
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-bold text-slate-700 mb-3">Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Teachers</span>
                <span className="font-bold text-slate-800">{state.teachers.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Classes</span>
                <span className="font-bold text-slate-800">{state.classes.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Subjects</span>
                <span className="font-bold text-slate-800">{state.subjects.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Rooms</span>
                <span className="font-bold text-slate-800">{state.rooms.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Timetable entries</span>
                <span className="font-bold text-slate-800">{state.timetable.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Backups stored</span>
                <span className="font-bold text-slate-800">{backups.length}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
