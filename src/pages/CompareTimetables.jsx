import React, { useState, useMemo } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { sounds } from '../utils/sounds.js'
import { Button, Card, PageHeader, Badge, EmptyState } from '../components/UI.jsx'

export default function CompareTimetables({ embedded, onBack }) {
  const { state } = useApp()
  const [savedSnapshot, setSavedSnapshot] = useState(null)
  const [compareResult, setCompareResult] = useState(null)

  const takeSnapshot = () => {
    const snapshot = JSON.parse(JSON.stringify(state.timetable))
    setSavedSnapshot(snapshot)
    setCompareResult(null)
    sounds.save()
  }

  const compare = () => {
    if (!savedSnapshot) return
    const current = state.timetable
    const snapshotIds = new Set(savedSnapshot.map(e => e.id))
    const currentIds = new Set(current.map(e => e.id))

    const added = current.filter(e => !snapshotIds.has(e.id))
    const removed = savedSnapshot.filter(e => !currentIds.has(e.id))
    const modified = []
    const unchanged = []

    for (const entry of current) {
      if (!snapshotIds.has(entry.id)) continue
      const old = savedSnapshot.find(e => e.id === entry.id)
      if (JSON.stringify({ ...old, id: undefined }) !== JSON.stringify({ ...entry, id: undefined })) {
        modified.push({ old, new: entry })
      } else {
        unchanged.push(entry)
      }
    }

    setCompareResult({ added, removed, modified, unchanged, total: current.length })
    sounds.click()
  }

  const getSubjectName = (id) => state.subjects.find(s => s.id === id)?.name || 'Unknown'
  const getTeacherName = (id) => state.teachers.find(t => t.id === id)?.name || 'Unknown'
  const getClassName = (id) => state.classes.find(c => c.id === id)?.name || 'Unknown'
  const getRoomName = (id) => state.rooms.find(r => r.id === id)?.name || '—'

  const entryLabel = (e) => `${getClassName(e.classId)} · ${e.day} · ${getSubjectName(e.subjectId)} · ${getTeacherName(e.teacherId)} · ${getRoomName(e.roomId)}`

  return (
    <div className="p-4 md:p-8">
      {!embedded && (
        <PageHeader
          title="Compare Timetables"
          subtitle="Compare current timetable with a saved snapshot"
          action={
            <div className="flex gap-2">
              <Button variant="secondary" onClick={takeSnapshot}>Take Snapshot</Button>
              <Button onClick={compare} disabled={!savedSnapshot}>Compare Now</Button>
            </div>
          }
        />
      )}

      {embedded && (
        <div className="flex justify-end gap-2 mb-4">
          <Button variant="secondary" onClick={takeSnapshot}>Take Snapshot</Button>
          <Button onClick={compare} disabled={!savedSnapshot}>Compare Now</Button>
        </div>
      )}

      <Card className="p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700">Snapshot Status</p>
            {savedSnapshot ? (
              <p className="text-xs text-slate-500">{savedSnapshot.length} entries saved</p>
            ) : (
              <p className="text-xs text-slate-400">No snapshot taken yet</p>
            )}
          </div>
          {savedSnapshot && <Badge color="green">Snapshot Ready</Badge>}
        </div>
      </Card>

      {!compareResult ? (
        <Card className="p-6">
          <EmptyState
            icon="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            title="No comparison yet"
            subtitle="Take a snapshot of the current timetable, make changes, then click Compare to see what changed."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{compareResult.added.length}</p>
                <p className="text-xs text-slate-500">Added</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{compareResult.removed.length}</p>
                <p className="text-xs text-slate-500">Removed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-600">{compareResult.modified.length}</p>
                <p className="text-xs text-slate-500">Modified</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-600">{compareResult.unchanged.length}</p>
                <p className="text-xs text-slate-500">Unchanged</p>
              </div>
            </div>
          </Card>

          {compareResult.added.length > 0 && (
            <Card className="p-4">
              <h3 className="text-sm font-bold text-green-700 mb-3">Added Entries</h3>
              <div className="space-y-1">
                {compareResult.added.map(e => (
                  <div key={e.id} className="text-xs text-slate-600 bg-green-50 p-2 rounded">
                    + {entryLabel(e)}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {compareResult.removed.length > 0 && (
            <Card className="p-4">
              <h3 className="text-sm font-bold text-red-700 mb-3">Removed Entries</h3>
              <div className="space-y-1">
                {compareResult.removed.map(e => (
                  <div key={e.id} className="text-xs text-slate-600 bg-red-50 p-2 rounded">
                    − {entryLabel(e)}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {compareResult.modified.length > 0 && (
            <Card className="p-4">
              <h3 className="text-sm font-bold text-amber-700 mb-3">Modified Entries</h3>
              <div className="space-y-2">
                {compareResult.modified.map(({ old, new: entry }) => (
                  <div key={entry.id} className="text-xs bg-amber-50 p-2 rounded">
                    <p className="text-slate-500 line-through">{entryLabel(old)}</p>
                    <p className="text-slate-700">{entryLabel(entry)}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {compareResult.added.length === 0 && compareResult.removed.length === 0 && compareResult.modified.length === 0 && (
            <Card className="p-6">
              <p className="text-sm text-center text-slate-500">No changes detected. The timetable is identical to the snapshot.</p>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
