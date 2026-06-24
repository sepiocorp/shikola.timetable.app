import React, { useState } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { sounds } from '../utils/sounds.js'
import { sendRegistration } from '../utils/telemetry.js'
import { Button, Input, Select } from '../components/UI.jsx'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function SetupWizard({ onShowAbout, onShowDocs }) {
  const { dispatch, state } = useApp()
  const [step, setStep] = useState(1)
  const [school, setSchool] = useState({
    name: '',
    motto: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    logo: null,
    academicYear: '',
    term: 'Term 1',
  })
  const [selectedDays, setSelectedDays] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'])
  const [numPeriods, setNumPeriods] = useState(8)
  const [periodTimes, setPeriodTimes] = useState([])
  const [finishing, setFinishing] = useState(false)

  const handleDayToggle = (day) => {
    sounds.click()
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day))
    } else {
      setSelectedDays([...selectedDays, day])
    }
  }

  const generatePeriods = () => {
    const periods = []
    let currentTime = '08:00'
    const periodDuration = 40
    const breakAfter = 4

    for (let i = 1; i <= numPeriods; i++) {
      const [h, m] = currentTime.split(':').map(Number)
      const endM = m + periodDuration
      const endH = h + Math.floor(endM / 60)
      const endTime = `${String(endH).padStart(2, '0')}:${String(endM % 60).padStart(2, '0')}`

      periods.push({
        id: i,
        name: `Period ${i}`,
        start: currentTime,
        end: endTime,
      })

      currentTime = endTime

      if (i === breakAfter) {
        periods.push({
          id: i + 100,
          name: 'Break',
          start: currentTime,
          end: (() => {
            const [bh, bm] = currentTime.split(':').map(Number)
            return `${String(bh).padStart(2, '0')}:${String(bm + 20) % 60 === 0 ? String((bm + 20) % 60).padStart(2, '0') : String(bm + 20).padStart(2, '0')}`
          })(),
          isBreak: true,
        })
        const [bh, bm] = currentTime.split(':').map(Number)
        currentTime = `${String(bh).padStart(2, '0')}:${String(bm + 20).padStart(2, '0')}`
      }
    }
    return periods
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      alert('Logo file size must be less than 2MB')
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      setSchool({ ...school, logo: event.target.result })
      sounds.add()
    }
    reader.readAsDataURL(file)
  }

  const handleFinish = () => {
    setFinishing(true)
    const periods = generatePeriods()
    const orderedDays = DAYS.filter(d => selectedDays.includes(d))

    // Send registration data if telemetry is enabled (defaults from installer or app defaults)
    const telemetry = state.telemetry || {}
    if (telemetry.registered) {
      sendRegistration(school).catch(() => {})
    }

    setTimeout(() => {
      dispatch({
        type: 'SET_SCHOOL',
        payload: school,
      })
      dispatch({
        type: 'UPDATE_SETTINGS',
        payload: { days: orderedDays, periods },
      })
      sounds.success()
    }, 1500)
  }

  const canProceed = () => {
    if (step === 1) return school.name.trim() !== '' && school.academicYear.trim() !== ''
    if (step === 2) return selectedDays.length > 0
    if (step === 3) return numPeriods > 0
    return true
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-brand-600 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="./logo.png" alt="Shikola logo" className="w-12 h-12 rounded-xl object-contain bg-white/20 p-1" />
              <div>
                <h1 className="text-xl font-bold text-white">Shikola Timetable Creator</h1>
                <p className="text-sm text-brand-100">by Sepio Corp</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onShowDocs?.()}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                Help
              </button>
              <button
                onClick={() => onShowAbout?.()}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                About
              </button>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="px-8 pt-6">
          <div className="flex items-center gap-2 mb-6">
            {[1, 2, 3].map(s => (
              <React.Fragment key={s}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= s ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {s}
                </div>
                {s < 3 && <div className={`flex-1 h-1 rounded ${step > s ? 'bg-brand-600' : 'bg-slate-200'}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-8 pb-6">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-800">School Information</h2>
              <p className="text-sm text-slate-500">Enter your school details. This will appear on all timetables.</p>

              <Input label="School Name *" value={school.name} onChange={e => setSchool({ ...school, name: e.target.value })} placeholder="Enter school name" />

              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">School Logo</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden bg-slate-50">
                    {school.logo ? (
                      <img src={school.logo} alt="School logo" className="w-full h-full object-contain" />
                    ) : (
                      <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label>
                      <input type="file" accept="image/png,image/jpeg,image/jpg,image/svg+xml" onChange={handleLogoUpload} className="hidden" />
                      <span className="inline-block px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 cursor-pointer">
                        Upload Logo
                      </span>
                    </label>
                    {school.logo && (
                      <button onClick={() => { setSchool({ ...school, logo: null }); sounds.click() }} className="text-xs text-red-500 hover:text-red-600">
                        Remove Logo
                      </button>
                    )}
                    <p className="text-xs text-slate-400">PNG, JPG or SVG. Max 2MB.</p>
                  </div>
                </div>
              </div>

              <Input label="School Motto" value={school.motto} onChange={e => setSchool({ ...school, motto: e.target.value })} placeholder="Enter school motto" />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Academic Year *" value={school.academicYear} onChange={e => setSchool({ ...school, academicYear: e.target.value })} placeholder="Enter academic year" />
                <Select label="Term" value={school.term} onChange={e => setSchool({ ...school, term: e.target.value })} options={
                  <>
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Term 3">Term 3</option>
                    <option value="Semester 1">Semester 1</option>
                    <option value="Semester 2">Semester 2</option>
                  </>
                } />
              </div>
              <Input label="Address" value={school.address} onChange={e => setSchool({ ...school, address: e.target.value })} placeholder="Enter address" />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Phone" value={school.phone} onChange={e => setSchool({ ...school, phone: e.target.value })} placeholder="Enter phone number" />
                <Input label="Email" value={school.email} onChange={e => setSchool({ ...school, email: e.target.value })} placeholder="Enter email" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-800">School Days</h2>
              <p className="text-sm text-slate-500">Select the days your school operates.</p>
              <div className="grid grid-cols-2 gap-3">
                {DAYS.map(day => (
                  <button
                    key={day}
                    onClick={() => handleDayToggle(day)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${
                      selectedDays.includes(day)
                        ? 'border-brand-600 bg-brand-50 text-brand-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selectedDays.includes(day) ? 'border-brand-600 bg-brand-600' : 'border-slate-300'
                    }`}>
                      {selectedDays.includes(day) && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm font-medium">{day}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-800">Period Settings</h2>
              <p className="text-sm text-slate-500">How many teaching periods per day? (A break will be added automatically)</p>

              <div className="bg-brand-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Number of Periods: <span className="text-brand-700 font-bold">{numPeriods}</span></label>
                <input
                  type="range"
                  min="4"
                  max="12"
                  value={numPeriods}
                  onChange={e => { setNumPeriods(Number(e.target.value)); sounds.click() }}
                  className="w-full accent-brand-600"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>4</span><span>8</span><span>12</span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-600">
                  Starting at <strong>08:00</strong>, each period will be <strong>40 minutes</strong> with a <strong>20-minute break</strong> after period 4.
                  You can adjust exact times later in Settings.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <Button
            variant="ghost"
            onClick={() => { if (step > 1) { setStep(step - 1); sounds.click() } }}
            disabled={step === 1}
          >
            Back
          </Button>
          {step < 3 ? (
            <Button
              onClick={() => { if (canProceed()) { setStep(step + 1); sounds.click() } }}
              disabled={!canProceed()}
            >
              Continue
            </Button>
          ) : (
            <Button variant="success" onClick={handleFinish} disabled={!canProceed() || finishing}>
              {finishing ? 'Setting up...' : 'Complete Setup'}
            </Button>
          )}
        </div>

        {/* Loading Overlay */}
        {finishing && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl z-10">
            <img src="./logo.png" alt="Shikola logo" className="w-16 h-16 rounded-xl object-contain mb-6 animate-pulse" />
            <h2 className="text-lg font-bold text-slate-800 mb-2">Setting up your workspace...</h2>
            <p className="text-sm text-slate-500">Preparing your timetable environment</p>
            <div className="mt-6 w-48">
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full animate-pulse" style={{ width: '100%' }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
