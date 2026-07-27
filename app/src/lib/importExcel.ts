import * as XLSX from 'xlsx'
import type { Deal } from './deal'
import { dealFromLabelRows, DealRowParseError } from './dealRows'

/** Parses an uploaded workbook shaped like app/src/mocks/sample-deal.xlsx into a Deal. */
export async function importExcelDeal(file: File): Promise<Deal> {
  const buffer = await file.arrayBuffer()
  let workbook: XLSX.WorkBook
  try {
    workbook = XLSX.read(buffer, { type: 'array' })
  } catch {
    throw new DealRowParseError('Could not read this file as an Excel workbook.')
  }

  const sheetName = workbook.SheetNames[0]
  if (!sheetName) throw new DealRowParseError('This workbook has no sheets.')
  const rows = XLSX.utils.sheet_to_json<(string | number)[]>(workbook.Sheets[sheetName], { header: 1 })
  return dealFromLabelRows(rows, 'excel', `excel-${Date.now()}`)
}
