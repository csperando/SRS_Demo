// One-off script — regenerate with: node scripts/generate-mock-xlsx.mjs
// Row labels here must match DEAL_FIELD_LABELS in src/lib/dealRows.ts.
import * as XLSX from 'xlsx'
import * as fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

XLSX.set_fs(fs)

const rows = [
  ['Deal Name', 'Lakeside Commons'],
  ['Property Type', 'Multifamily'],
  ['Location', 'Austin, TX'],
  ['Property Value', 12000000],
  ['Annual NOI', 850000],
  ['Requested Loan Amount', 8000000],
  ['Amortization (Years)', 30],
  ['Interest-Only Period (Months)', 12],
  ['Spread over Index (bps)', 200],
  ['Min DSCR', 1.25],
  ['Max LTV (%)', 65],
  ['Min Debt Yield (%)', 8.5],
]

const worksheet = XLSX.utils.aoa_to_sheet(rows)
worksheet['!cols'] = [{ wch: 28 }, { wch: 18 }]

const workbook = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(workbook, worksheet, 'Inputs')

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
// Written to two places: src/mocks is what importExcel.test.ts reads, and
// public/ is what ImportView's "Download sample workbook" link serves — kept
// identical so the file a visitor downloads is the same one the tests cover.
for (const outPath of [
  path.join(root, 'src', 'mocks', 'sample-deal.xlsx'),
  path.join(root, 'public', 'sample-deal.xlsx'),
]) {
  XLSX.writeFile(workbook, outPath)
  console.log(`Wrote ${outPath}`)
}
