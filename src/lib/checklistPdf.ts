// Builds a letter-size PDF of one checklist. Plain data in, nothing from the DOM, so the sample script
// (scripts/checklist-pdf-sample.ts) can run the same code in Node. jsPDF is loaded on first export only.
import { checklistProgress, DEFICIENCIES_TITLE, groupChecklist } from './checklist'
import { formatDate } from './dates'

export interface ChecklistPdfInput {
  companyName: string
  footerText: string
  logo: { dataUrl: string; width: number; height: number } | null
  siteName: string
  date: string // ISO
  technician: string | null
  sections: ReturnType<typeof groupChecklist>
  deficiencies: string | null
  generatedOn: string // ISO, today's local date
}

const MARGIN = 48
const LINE = 13 // line height for 10pt text
const BOX = 9 // checkbox size
const BOX_GAP = 7 // space between the checkbox and its text

// jsPDF's built-in fonts only cover Western European characters. The ohm sign is the one that
// shows up in this app's data, so spell it out.
const pdfText = (s: string) => s.replace(/[ΩΩ]/g, 'ohm')

export async function buildChecklistPdf(input: ChecklistPdfInput): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const contentW = pageW - 2 * MARGIN
  const bottom = pageH - MARGIN
  let y = MARGIN

  const font = (style: 'normal' | 'bold', size: number) => {
    doc.setFont('helvetica', style)
    doc.setFontSize(size)
  }
  /** Starts a new page when the next `height` points would cross the bottom margin. */
  const ensure = (height: number) => {
    if (y + height > bottom) {
      doc.addPage()
      y = MARGIN
    }
  }

  // --- Header -------------------------------------------------------------------------------------
  const headerH = 40
  if (input.logo && input.logo.width > 0 && input.logo.height > 0) {
    const scale = Math.min(160 / input.logo.width, headerH / input.logo.height)
    const w = input.logo.width * scale
    const h = input.logo.height * scale
    try {
      doc.addImage(input.logo.dataUrl, 'PNG', MARGIN, y + (headerH - h) / 2, w, h)
    } catch {
      // A logo jsPDF cannot read is left out rather than failing the export.
    }
  }
  doc.setTextColor(20)
  font('bold', 15)
  doc.text('FACILITY INSPECTION CHECKLIST', pageW - MARGIN, y + 16, { align: 'right' })
  doc.setTextColor(90)
  font('normal', 9)
  doc.text(pdfText(input.companyName), pageW - MARGIN, y + 30, { align: 'right' })
  y += headerH + 8
  doc.setDrawColor(150)
  doc.setLineWidth(0.75)
  doc.line(MARGIN, y, pageW - MARGIN, y)
  y += 20

  // --- Info block ---------------------------------------------------------------------------------
  const items = input.sections.flatMap((s) => s.groups.flatMap((g) => g.items))
  const progress = checklistProgress(items)
  const info: [string, string][] = [
    ['Location', input.siteName],
    ['Date', formatDate(input.date)],
    ['Inspector', input.technician?.trim() ? input.technician : '__________'],
    ['Checked', `${progress.checked} of ${progress.total} items`],
  ]
  doc.setTextColor(20)
  for (const [label, value] of info) {
    font('bold', 10)
    const prefix = `${label}: `
    doc.text(prefix, MARGIN, y)
    const prefixW = doc.getTextWidth(prefix)
    font('normal', 10)
    const lines = doc.splitTextToSize(pdfText(value), contentW - prefixW) as string[]
    doc.text(lines, MARGIN + prefixW, y)
    y += lines.length * LINE + 2
  }
  y += 6

  // --- Sections -----------------------------------------------------------------------------------
  type Item = (typeof items)[number]
  const textW = contentW - BOX - BOX_GAP

  const itemLines = (item: Item): string[] => {
    font('normal', 10)
    if (item.kind === 'check') return doc.splitTextToSize(pdfText(item.label), textW) as string[]
    const value = item.value?.trim() ? item.value.trim() : '________'
    const text = [`${item.label}:`, value, item.unit ?? ''].filter((s) => s !== '').join(' ')
    return doc.splitTextToSize(pdfText(text), contentW) as string[]
  }
  const itemHeight = (item: Item) => itemLines(item).length * LINE + 4

  const SECTION_H = 26
  const GROUP_H = 18

  const drawSectionHeading = (title: string) => {
    y += 10
    font('bold', 12)
    doc.setTextColor(20)
    doc.text(pdfText(title), MARGIN, y + 10)
    y += SECTION_H - 10
  }
  const drawGroupHeading = (name: string) => {
    font('bold', 10)
    doc.setTextColor(20)
    doc.text(pdfText(name), MARGIN, y + 10)
    y += GROUP_H
  }
  const drawItem = (item: Item) => {
    const lines = itemLines(item)
    const baseline = y + 9
    doc.setTextColor(20)
    font('normal', 10)
    if (item.kind === 'check') {
      const top = baseline - 8
      doc.setDrawColor(90)
      doc.setLineWidth(0.75)
      doc.rect(MARGIN, top, BOX, BOX, 'S')
      if (item.checked) {
        doc.setDrawColor(20)
        doc.setLineWidth(1.4)
        doc.line(MARGIN + 1.8, top + 4.6, MARGIN + 3.8, top + 6.8)
        doc.line(MARGIN + 3.8, top + 6.8, MARGIN + 7.4, top + 2)
      }
      doc.text(lines, MARGIN + BOX + BOX_GAP, baseline)
    } else {
      doc.text(lines, MARGIN, baseline)
    }
    y += lines.length * LINE + 4
  }

  for (const section of input.sections) {
    const firstGroup = section.groups[0]
    const firstItem = firstGroup?.items[0]
    // Keep the heading with at least its first item (and that item's group heading).
    ensure(SECTION_H + (firstGroup?.name ? GROUP_H : 0) + (firstItem ? itemHeight(firstItem) : 0))
    drawSectionHeading(`${section.number}. ${section.name}`)
    section.groups.forEach((group, gi) => {
      if (group.name) {
        const first = group.items[0]
        if (gi > 0) ensure(GROUP_H + 4 + (first ? itemHeight(first) : 0))
        if (gi > 0) y += 4
        drawGroupHeading(group.name)
      }
      for (const item of group.items) {
        ensure(itemHeight(item))
        drawItem(item)
      }
    })
  }

  // --- Deficiencies / Corrective Actions ---------------------------------------------------------
  const RULE_GAP = 22
  font('normal', 10)
  const defLines = input.deficiencies?.trim()
    ? (doc.splitTextToSize(pdfText(input.deficiencies.trim()), contentW) as string[])
    : null
  ensure(SECTION_H + (defLines ? LINE : RULE_GAP))
  drawSectionHeading(`${input.sections.length + 1}. ${DEFICIENCIES_TITLE}`)
  if (defLines) {
    doc.setTextColor(20)
    for (const line of defLines) {
      ensure(LINE)
      font('normal', 10)
      doc.text(line, MARGIN, y + 9)
      y += LINE
    }
  } else {
    // Ruled blank lines, so a printout can be written on.
    doc.setDrawColor(150)
    doc.setLineWidth(0.5)
    for (let i = 0; i < 4; i++) {
      ensure(RULE_GAP)
      y += RULE_GAP
      doc.line(MARGIN, y, pageW - MARGIN, y)
    }
  }

  // --- Footer on every page, drawn once the page count is known ----------------------------------
  const pages = doc.getNumberOfPages()
  const footer = `${pdfText(input.footerText)} · Generated ${formatDate(input.generatedOn)}`
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    font('normal', 8)
    doc.setTextColor(90)
    doc.text(`${footer} · Page ${i} of ${pages}`, pageW / 2, pageH - 24, { align: 'center' })
  }

  return doc.output('blob')
}
