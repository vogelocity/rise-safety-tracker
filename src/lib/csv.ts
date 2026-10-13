import type { ExportRow } from './db'

export const CSV_HEADERS = ['Site', 'Date', 'Technician', 'Equipment', 'Reading Type', 'Unit', 'Value']

function cell(text: string): string {
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function readingsToCsv(rows: ExportRow[]): string {
  const lines = [
    CSV_HEADERS,
    ...rows.map((r) => [r.site, r.date, r.technician, r.equipment, r.readingType, r.unit, r.value]),
  ]
  return lines.map((l) => l.map(cell).join(',')).join('\r\n') + '\r\n'
}

/** Starts a browser download. A UTF-8 BOM is added so Excel shows units such as Ω correctly. */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
