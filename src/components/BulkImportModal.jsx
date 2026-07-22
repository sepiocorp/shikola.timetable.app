import React, { useState, useRef } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { sounds } from '../utils/sounds.js'
import { downloadCSVTemplate, parseCSVFile } from '../utils/csv.js'
import { Button, Modal } from './UI.jsx'

const CONFIG = {
  teachers: {
    title: 'Bulk Import Teachers',
    action: 'BULK_ADD_TEACHERS',
    columns: ['name', 'subjects', 'classes', 'maxPeriods'],
    required: ['name'],
  },
  classes: {
    title: 'Bulk Import Classes',
    action: 'BULK_ADD_CLASSES',
    columns: ['name', 'grade', 'section', 'classTeacher'],
    required: ['name'],
  },
  subjects: {
    title: 'Bulk Import Subjects',
    action: 'BULK_ADD_SUBJECTS',
    columns: ['name', 'code', 'color', 'isOptional', 'secondaryClass'],
    required: ['name'],
  },
  departments: {
    title: 'Bulk Import Departments',
    action: 'BULK_ADD_DEPARTMENTS',
    columns: ['name', 'code', 'headTeacher'],
    required: ['name'],
  },
  deptTeachers: {
    title: 'Bulk Assign Teachers to Departments',
    action: 'BULK_ASSIGN_TEACHERS_DEPT',
    columns: ['teacherName', 'departmentName'],
    required: ['teacherName', 'departmentName'],
  },
  deptSubjects: {
    title: 'Bulk Assign Subjects to Departments',
    action: 'BULK_ASSIGN_SUBJECTS_DEPT',
    columns: ['subjectName', 'departmentName'],
    required: ['subjectName', 'departmentName'],
  },
}

export default function BulkImportModal({ open, onClose, type }) {
  const { state, dispatch } = useApp()
  const config = CONFIG[type]
  const fileRef = useRef(null)
  const [parsedData, setParsedData] = useState(null)
  const [errors, setErrors] = useState([])
  const [fileName, setFileName] = useState('')
  const [importing, setImporting] = useState(false)

  const reset = () => {
    setParsedData(null)
    setErrors([])
    setFileName('')
    setImporting(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    sounds.click()
    try {
      const rows = await parseCSVFile(file)
      const errs = []
      const valid = []

      rows.forEach((row, idx) => {
        const rowErrors = []
        for (const req of config.required) {
          if (!row[req] || !String(row[req]).trim()) {
            rowErrors.push(`Row ${idx + 2}: missing required field "${req}"`)
          }
        }

        if (type === 'departments') {
          let headTeacherId = ''
          if (row.headTeacher && String(row.headTeacher).trim()) {
            const teacher = state.teachers.find(t => t.name.toLowerCase() === String(row.headTeacher).trim().toLowerCase())
            if (teacher) {
              headTeacherId = teacher.id
            } else {
              rowErrors.push(`Row ${idx + 2}: head teacher not found: "${row.headTeacher}"`)
            }
          }
          if (rowErrors.length === 0) {
            valid.push({
              name: row.name.trim(),
              code: (row.code || '').trim(),
              headTeacherId,
            })
          }
        } else if (type === 'deptTeachers') {
          const teacher = state.teachers.find(t => t.name.toLowerCase() === String(row.teacherName).trim().toLowerCase())
          if (!teacher) {
            rowErrors.push(`Row ${idx + 2}: teacher not found: "${row.teacherName}"`)
          }
          const dept = state.departments.find(d => d.name.toLowerCase() === String(row.departmentName).trim().toLowerCase())
          if (!dept) {
            rowErrors.push(`Row ${idx + 2}: department not found: "${row.departmentName}"`)
          }
          if (rowErrors.length === 0) {
            valid.push({ id: teacher.id, departmentId: dept.id })
          }
        } else if (type === 'deptSubjects') {
          const subject = state.subjects.find(s => s.name.toLowerCase() === String(row.subjectName).trim().toLowerCase())
          if (!subject) {
            rowErrors.push(`Row ${idx + 2}: subject not found: "${row.subjectName}"`)
          }
          const dept = state.departments.find(d => d.name.toLowerCase() === String(row.departmentName).trim().toLowerCase())
          if (!dept) {
            rowErrors.push(`Row ${idx + 2}: department not found: "${row.departmentName}"`)
          }
          if (rowErrors.length === 0) {
            valid.push({ id: subject.id, departmentId: dept.id })
          }
        } else if (type === 'teachers') {
          const subjectNames = (row.subjects || '').split(';').map(s => s.trim()).filter(Boolean)
          const subjectIds = []
          const subjectUnmatched = []
          for (const sName of subjectNames) {
            const subj = state.subjects.find(s => s.name.toLowerCase() === sName.toLowerCase())
            if (subj) {
              subjectIds.push(subj.id)
            } else {
              subjectUnmatched.push(sName)
            }
          }
          if (subjectUnmatched.length > 0) {
            rowErrors.push(`Row ${idx + 2}: subjects not found: ${subjectUnmatched.join(', ')}`)
          }

          const classNames = (row.classes || '').split(';').map(c => c.trim()).filter(Boolean)
          const classIds = []
          const classUnmatched = []
          for (const cName of classNames) {
            const cls = state.classes.find(c => c.name.toLowerCase() === cName.toLowerCase())
            if (cls) {
              classIds.push(cls.id)
            } else {
              classUnmatched.push(cName)
            }
          }
          if (classUnmatched.length > 0) {
            rowErrors.push(`Row ${idx + 2}: classes not found: ${classUnmatched.join(', ')}`)
          }

          if (rowErrors.length === 0) {
            valid.push({
              name: row.name.trim(),
              subjects: subjectIds,
              classes: classIds,
              maxPeriods: Number(row.maxPeriods) || 6,
            })
          }
        } else if (type === 'classes') {
          let teacherId = ''
          if (row.classTeacher && String(row.classTeacher).trim()) {
            const teacher = state.teachers.find(t => t.name.toLowerCase() === String(row.classTeacher).trim().toLowerCase())
            if (teacher) {
              teacherId = teacher.id
            } else {
              rowErrors.push(`Row ${idx + 2}: teacher not found: "${row.classTeacher}"`)
            }
          }
          if (rowErrors.length === 0) {
            valid.push({
              name: row.name.trim(),
              grade: (row.grade || '').trim(),
              section: (row.section || '').trim(),
              classTeacher: teacherId,
            })
          }
        } else if (type === 'subjects') {
          if (rowErrors.length === 0) {
            const isOptional = String(row.isOptional || '').trim().toLowerCase() === 'yes' || String(row.isOptional || '').trim() === 'true'
            let secondaryClassId = ''
            if (isOptional && row.secondaryClass && String(row.secondaryClass).trim()) {
              const cls = state.classes.find(c => c.name.toLowerCase() === String(row.secondaryClass).trim().toLowerCase())
              if (cls) {
                secondaryClassId = cls.id
              } else {
                rowErrors.push(`Row ${idx + 2}: secondary class not found: "${row.secondaryClass}"`)
              }
            }
            if (rowErrors.length === 0) {
              valid.push({
                name: row.name.trim(),
                code: (row.code || '').trim(),
                color: (row.color || '#3b82f6').trim(),
                isOptional,
                secondaryClassId,
              })
            }
          }
        }

        errs.push(...rowErrors)
      })

      setParsedData(valid)
      setErrors(errs)
    } catch (err) {
      setErrors([`Failed to parse CSV: ${err.message}`])
      setParsedData(null)
    }
  }

  const handleImport = () => {
    if (!parsedData || parsedData.length === 0) return
    setImporting(true)
    dispatch({ type: config.action, payload: parsedData })
    sounds.add()
    setTimeout(() => {
      setImporting(false)
      reset()
      onClose()
    }, 500)
  }

  if (!config) return null

  return (
    <Modal open={open} onClose={handleClose} title={config.title} maxWidth="max-w-2xl">
      <div className="space-y-5">
        {/* Download Template */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div>
            <p className="text-sm font-medium text-slate-700">CSV Template</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Download a template with the correct column headers and sample data.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => downloadCSVTemplate(type)}>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Template
            </span>
          </Button>
        </div>

        {/* File Upload */}
        <div
          className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-brand-400 hover:bg-brand-50/30 transition-all"
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileSelect}
          />
          <svg className="w-10 h-10 mx-auto text-slate-400 mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          {fileName ? (
            <div>
              <p className="text-sm font-medium text-slate-700">{fileName}</p>
              <p className="text-xs text-slate-500 mt-1">Click to choose a different file</p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-slate-700">Click to upload a CSV file</p>
              <p className="text-xs text-slate-500 mt-1">Only .csv files are supported</p>
            </div>
          )}
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-700 mb-2">
              {errors.length} error(s) found:
            </p>
            <ul className="text-xs text-red-600 space-y-1 max-h-32 overflow-auto">
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Preview */}
        {parsedData && parsedData.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-slate-700">
                Preview ({parsedData.length} valid row(s))
              </p>
              {errors.length > 0 && (
                <p className="text-xs text-amber-600">
                  {errors.length} row(s) will be skipped due to errors
                </p>
              )}
            </div>
            <div className="border border-slate-200 rounded-lg overflow-auto max-h-64">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                  <tr>
                    {config.columns.map(col => (
                      <th key={col} className="px-3 py-2 text-left font-medium text-slate-600 whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedData.slice(0, 50).map((row, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      {config.columns.map(col => {
                        let display = row[col]
                        if (col === 'subjects' && type === 'teachers') {
                          display = (row[col] || [])
                            .map(id => state.subjects.find(s => s.id === id)?.name)
                            .filter(Boolean).join('; ')
                        }
                        if (col === 'classes' && type === 'teachers') {
                          display = (row[col] || [])
                            .map(id => state.classes.find(c => c.id === id)?.name)
                            .filter(Boolean).join('; ')
                        }
                        if (col === 'classTeacher' && type === 'classes') {
                          display = state.teachers.find(t => t.id === row[col])?.name || ''
                        }
                        if (col === 'headTeacher' && type === 'departments') {
                          display = state.teachers.find(t => t.id === row.headTeacherId)?.name || ''
                        }
                        if (col === 'departmentName' && (type === 'deptTeachers' || type === 'deptSubjects')) {
                          display = state.departments.find(d => d.id === row.departmentId)?.name || ''
                        }
                        if (col === 'teacherName' && type === 'deptTeachers') {
                          display = state.teachers.find(t => t.id === row.id)?.name || ''
                        }
                        if (col === 'subjectName' && type === 'deptSubjects') {
                          display = state.subjects.find(s => s.id === row.id)?.name || ''
                        }
                        if (col === 'isOptional' && type === 'subjects') {
                          display = row[col] ? 'Yes' : 'No'
                        }
                        if (col === 'secondaryClass' && type === 'subjects') {
                          display = row[col] ? state.classes.find(c => c.id === row[col])?.name || '' : ''
                        }
                        return (
                          <td key={col} className="px-3 py-2 text-slate-700 whitespace-nowrap">
                            {display || '—'}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                  {parsedData.length > 50 && (
                    <tr>
                      <td colSpan={config.columns.length} className="px-3 py-2 text-center text-slate-400">
                        ...and {parsedData.length - 50} more row(s)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleImport}
            disabled={!parsedData || parsedData.length === 0 || importing}
          >
            {importing ? 'Importing...' : `Import ${parsedData?.length || 0} ${type}`}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
