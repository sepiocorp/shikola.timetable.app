import React, { useState } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { sounds } from '../utils/sounds.js'
import { Button, Card, PageHeader, Modal, EmptyState, Badge, Input, Toggle } from '../components/UI.jsx'

export default function TeacherConstraints({ embedded, onBack, navigate }) {
  const { state, dispatch } = useApp()
  const [selectedTeacherId, setSelectedTeacherId] = useState(null)
  const [constraintModalOpen, setConstraintModalOpen] = useState(false)
  const [constraintForm, setConstraintForm] = useState({})

  const teachingPeriods = state.settings.periods.filter(p => !p.isBreak)
  const selectedTeacher = state.teachers.find(t => t.id === selectedTeacherId)
  const timeOff = state.teacherTimeOff[selectedTeacherId] || { daysOff: [], periodsOff: [] }
  const constraints = state.teacherConstraints[selectedTeacherId] || {}

  const toggleDayOff = (day) => {
    const daysOff = timeOff.daysOff || []
    const newDaysOff = daysOff.includes(day)
      ? daysOff.filter(d => d !== day)
      : [...daysOff, day]
    dispatch({ type: 'SET_TEACHER_TIME_OFF', payload: { [selectedTeacherId]: { ...timeOff, daysOff: newDaysOff } } })
    sounds.click()
  }

  const togglePeriodOff = (day, periodId) => {
    const periodsOff = timeOff.periodsOff || []
    const key = `${day}-${periodId}`
    const newPeriodsOff = periodsOff.includes(key)
      ? periodsOff.filter(p => p !== key)
      : [...periodsOff, key]
    dispatch({ type: 'SET_TEACHER_TIME_OFF', payload: { [selectedTeacherId]: { ...timeOff, periodsOff: newPeriodsOff } } })
    sounds.click()
  }

  const openConstraints = () => {
    setConstraintForm({
      maxLessonsPerDay: constraints.maxLessonsPerDay || '',
      minLessonsPerDay: constraints.minLessonsPerDay || '',
      maxTeachingDays: constraints.maxTeachingDays || '',
      maxConsecutivePeriods: constraints.maxConsecutivePeriods || '',
      maxGapsPerWeek: constraints.maxGapsPerWeek !== undefined ? constraints.maxGapsPerWeek : '',
    })
    setConstraintModalOpen(true)
    sounds.click()
  }

  const saveConstraints = () => {
    const parsed = {}
    if (constraintForm.maxLessonsPerDay) parsed.maxLessonsPerDay = parseInt(constraintForm.maxLessonsPerDay)
    if (constraintForm.minLessonsPerDay) parsed.minLessonsPerDay = parseInt(constraintForm.minLessonsPerDay)
    if (constraintForm.maxTeachingDays) parsed.maxTeachingDays = parseInt(constraintForm.maxTeachingDays)
    if (constraintForm.maxConsecutivePeriods) parsed.maxConsecutivePeriods = parseInt(constraintForm.maxConsecutivePeriods)
    if (constraintForm.maxGapsPerWeek !== '') parsed.maxGapsPerWeek = parseInt(constraintForm.maxGapsPerWeek)
    dispatch({ type: 'SET_TEACHER_CONSTRAINTS', payload: { [selectedTeacherId]: parsed } })
    sounds.save()
    setConstraintModalOpen(false)
  }

  return (
    <div className="p-4 md:p-8">
      {!embedded && <PageHeader
        title="Teacher Constraints"
        subtitle="Set teacher availability and scheduling limits"
      />}

      {state.teachers.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            title="No teachers yet"
            subtitle="Add teachers first to configure their constraints"
            action={navigate && <Button onClick={() => navigate('teachers')}>Go to Teachers</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Teacher list */}
          <div className="col-span-1">
            <Card className="p-4">
              <h3 className="text-sm font-bold text-slate-700 mb-3">Teachers</h3>
              <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                {state.teachers.map(teacher => (
                  <button
                    key={teacher.id}
                    onClick={() => { setSelectedTeacherId(teacher.id); sounds.click() }}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      selectedTeacherId === teacher.id
                        ? 'border-brand-600 bg-brand-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-800">{teacher.name}</p>
                    <p className="text-xs text-slate-500">{teacher.subjects?.length || 0} subject(s)</p>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Time off grid + constraints */}
          <div className="col-span-3 space-y-6">
            {!selectedTeacher ? (
              <Card className="p-12">
                <EmptyState
                  icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  title="Select a teacher"
                  subtitle="Choose a teacher from the left to configure their availability and constraints"
                />
              </Card>
            ) : (
              <>
                <Card className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-700">Time Off Grid — {selectedTeacher.name}</h3>
                      <p className="text-xs text-slate-500">Click cells to toggle availability. Red = unavailable.</p>
                    </div>
                    <Button variant="secondary" onClick={openConstraints}>Set Constraints</Button>
                  </div>

                  {/* Day off buttons */}
                  <div className="mb-4">
                    <p className="text-xs font-medium text-slate-600 mb-2">Full days off:</p>
                    <div className="flex gap-2 flex-wrap">
                      {state.settings.days.map(day => (
                        <button
                          key={day}
                          onClick={() => toggleDayOff(day)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            (timeOff.daysOff || []).includes(day)
                              ? 'bg-red-100 text-red-700 border border-red-300'
                              : 'bg-slate-50 text-slate-600 border border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Period grid */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th className="text-xs font-medium text-slate-500 p-2 text-left">Day / Period</th>
                          {teachingPeriods.map(p => (
                            <th key={p.id} className="text-xs font-medium text-slate-500 p-2 text-center min-w-[60px]">
                              {p.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {state.settings.days.map(day => {
                          const isDayOff = (timeOff.daysOff || []).includes(day)
                          return (
                            <tr key={day}>
                              <td className="text-xs font-semibold text-slate-700 p-2">{day}</td>
                              {teachingPeriods.map(p => {
                                const key = `${day}-${p.id}`
                                const isOff = isDayOff || (timeOff.periodsOff || []).includes(key)
                                return (
                                  <td key={p.id} className="p-1 text-center">
                                    <button
                                      onClick={() => !isDayOff && togglePeriodOff(day, p.id)}
                                      disabled={isDayOff}
                                      className={`w-full h-8 rounded text-xs font-medium transition-all ${
                                        isOff
                                          ? 'bg-red-100 text-red-600 border border-red-200'
                                          : 'bg-green-50 text-green-600 border border-green-200 hover:bg-green-100'
                                      } ${isDayOff ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                      {isOff ? '✕' : '✓'}
                                    </button>
                                  </td>
                                )
                              })}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>

                {/* Current constraints summary */}
                <Card className="p-5">
                  <h3 className="text-sm font-bold text-slate-700 mb-3">Current Constraints</h3>
                  {Object.keys(constraints).length === 0 ? (
                    <p className="text-sm text-slate-400">No constraints set. Click "Set Constraints" to add limits.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {constraints.maxLessonsPerDay && <Badge color="blue">Max {constraints.maxLessonsPerDay} lessons/day</Badge>}
                      {constraints.minLessonsPerDay && <Badge color="green">Min {constraints.minLessonsPerDay} lessons/day</Badge>}
                      {constraints.maxTeachingDays && <Badge color="purple">Max {constraints.maxTeachingDays} teaching days</Badge>}
                      {constraints.maxConsecutivePeriods && <Badge color="amber">Max {constraints.maxConsecutivePeriods} consecutive</Badge>}
                      {constraints.maxGapsPerWeek !== undefined && <Badge color="slate">Max {constraints.maxGapsPerWeek} gaps/week</Badge>}
                    </div>
                  )}
                </Card>
              </>
            )}
          </div>
        </div>
      )}

      {/* Constraints Modal */}
      <Modal open={constraintModalOpen} onClose={() => setConstraintModalOpen(false)} title={`Constraints — ${selectedTeacher?.name || ''}`}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Max lessons per day"
              type="number"
              min="1"
              value={constraintForm.maxLessonsPerDay}
              onChange={e => setConstraintForm({ ...constraintForm, maxLessonsPerDay: e.target.value })}
              placeholder="e.g., 6"
            />
            <Input
              label="Min lessons per day"
              type="number"
              min="0"
              value={constraintForm.minLessonsPerDay}
              onChange={e => setConstraintForm({ ...constraintForm, minLessonsPerDay: e.target.value })}
              placeholder="e.g., 3"
            />
            <Input
              label="Max teaching days per week"
              type="number"
              min="1"
              value={constraintForm.maxTeachingDays}
              onChange={e => setConstraintForm({ ...constraintForm, maxTeachingDays: e.target.value })}
              placeholder="e.g., 5"
            />
            <Input
              label="Max consecutive periods"
              type="number"
              min="1"
              value={constraintForm.maxConsecutivePeriods}
              onChange={e => setConstraintForm({ ...constraintForm, maxConsecutivePeriods: e.target.value })}
              placeholder="e.g., 3"
            />
            <Input
              label="Max gaps per week"
              type="number"
              min="0"
              value={constraintForm.maxGapsPerWeek}
              onChange={e => setConstraintForm({ ...constraintForm, maxGapsPerWeek: e.target.value })}
              placeholder="e.g., 5"
            />
          </div>
          <p className="text-xs text-slate-400">Leave blank to not enforce a specific constraint.</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setConstraintModalOpen(false)}>Cancel</Button>
            <Button onClick={saveConstraints}>Save Constraints</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
