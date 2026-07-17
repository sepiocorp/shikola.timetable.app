import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import ExcelJS from 'exceljs'
import { sounds } from './sounds'

function timestamp() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

const PAPER_SIZES = {
  a4: { w: 210, h: 297 },
  a3: { w: 297, h: 420 },
  a2: { w: 420, h: 594 },
  a1: { w: 594, h: 841 },
}

function addLogoToPDF(pdf, school, pageW) {
  if (!school?.logo) return 0
  try {
    const logoSize = 14
    const logoX = pageW / 2 - logoSize / 2
    const logoY = 4
    const isPng = school.logo.startsWith('data:image/png')
    const isJpg = school.logo.startsWith('data:image/jpeg') || school.logo.startsWith('data:image/jpg')
    if (isPng) {
      pdf.addImage(school.logo, 'PNG', logoX, logoY, logoSize, logoSize)
    } else if (isJpg) {
      pdf.addImage(school.logo, 'JPEG', logoX, logoY, logoSize, logoSize)
    } else {
      return 0
    }
    return logoSize + 4
  } catch (e) {
    console.warn('Failed to add logo to PDF:', e)
    return 0
  }
}

export function exportTimetablePDF({ title, subtitle, days, periods, rows, paperSize, orientation, school, periodLabel }) {
  const dims = PAPER_SIZES[paperSize]
  if (!dims) return

  const isLandscape = orientation === 'landscape'
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: paperSize,
  })

  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()

  // Header
  let headerY = 15
  if (school?.name) {
    const logoOffset = addLogoToPDF(pdf, school, pageW)
    headerY = 15 + logoOffset
    pdf.setFontSize(16)
    pdf.setTextColor(30, 64, 175)
    pdf.text(school.name, pageW / 2, headerY, { align: 'center' })
    pdf.setFontSize(10)
    pdf.setTextColor(100, 100, 100)
    if (school.motto) pdf.text(school.motto, pageW / 2, headerY + 6, { align: 'center' })
    if (school.address) pdf.text(school.address, pageW / 2, headerY + 11, { align: 'center' })
    headerY += 16
  }

  // Title
  pdf.setFontSize(14)
  pdf.setTextColor(30, 64, 175)
  const titleY = school?.name ? headerY + 4 : 18
  pdf.text(title, pageW / 2, titleY, { align: 'center' })

  if (subtitle) {
    pdf.setFontSize(10)
    pdf.setTextColor(80, 80, 80)
    pdf.text(subtitle, pageW / 2, titleY + 5, { align: 'center' })
  }

  if (periodLabel) {
    pdf.setFontSize(9)
    pdf.setTextColor(100, 100, 100)
    pdf.text(periodLabel, pageW / 2, titleY + 10, { align: 'center' })
  }

  // Table — include ALL periods (with breaks) and show times
  const allPeriods = periods
  const head = [['Day / Period', ...allPeriods.map(p => `${p.name}\n${p.start}-${p.end}`)]]
  const body = days.map(day => {
    const row = [day]
    for (const p of allPeriods) {
      if (p.isBreak) {
        row.push('Break')
        continue
      }
      const cellData = rows[day]?.[p.id]
      row.push(cellData || '—')
    }
    return row
  })

  const tableStartY = school?.name ? (school?.logo ? 50 : 45) : 30
  const scale = pageW / 210
  const margin = 5 * scale
  const availableWidth = pageW - 2 * margin
  const dayColWidth = 22 * scale
  const periodColWidth = (availableWidth - dayColWidth) / allPeriods.length

  // Identify break column indices for styling
  const breakColIndices = allPeriods.map((p, i) => p.isBreak ? i + 1 : -1).filter(i => i > 0)

  // Build columnStyles with equal widths for all period columns
  const colStyles = { 0: { fontStyle: 'bold', cellWidth: dayColWidth, fillColor: [219, 234, 254] } }
  for (let i = 1; i <= allPeriods.length; i++) {
    colStyles[i] = { cellWidth: periodColWidth }
  }

  autoTable(pdf, {
    head,
    body,
    startY: tableStartY,
    theme: 'grid',
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontSize: (isLandscape ? 7 : 6) * scale,
      halign: 'center',
      valign: 'middle',
      cellPadding: 1 * scale,
    },
    bodyStyles: {
      fontSize: (isLandscape ? 7 : 6) * scale,
      halign: 'center',
      valign: 'middle',
      cellPadding: 1 * scale,
      overflow: 'linebreak',
    },
    alternateRowStyles: {
      fillColor: [239, 246, 255],
    },
    columnStyles: colStyles,
    margin: { left: margin, right: margin },
    rowPageBreak: 'avoid',
    didParseCell: (data) => {
      // Style break columns with gray background
      if (data.section === 'head' && breakColIndices.includes(data.column.index)) {
        data.cell.styles.fillColor = [100, 116, 139]
        data.cell.styles.textColor = 255
        data.cell.styles.fontSize = (isLandscape ? 6 : 5) * scale
      }
      if (data.section === 'body' && breakColIndices.includes(data.column.index)) {
        data.cell.styles.fillColor = [241, 245, 249]
        data.cell.styles.textColor = [148, 163, 184]
        data.cell.styles.fontStyle = 'italic'
        data.cell.styles.fontSize = (isLandscape ? 6 : 5) * scale
      }
    },
  })

  // Footer
  const pageCount = pdf.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i)
    pdf.setFontSize(7)
    pdf.setTextColor(150, 150, 150)
    pdf.text(
      `Generated by Shikola Timetable Creator - Sepio Corp`,
      pageW / 2,
      pageH - 5,
      { align: 'center' }
    )
  }

  sounds.export()
  const filename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${paperSize}_${orientation}_${timestamp()}.pdf`
  pdf.save(filename)
}

export function exportMasterPDF({ days, periods, timetables, paperSize, orientation, school, periodLabel, title }) {
  const dims = PAPER_SIZES[paperSize]
  if (!dims) return

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: paperSize,
  })

  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const isLandscape = orientation === 'landscape'
  const scale = pageW / 210
  const margin = 5 * scale

  const allPeriods = periods

  function addFooter() {
    pdf.setFontSize(7)
    pdf.setTextColor(150, 150, 150)
    pdf.text('Generated by Shikola Timetable Creator - Sepio Corp', pageW / 2, pageH - 5, { align: 'center' })
  }

  function addPageHeader() {
    let headerY = 15
    if (school?.name) {
      const logoOffset = addLogoToPDF(pdf, school, pageW)
      headerY = 15 + logoOffset
      pdf.setFontSize(16)
      pdf.setTextColor(30, 64, 175)
      pdf.text(school.name, pageW / 2, headerY, { align: 'center' })
      headerY += 8
    }
    pdf.setFontSize(14)
    pdf.setTextColor(30, 64, 175)
    const titleY = school?.name ? headerY : 18
    pdf.text(title || 'Master Timetable', pageW / 2, titleY, { align: 'center' })
    pdf.setFontSize(8)
    pdf.setTextColor(80, 80, 80)
    pdf.text(periodLabel || 'All timetables combined', pageW / 2, titleY + 5, { align: 'center' })
  }

  // ── Part 1: Comprehensive Master Grid ──
  // Rows = periods (time blocks), Columns = days
  // Each cell = all classes with Subject - Teacher - Room
  addPageHeader()

  const gridStartY = school?.name ? (school?.logo ? 40 : 35) : 28
  const gridHead = [['Period', ...days]]
  const gridBody = allPeriods.map(p => {
    const row = [`${p.name}\n${p.start}-${p.end}`]
    for (const day of days) {
      if (p.isBreak) {
        row.push('Break')
        continue
      }
      const entries = timetables.filter(e => e.day === day && e.periodId === p.id)
      if (entries.length === 0) {
        row.push('—')
      } else {
        const cellText = entries.map(e => {
          let line = `${e.subjectName || ''} - ${e.className || ''} (${e.teacherName || ''})`
          if (e.roomName) line += ` [${e.roomName}]`
          if (e.secondaryClassName) {
            line += `\n  → ${e.secondarySubjectName || ''} - ${e.secondaryClassName} (${e.secondaryTeacherName || ''})`
          }
          return line
        }).join('\n')
        row.push(cellText)
      }
    }
    return row
  })

  const gridAvailW = pageW - 2 * margin
  const gridPeriodColW = 28 * scale
  const gridDayColW = (gridAvailW - gridPeriodColW) / days.length

  // Identify break row indices for styling
  const breakRowIndices = allPeriods.map((p, i) => p.isBreak ? i : -1).filter(i => i >= 0)

  // Build columnStyles with equal widths for all day columns
  const gridColStyles = { 0: { fontStyle: 'bold', cellWidth: gridPeriodColW, fillColor: [219, 234, 254], fontSize: (isLandscape ? 6 : 5) * scale } }
  for (let i = 1; i <= days.length; i++) {
    gridColStyles[i] = { cellWidth: gridDayColW }
  }

  autoTable(pdf, {
    head: gridHead,
    body: gridBody,
    startY: gridStartY,
    theme: 'grid',
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontSize: (isLandscape ? 7 : 6) * scale,
      halign: 'center',
      valign: 'middle',
      cellPadding: 1 * scale,
    },
    bodyStyles: {
      fontSize: (isLandscape ? 5 : 4) * scale,
      halign: 'center',
      valign: 'top',
      cellPadding: 1 * scale,
      lineWidth: 0.1 * scale,
      overflow: 'linebreak',
    },
    alternateRowStyles: {
      fillColor: [239, 246, 255],
    },
    columnStyles: gridColStyles,
    margin: { left: margin, right: margin },
    rowPageBreak: 'avoid',
    didParseCell: (data) => {
      // Style break rows with gray background
      if (data.section === 'body' && breakRowIndices.includes(data.row.index)) {
        data.cell.styles.fillColor = [241, 245, 249]
        data.cell.styles.textColor = [148, 163, 184]
        data.cell.styles.fontStyle = 'italic'
      }
    },
    didDrawPage: addFooter,
  })

  // ── Part 2: Teacher-wise sub-tables ──
  // Group entries by teacher
  const teacherMap = new Map()
  for (const e of timetables) {
    const primaryId = e.teacherId
    const secondaryId = e.secondaryTeacherId
    if (primaryId) {
      if (!teacherMap.has(primaryId)) {
        teacherMap.set(primaryId, { id: primaryId, name: e.teacherName || '', entries: [] })
      }
      teacherMap.get(primaryId).entries.push(e)
    }
    if (secondaryId && secondaryId !== primaryId) {
      if (!teacherMap.has(secondaryId)) {
        teacherMap.set(secondaryId, { id: secondaryId, name: e.secondaryTeacherName || '', entries: [] })
      }
      teacherMap.get(secondaryId).entries.push(e)
    }
  }

  const teachers = Array.from(teacherMap.values()).sort((a, b) => a.name.localeCompare(b.name))

  for (const teacher of teachers) {
    pdf.addPage()

    // Teacher name heading
    let currentY = 20
    if (school?.name) {
      const logoOffset = addLogoToPDF(pdf, school, pageW)
      pdf.setFontSize(14)
      pdf.setTextColor(30, 64, 175)
      pdf.text(school.name, pageW / 2, 12 + logoOffset, { align: 'center' })
      currentY = 22 + logoOffset
    }

    pdf.setFontSize(12)
    pdf.setTextColor(30, 64, 175)
    pdf.text(`Teacher: ${teacher.name}`, pageW / 2, currentY, { align: 'center' })
    currentY += 6

    if (periodLabel) {
      pdf.setFontSize(8)
      pdf.setTextColor(80, 80, 80)
      pdf.text(periodLabel, pageW / 2, currentY, { align: 'center' })
      currentY += 4
    }

    // Build table: rows = days, columns = periods (with time + breaks)
    const head = [['Day / Period', ...allPeriods.map(p => `${p.name}\n${p.start}-${p.end}`)]]
    const body = days.map(day => {
      const row = [day]
      for (const p of allPeriods) {
        if (p.isBreak) {
          row.push('Break')
          continue
        }
        const entries = teacher.entries.filter(e => e.day === day && e.periodId === p.id && (e.teacherId === teacher.id || e.secondaryTeacherId === teacher.id))
        if (entries.length === 0) {
          row.push('—')
        } else {
          const cellText = entries.map(e => {
            const isSecondary = e.secondaryTeacherId === teacher.id && e.teacherId !== teacher.id
            if (isSecondary) {
              return `${e.secondarySubjectName || ''} (${e.secondaryClassName || ''})`
            }
            let line = `${e.subjectName || ''} (${e.className || ''})`
            if (e.roomName) line += `\n[${e.roomName}]`
            if (e.secondaryClassName) {
              line += `\n  → ${e.secondarySubjectName || ''} (${e.secondaryClassName}: ${e.secondaryTeacherName || ''})`
            }
            return line
          }).join('\n')
          row.push(cellText)
        }
      }
      return row
    })

    const teacherAvailW = pageW - 2 * margin
    const teacherDayColW = 22 * scale
    const teacherPeriodColW = (teacherAvailW - teacherDayColW) / allPeriods.length

    // Identify break column indices for styling
    const teacherBreakCols = allPeriods.map((p, i) => p.isBreak ? i + 1 : -1).filter(i => i > 0)

    // Build columnStyles with equal widths for all period columns
    const teacherColStyles = { 0: { fontStyle: 'bold', cellWidth: teacherDayColW, fillColor: [219, 234, 254] } }
    for (let i = 1; i <= allPeriods.length; i++) {
      teacherColStyles[i] = { cellWidth: teacherPeriodColW }
    }

    autoTable(pdf, {
      head,
      body,
      startY: currentY,
      theme: 'grid',
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontSize: (isLandscape ? 7 : 6) * scale,
        halign: 'center',
        valign: 'middle',
        cellPadding: 1 * scale,
      },
      bodyStyles: {
        fontSize: (isLandscape ? 6 : 5) * scale,
        halign: 'center',
        valign: 'middle',
        cellPadding: 1 * scale,
        overflow: 'linebreak',
      },
      alternateRowStyles: {
        fillColor: [239, 246, 255],
      },
      columnStyles: teacherColStyles,
      margin: { left: margin, right: margin },
      rowPageBreak: 'avoid',
      didParseCell: (data) => {
        if (data.section === 'head' && teacherBreakCols.includes(data.column.index)) {
          data.cell.styles.fillColor = [100, 116, 139]
          data.cell.styles.textColor = 255
        }
        if (data.section === 'body' && teacherBreakCols.includes(data.column.index)) {
          data.cell.styles.fillColor = [241, 245, 249]
          data.cell.styles.textColor = [148, 163, 184]
          data.cell.styles.fontStyle = 'italic'
        }
      },
      didDrawPage: addFooter,
    })
  }

  sounds.export()
  const namePart = title ? title.replace(/[^a-zA-Z0-9]/g, '_') : 'Master_Timetable'
  pdf.save(`${namePart}_${paperSize}_${orientation}_${timestamp()}.pdf`)
}

const thinBorder = {
  top: { style: 'thin', color: { argb: 'FFB0B0B0' } },
  left: { style: 'thin', color: { argb: 'FFB0B0B0' } },
  bottom: { style: 'thin', color: { argb: 'FFB0B0B0' } },
  right: { style: 'thin', color: { argb: 'FFB0B0B0' } },
}

const headerFill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF2563EB' },
}

const dayFill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFDBEAFE' },
}

const altFill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFEFF6FF' },
}

async function saveWorkbook(workbook, filename) {
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export async function exportCSV({ title, days, periods, rows }) {
  const allPeriods = periods
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Timetable')

  const breakFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF1F5F9' },
  }

  const headers = ['Day / Period', ...allPeriods.map(p => `${p.name}\n(${p.start}-${p.end})`)]
  const headerRow = ws.addRow(headers)
  headerRow.height = 30
  headerRow.eachCell((cell, colNumber) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
    cell.fill = headerFill
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    cell.border = thinBorder
    if (colNumber > 1 && allPeriods[colNumber - 2]?.isBreak) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF64748B' } }
    }
  })

  days.forEach((day, dayIdx) => {
    const rowData = [day]
    const cellLines = []
    const cellIsBreak = []
    for (const p of allPeriods) {
      if (p.isBreak) {
        rowData.push('Break')
        cellLines.push(null)
        cellIsBreak.push(true)
      } else {
        const cellText = rows[day]?.[p.id]
        if (cellText) {
          const lines = cellText.split('\n').filter(l => l.trim())
          rowData.push(lines.join('\n'))
          cellLines.push(lines)
        } else {
          rowData.push('—')
          cellLines.push(null)
        }
        cellIsBreak.push(false)
      }
    }
    const row = ws.addRow(rowData)
    row.height = 45
    row.eachCell((cell, colNumber) => {
      cell.border = thinBorder
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      if (colNumber === 1) {
        cell.font = { bold: true, color: { argb: 'FF1E40AF' } }
        cell.fill = dayFill
      } else {
        const isBreak = cellIsBreak[colNumber - 2]
        if (isBreak) {
          cell.font = { italic: true, color: { argb: 'FF94A3B8' }, size: 10 }
          cell.fill = breakFill
        } else {
          const lines = cellLines[colNumber - 2]
          if (lines && lines.length > 1) {
            cell.value = {
              richText: lines.map((line, i) => ({
                font: { bold: i === 0, size: i === 0 ? 11 : 10 },
                text: i < lines.length - 1 ? line + '\n' : line,
              }))
            }
          } else {
            cell.font = { size: 11, bold: true }
          }
          if (dayIdx % 2 === 1) cell.fill = altFill
        }
      }
    })
  })

  ws.columns.forEach((col, i) => {
    col.width = i === 0 ? 18 : 28
  })

  await saveWorkbook(wb, `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp()}.xlsx`)
  sounds.export()
}

export async function exportMasterCSV({ days, periods, timetables, periodLabel }) {
  const allPeriods = periods
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Master Timetable')

  const breakFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF1F5F9' },
  }

  const headers = ['Day', 'Period', 'Time', 'Subject', 'Class', 'Teacher', 'Room', 'Secondary Subject', 'Secondary Class', 'Secondary Teacher']
  const headerRow = ws.addRow(headers)
  headerRow.height = 25
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
    cell.fill = headerFill
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = thinBorder
  })

  let rowIdx = 0
  for (const day of days) {
    for (const p of allPeriods) {
      if (p.isBreak) {
        const row = ws.addRow([day, p.name, `${p.start}-${p.end}`, 'Break', '', '', '', '', '', ''])
        row.eachCell((cell, colNumber) => {
          cell.border = thinBorder
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
          if (colNumber === 1) { cell.font = { bold: true } }
          if (colNumber === 4) { cell.font = { italic: true, color: { argb: 'FF94A3B8' } } }
          cell.fill = breakFill
        })
        rowIdx++
        continue
      }
      const entries = timetables.filter(e => e.day === day && e.periodId === p.id)
      if (entries.length === 0) {
        const row = ws.addRow([day, p.name, `${p.start}-${p.end}`, '', '', '', '', '', '', ''])
        row.eachCell((cell, colNumber) => {
          cell.border = thinBorder
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
          if (colNumber === 1) { cell.font = { bold: true } }
          if (rowIdx % 2 === 1) cell.fill = altFill
        })
        rowIdx++
      } else {
        for (const e of entries) {
          const row = ws.addRow([day, p.name, `${p.start}-${p.end}`, e.subjectName, e.className, e.teacherName, e.roomName, e.secondarySubjectName || '', e.secondaryClassName || '', e.secondaryTeacherName || ''])
          row.eachCell((cell, colNumber) => {
            cell.border = thinBorder
            cell.alignment = { horizontal: 'center', vertical: 'middle' }
            if (colNumber === 1) { cell.font = { bold: true } }
            if (colNumber === 4) { cell.font = { bold: true, size: 12, color: { argb: 'FF1E40AF' } } }
            if (colNumber === 5) { cell.font = { color: { argb: 'FF059669' } } }
            if (rowIdx % 2 === 1) cell.fill = altFill
          })
          rowIdx++
        }
      }
    }
  }

  ws.columns.forEach((col, i) => {
    col.width = [10, 10, 12, 22, 16, 16, 12, 22, 16, 16][i] || 15
  })

  const suffix = periodLabel ? `_${periodLabel.replace(/[^a-zA-Z0-9]/g, '_')}` : ''
  await saveWorkbook(wb, `Master_Timetable${suffix}_${timestamp()}.xlsx`)
  sounds.export()
}

export function exportBulkPDF({ items, days, periods, school, paperSize, orientation, bulkType, periodLabel, getScheduleForClassFn }) {
  const pdf = new jsPDF({ orientation, unit: 'mm', format: paperSize })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const isLandscape = orientation === 'landscape'

  items.forEach((item, index) => {
    if (index > 0) pdf.addPage()

    const itemDays = item.schedule?.days || days
    const itemPeriods = item.schedule?.periods || periods
    const allItemPeriods = itemPeriods

    let startY = 18
    if (school?.name) {
      const logoOffset = addLogoToPDF(pdf, school, pageW)
      pdf.setFontSize(14)
      pdf.setTextColor(30, 64, 175)
      pdf.text(school.name, pageW / 2, 12 + logoOffset, { align: 'center' })
      startY = 22 + logoOffset
    }

    const titlePrefix = bulkType === 'classes' ? 'Class' : bulkType === 'teachers' ? 'Teacher' : 'Department'
    pdf.setFontSize(12)
    pdf.setTextColor(30, 64, 175)
    pdf.text(`${titlePrefix}: ${item.name}`, pageW / 2, startY, { align: 'center' })

    if (periodLabel) {
      pdf.setFontSize(8)
      pdf.setTextColor(80, 80, 80)
      pdf.text(periodLabel, pageW / 2, startY + 5, { align: 'center' })
      startY += 10
    } else {
      startY += 5
    }

    // Identify break column indices for styling
    const bulkBreakCols = allItemPeriods.map((p, i) => p.isBreak ? i + 1 : -1).filter(i => i > 0)

    let head, body
    if (bulkType === 'departments') {
      head = [['Day / Period', ...allItemPeriods.map(p => `${p.name}\n${p.start}-${p.end}`)]]
      body = itemDays.map(day => {
        const row = [day]
        for (const p of allItemPeriods) {
          if (p.isBreak) {
            row.push('Break')
            continue
          }
          const entries = item.deptMasterData.filter(e => e.day === day && e.periodId === p.id)
          if (entries.length === 0) {
            row.push('—')
          } else {
            const cellText = entries.map(e => {
              const teacher = e.teacherName || ''
              const cls = e.className || ''
              const subject = e.subjectName || ''
              let line = `${subject} - ${teacher} (${cls})`
              if (e.secondaryClassName) {
                line += `\n  → ${e.secondarySubjectName || ''} - ${e.secondaryTeacherName || ''} (${e.secondaryClassName})`
              }
              return line
            }).join('\n')
            row.push(cellText)
          }
        }
        return row
      })
    } else {
      head = [['Day / Period', ...allItemPeriods.map(p => `${p.name}\n${p.start}-${p.end}`)]]
      body = itemDays.map(day => {
        const row = [day]
        for (const p of allItemPeriods) {
          if (p.isBreak) {
            row.push('Break')
            continue
          }
          const cell = item.rows[day]?.[p.id]
          row.push(cell || '—')
        }
        return row
      })
    }

    const bulkScale = pageW / 210
    const bulkMargin = 5 * bulkScale
    const bulkAvailableWidth = pageW - 2 * bulkMargin
    const bulkDayColWidth = 22 * bulkScale
    const bulkPeriodColWidth = (bulkAvailableWidth - bulkDayColWidth) / allItemPeriods.length

    // Build columnStyles with equal widths for all period columns
    const bulkColStyles = { 0: { fontStyle: 'bold', cellWidth: bulkDayColWidth, fillColor: [219, 234, 254] } }
    for (let i = 1; i <= allItemPeriods.length; i++) {
      bulkColStyles[i] = { cellWidth: bulkPeriodColWidth }
    }

    autoTable(pdf, {
      head,
      body,
      startY,
      theme: 'grid',
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontSize: (isLandscape ? 7 : 6) * bulkScale,
        halign: 'center',
        valign: 'middle',
        cellPadding: 1 * bulkScale,
      },
      bodyStyles: {
        fontSize: (isLandscape ? 7 : 6) * bulkScale,
        halign: 'center',
        valign: bulkType === 'departments' ? 'top' : 'middle',
        cellPadding: 1 * bulkScale,
        overflow: 'linebreak',
      },
      alternateRowStyles: { fillColor: [239, 246, 255] },
      columnStyles: bulkColStyles,
      margin: { left: bulkMargin, right: bulkMargin },
      rowPageBreak: 'avoid',
      didParseCell: (data) => {
        if (data.section === 'head' && bulkBreakCols.includes(data.column.index)) {
          data.cell.styles.fillColor = [100, 116, 139]
          data.cell.styles.textColor = 255
          data.cell.styles.fontSize = (isLandscape ? 6 : 5) * bulkScale
        }
        if (data.section === 'body' && bulkBreakCols.includes(data.column.index)) {
          data.cell.styles.fillColor = [241, 245, 249]
          data.cell.styles.textColor = [148, 163, 184]
          data.cell.styles.fontStyle = 'italic'
          data.cell.styles.fontSize = (isLandscape ? 6 : 5) * bulkScale
        }
      },
    })

    pdf.setFontSize(7)
    pdf.setTextColor(150, 150, 150)
    pdf.text('Generated by Shikola Timetable Creator - Sepio Corp', pageW / 2, pageH - 5, { align: 'center' })
  })

  sounds.export()
  const suffix = periodLabel ? `_${periodLabel.replace(/[^a-zA-Z0-9]/g, '_')}` : ''
  pdf.save(`Bulk_${bulkType}_${paperSize}_${orientation}${suffix}_${timestamp()}.pdf`)
}

export async function exportBulkCSV({ items, days, periods, bulkType, periodLabel, getScheduleForClassFn }) {
  const wb = new ExcelJS.Workbook()
  const typeLabel = bulkType === 'classes' ? 'Class' : bulkType === 'teachers' ? 'Teacher' : 'Department'

  for (const item of items) {
    const itemDays = item.schedule?.days || days
    const itemPeriods = item.schedule?.periods || periods
    const allItemPeriods = itemPeriods
    const sheetName = item.name.substring(0, 31).replace(/[\\/\?\*\[\]:]/g, '_')
    const ws = wb.addWorksheet(sheetName)

    const breakFill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1F5F9' },
    }

    if (bulkType === 'departments') {
      const headers = ['Day', 'Period', 'Time', 'Subject', 'Teacher', 'Class', 'Room', 'Secondary Subject', 'Secondary Teacher', 'Secondary Class']
      const headerRow = ws.addRow(headers)
      headerRow.height = 25
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
        cell.fill = headerFill
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
        cell.border = thinBorder
      })

      let rowIdx = 0
      for (const day of itemDays) {
        for (const p of allItemPeriods) {
          if (p.isBreak) {
            const row = ws.addRow([day, p.name, `${p.start}-${p.end}`, 'Break', '', '', '', '', '', ''])
            row.eachCell((cell, colNumber) => {
              cell.border = thinBorder
              cell.alignment = { horizontal: 'center', vertical: 'middle' }
              if (colNumber === 1) { cell.font = { bold: true } }
              if (colNumber === 4) { cell.font = { italic: true, color: { argb: 'FF94A3B8' } } }
              cell.fill = breakFill
            })
            rowIdx++
            continue
          }
          const entries = item.deptMasterData.filter(e => e.day === day && e.periodId === p.id)
          if (entries.length === 0) {
            const row = ws.addRow([day, p.name, `${p.start}-${p.end}`, '', '', '', '', '', '', ''])
            row.eachCell((cell, colNumber) => {
              cell.border = thinBorder
              cell.alignment = { horizontal: 'center', vertical: 'middle' }
              if (colNumber === 1) { cell.font = { bold: true } }
              if (rowIdx % 2 === 1) cell.fill = altFill
            })
            rowIdx++
          } else {
            for (const e of entries) {
              const row = ws.addRow([day, p.name, `${p.start}-${p.end}`, e.subjectName, e.teacherName, e.className, e.roomName, e.secondarySubjectName || '', e.secondaryTeacherName || '', e.secondaryClassName || ''])
              row.eachCell((cell, colNumber) => {
                cell.border = thinBorder
                cell.alignment = { horizontal: 'center', vertical: 'middle' }
                if (colNumber === 1) { cell.font = { bold: true } }
                if (colNumber === 4) { cell.font = { bold: true, size: 12, color: { argb: 'FF1E40AF' } } }
                if (colNumber === 5) { cell.font = { color: { argb: 'FF059669' } } }
                if (rowIdx % 2 === 1) cell.fill = altFill
              })
              rowIdx++
            }
          }
        }
      }

      ws.columns.forEach((col, i) => {
        col.width = [10, 10, 12, 22, 16, 16, 12, 22, 16, 16][i] || 15
      })
    } else {
      const headers = ['Day / Period', ...allItemPeriods.map(p => `${p.name}\n(${p.start}-${p.end})`)]
      const headerRow = ws.addRow(headers)
      headerRow.height = 30
      headerRow.eachCell((cell, colNumber) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
        cell.fill = headerFill
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
        cell.border = thinBorder
        if (colNumber > 1 && allItemPeriods[colNumber - 2]?.isBreak) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF64748B' } }
        }
      })

      itemDays.forEach((day, dayIdx) => {
        const rowData = [day]
        const cellLines = []
        const cellIsBreak = []
        for (const p of allItemPeriods) {
          if (p.isBreak) {
            rowData.push('Break')
            cellLines.push(null)
            cellIsBreak.push(true)
          } else {
            const cellText = item.rows[day]?.[p.id]
            if (cellText) {
              const lines = cellText.split('\n').filter(l => l.trim())
              rowData.push(lines.join('\n'))
              cellLines.push(lines)
            } else {
              rowData.push('—')
              cellLines.push(null)
            }
            cellIsBreak.push(false)
          }
        }
        const row = ws.addRow(rowData)
        row.height = 45
        row.eachCell((cell, colNumber) => {
          cell.border = thinBorder
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
          if (colNumber === 1) {
            cell.font = { bold: true, color: { argb: 'FF1E40AF' } }
            cell.fill = dayFill
          } else {
            const isBreak = cellIsBreak[colNumber - 2]
            if (isBreak) {
              cell.font = { italic: true, color: { argb: 'FF94A3B8' }, size: 10 }
              cell.fill = breakFill
            } else {
              const lines = cellLines[colNumber - 2]
              if (lines && lines.length > 1) {
                cell.value = {
                  richText: lines.map((line, i) => ({
                    font: { bold: i === 0, size: i === 0 ? 11 : 10 },
                    text: i < lines.length - 1 ? line + '\n' : line,
                  }))
                }
              } else {
                cell.font = { size: 11, bold: true }
              }
              if (dayIdx % 2 === 1) cell.fill = altFill
            }
          }
        })
      })

      ws.columns.forEach((col, i) => {
        col.width = i === 0 ? 18 : 28
      })
    }
  }

  const suffix = periodLabel ? `_${periodLabel.replace(/[^a-zA-Z0-9]/g, '_')}` : ''
  await saveWorkbook(wb, `Bulk_${bulkType}${suffix}_${timestamp()}.xlsx`)
  sounds.export()
}
