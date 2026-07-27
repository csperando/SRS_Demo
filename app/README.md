# CRE Loan Sizing Model — Demo

An interactive Vue 3 port of `design/CRE Loan Sizing Model.dc.html`: a
commercial real estate loan-sizing dashboard with a live-look rate feed,
scenario/constraint sizing, a print-ready summary, and a portfolio metrics
view — built to demonstrate the CRE finance + web/API skills behind the
job in the repo-root `README.md`, not as that job's actual Excel deliverable.

## Running it

```
npm install
npm run dev      # start the dev server
npm run test     # run the Vitest suite
npm run build    # type-check + production build
```

## What's real vs. mocked

- **CRE sizing math** (`src/lib/sizing.ts`) is a straight port of the
  reference prototype's `computeScenario` logic — real formulas, unit
  tested against its hardcoded example deal.
- **Deal data** is four static mock deals (`src/mocks/deals/*.json`) plus a
  generated sample workbook (`src/mocks/sample-deal.xlsx`). Excel import
  (`src/lib/importExcel.ts`, via SheetJS) is a real parser — try uploading
  `sample-deal.xlsx` from the Import screen, or any workbook laid out the
  same way (labels in column A, values in column B; see
  `DEAL_FIELD_LABELS` in `src/lib/dealRows.ts`).
- **Google Sheets integration** (`src/lib/googleSheets.ts`) is real
  client-side code — Google Identity Services OAuth plus Sheets API v4
  `values.get`/`values.update` calls — but the demo has no credentials
  configured out of the box. Without them, "Connect Google Sheet" falls
  back to the mock deals with a visible notice. To connect a real sheet,
  copy `.env.example` to `.env` and follow the setup steps in it; note the
  API key ships inside the client bundle (restrict it to your origin +
  the Sheets API in Google Cloud Console), and it's the OAuth-consented
  token, not the key, that actually gates data access.
- **Market rates** (UST yields, Prime, SOFR) are a static snapshot with a
  client-side jitter simulation behind the Refresh button — there's no
  live rate feed in this demo, matching the reference prototype.

## Architecture in one paragraph

Deal data (mock JSON, an uploaded workbook, or a connected Sheet) lands in
a single reactive store (`src/stores/deals.ts`) that also holds the
selected deal and the dashboard/print-view toggle; the Dashboard, Print
Preview, and Portfolio views all read from it and drive the same
`sizing.ts` functions, so a deal or an assumption edited in one place is
consistent everywhere else in the app.
