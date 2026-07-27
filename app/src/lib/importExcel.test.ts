import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as XLSX from 'xlsx'
import { describe, expect, it } from 'vitest'
import { importExcelDeal } from './importExcel'

const sampleXlsxPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'mocks',
  'sample-deal.xlsx',
)

function toFile(buffer: ArrayBuffer | Uint8Array, name = 'workbook.xlsx'): File {
  return new File([buffer as BlobPart], name, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

describe('importExcelDeal', () => {
  it('parses the generated sample-deal.xlsx into the expected Deal shape', async () => {
    const buffer = readFileSync(sampleXlsxPath)
    const deal = await importExcelDeal(toFile(buffer))

    expect(deal.source).toBe('excel')
    expect(deal.name).toBe('Lakeside Commons')
    expect(deal.propertyType).toBe('Multifamily')
    expect(deal.location).toBe('Austin, TX')
    expect(deal.inputs).toEqual({
      propertyValue: 12_000_000,
      noi: 850_000,
      loanRequested: 8_000_000,
      amortYears: 30,
      ioMonths: 12,
      spreadBps: 200,
      minDSCR: 1.25,
      maxLTV: 65,
      minDY: 8.5,
    })
  })

  it('throws a clear error listing missing fields', async () => {
    const worksheet = XLSX.utils.aoa_to_sheet([
      ['Deal Name', 'Incomplete Deal'],
      ['Property Value', 10_000_000],
      // Annual NOI, Requested Loan Amount, etc. intentionally omitted
    ])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inputs')
    const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })

    await expect(importExcelDeal(toFile(buffer))).rejects.toThrow(/Annual NOI/)
  })

  it('throws when a numeric field holds non-numeric text', async () => {
    const worksheet = XLSX.utils.aoa_to_sheet([
      ['Deal Name', 'Bad Numbers'],
      ['Property Type', 'Retail'],
      ['Location', 'Nowhere, TX'],
      ['Property Value', 'not-a-number'],
      ['Annual NOI', 850_000],
      ['Requested Loan Amount', 8_000_000],
      ['Amortization (Years)', 30],
      ['Interest-Only Period (Months)', 12],
      ['Spread over Index (bps)', 200],
      ['Min DSCR', 1.25],
      ['Max LTV (%)', 65],
      ['Min Debt Yield (%)', 8.5],
    ])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inputs')
    const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })

    await expect(importExcelDeal(toFile(buffer))).rejects.toThrow(/expected a number/)
  })

  it('throws when the file cannot be read as a workbook at all', async () => {
    // A ZIP-signature header followed by garbage: SheetJS reads plain text as
    // a one-cell CSV sheet (falling through to the missing-fields error), but
    // a corrupt ZIP container makes it throw during parsing itself.
    const corruptZip = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    await expect(importExcelDeal(toFile(corruptZip))).rejects.toThrow(/Could not read this file/)
  })
})
