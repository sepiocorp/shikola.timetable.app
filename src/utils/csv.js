import Papa from 'papaparse'
import { sounds } from './sounds'

const TEMPLATES = {
  teachers: {
    filename: 'teachers_template.csv',
    headers: ['name', 'code', 'subjects', 'maxPeriods'],
    sampleRows: [
      ['Teacher Name 1', 'TCH001', 'Subject 1;Subject 2', '6'],
      ['Teacher Name 2', 'TCH002', 'Subject 3;Subject 4', '5'],
    ],
  },
  classes: {
    filename: 'classes_template.csv',
    headers: ['name', 'grade', 'section', 'classTeacher'],
    sampleRows: [
      ['Class Name 1', '10', 'A', 'Teacher Name 1'],
      ['Class Name 2', '10', 'B', 'Teacher Name 2'],
    ],
  },
  subjects: {
    filename: 'subjects_template.csv',
    headers: ['name', 'code', 'color', 'isOptional', 'secondaryClass'],
    sampleRows: [
      ['Subject 1', 'SUB1', '#3b82f6', 'no', ''],
      ['Subject 2', 'SUB2', '#22c55e', 'yes', 'Class Name 1'],
    ],
  },
  departments: {
    filename: 'departments_template.csv',
    headers: ['name', 'code', 'headTeacher'],
    sampleRows: [
      ['Mathematics', 'MATH', 'Teacher Name 1'],
      ['English', 'ENG', 'Teacher Name 2'],
      ['Science', 'SCI', ''],
    ],
  },
  deptTeachers: {
    filename: 'dept_teacher_assignments_template.csv',
    headers: ['teacherName', 'departmentName'],
    sampleRows: [
      ['Teacher Name 1', 'Mathematics'],
      ['Teacher Name 2', 'English'],
      ['Teacher Name 3', 'Science'],
    ],
  },
  deptSubjects: {
    filename: 'dept_subject_assignments_template.csv',
    headers: ['subjectName', 'departmentName'],
    sampleRows: [
      ['Mathematics', 'Mathematics'],
      ['Further Maths', 'Mathematics'],
      ['English Language', 'English'],
      ['Physics', 'Science'],
    ],
  },
}

export function downloadCSVTemplate(type) {
  const template = TEMPLATES[type]
  if (!template) return

  const data = [template.headers, ...template.sampleRows]
  const csv = Papa.unparse(data)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  const ts = (() => {
    const d = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  })()
  link.download = template.filename.replace('.csv', `_${ts}.csv`)
  link.click()
  URL.revokeObjectURL(url)
  sounds.click()
}

export function parseCSVFile(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data)
      },
      error: (err) => {
        reject(err)
      },
    })
  })
}
