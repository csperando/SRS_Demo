# CRE Loan Sizing Model — Interactive Demo

An interactive, web-based demo of a commercial real estate loan-sizing tool:
a Vue 3 single-page app covering deal intake, a live-look market-rate feed,
scenario-based loan sizing, a print-ready client summary, and a portfolio
view — plus real (not simulated) integrations for Excel import and Google
Sheets.

**This is a demonstration project**, built to show CRE finance modeling,
Excel/Office automation, and live-data/API integration skills working
end-to-end in a click-through product, rather than described in a resume.
It is not a production deliverable for any specific engagement.

▶ **Run it:** see [`app/README.md`](app/README.md) for setup
(`cd app && npm install && npm run dev`).

## What it does

| Screen | What it shows |
|---|---|
| **Import** | Pick from 4 mock CRE deals (Multifamily, Industrial, Retail, Office), upload an Excel workbook, or connect a Google Sheet. A sample workbook is downloadable right from the screen. |
| **Dashboard** | The selected deal's assumptions (property value, NOI, requested loan, amortization, IO period, spread, DSCR/LTV/debt-yield minimums), a live-look rate strip (UST 5Y/10Y, Prime, manually-entered 1M Term SOFR with an as-of date, SOFR forward curve), and sizing results across **3 scenarios × 4 constraint methods** — Conservative/Base/Aggressive against Max LTV, Min DSCR, Min Debt Yield, and an IO constraint — with the binding (tightest) constraint highlighted per scenario. |
| **Print Preview** | A client/lender-ready one-page summary with letterhead, a constraint-by-scenario table, and a footer disclosure — printable or exportable to PDF via the browser's print dialog. |
| **Portfolio** | Aggregate stats across every loaded deal (count, total requested, total base-case sized proceeds, average all-in rate) and a per-deal chart comparing requested vs. sized proceeds. |
| **Help** | A slide-in user guide covering getting started, refreshing rates, exporting for print, the rate-feed architecture, and customizing the dashboard — built into the product instead of a separate doc. |

## Skills demonstrated

| Area | How this demo shows it |
|---|---|
| Advanced Excel/Office automation | The sizing engine (`app/src/lib/sizing.ts`) implements the same formulas a structured Excel model needs — loan constant, all-in rate, per-constraint proceeds, binding-constraint selection — as tested, reusable functions. The Print Preview reproduces a structured, print-optimized layout (letterhead, headers/footers, constraint table), and the Excel importer (`app/src/lib/importExcel.ts`, `app/src/lib/dealRows.ts`) reads a real workbook laid out the way a structured input tab should be: labels in one column, values in the next. |
| Live data integration, REST/JSON APIs, authentication | `app/src/lib/googleSheets.ts` is a real integration: Google Identity Services OAuth for the access token, then direct `fetch` calls to the Sheets API v4 (`values.get` to read, `values.update` to write) — no SDK wrapper hiding the mechanics. The code also documents, in comments, why the API key is not a secret once shipped to a browser and what actually gates access (the OAuth-consented token). |
| Rate-feed reliability (fallback, refresh, last-updated display) | `app/src/components/RateFeedBar.vue` reproduces a UST/Prime/SOFR strip with a manual, date-stamped 1-Month Term SOFR entry (there's no free public feed for it, so a dated manual entry is the compliant approach), a Refresh action, a Live/Fallback status tag, and a last-refreshed timestamp. |
| CRE finance modeling (DSCR, LTV, debt yield, loan constants, IO vs. amortizing, cash-on-cash) | The scenario engine sizes proceeds by all four methods simultaneously and shows which one binds — real underwriting logic, not just UI chrome around it. |
| Client-facing presentation | A real estate brokerage's brand mark and letterhead, a polished light "blueprint" design system, and a workflow (assumptions → sizing → print/export) aimed at client and lender communication. |
| Documentation as part of the product | The in-app Help panel covers setup, refresh, and export procedures plus the rate-feed architecture — always one click away instead of a separate file nobody opens. |

## Architecture

- **Vue 3 + TypeScript + Vite**, client-side only (no backend server).
- A single reactive store (`app/src/stores/deals.ts`) holds every loaded deal
  (mock, Excel-imported, or Sheet-connected), the currently selected deal, and
  the dashboard/print-view toggle — so an assumption edited on the Dashboard
  is reflected everywhere else (Portfolio, Print Preview) immediately.
- The CRE sizing math is framework-free (`app/src/lib/sizing.ts`) and covered
  by Vitest unit tests locked to a known reference deal, so the formulas are
  verified independently of any UI.
- The design system ("Industry": steel-blue blueprint wireframe, Barlow
  Condensed/Barlow, square-cornered cards with corner registration marks)
  lives in `app/src/styles/industry.css`.

See [`app/README.md`](app/README.md) for the full setup guide, including
which parts are mocked vs. backed by real code, and how to configure a real
Google Sheets connection.
