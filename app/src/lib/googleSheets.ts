import type { Deal } from './deal'
import { dealFromLabelRows } from './dealRows'
import type { MarketRates } from './sizing'

// Read/write so a connected demo can both import a deal and push refreshed
// rate assumptions back to the sheet (see pushRatesToSheet below).
const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets'
const DEFAULT_RANGE = 'Inputs!A1:B12'

export interface GoogleSheetsConfig {
  clientId: string
  apiKey: string
  spreadsheetId: string
  range: string
}

/**
 * Reads the connection details from Vite env vars set in app/.env (see
 * app/.env.example). Returns null when they aren't configured, so callers
 * can fall back to mock data instead of erroring.
 *
 * Security note: VITE_* env vars are inlined into the client bundle at
 * build time, so the API key ships to every visitor's browser. Restrict it
 * in Google Cloud Console (HTTP referrer + "Google Sheets API" only) before
 * using this outside a local demo — the key alone should never be treated
 * as a secret. Actual data access is gated by the OAuth-consented access
 * token below, not the key.
 */
export function getGoogleSheetsConfig(): GoogleSheetsConfig | null {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY
  const spreadsheetId = import.meta.env.VITE_GOOGLE_SHEET_ID
  if (!clientId || !apiKey || !spreadsheetId) return null
  return { clientId, apiKey, spreadsheetId, range: import.meta.env.VITE_GOOGLE_SHEET_RANGE ?? DEFAULT_RANGE }
}

interface TokenClient {
  requestAccessToken: () => void
}

interface TokenResponse {
  access_token?: string
  error?: string
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(config: {
            client_id: string
            scope: string
            callback: (resp: TokenResponse) => void
          }): TokenClient
        }
      }
    }
  }
}

function loadGoogleIdentityServices(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Could not load Google Identity Services.'))
    document.head.appendChild(script)
  })
}

let cachedToken: string | null = null

/** Runs the Google Identity Services OAuth token-client flow, prompting a consent popup on first use. */
export async function getAccessToken(clientId: string): Promise<string> {
  if (cachedToken) return cachedToken
  await loadGoogleIdentityServices()
  return new Promise((resolve, reject) => {
    if (!window.google) {
      reject(new Error('Google Identity Services did not load.'))
      return
    }
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SHEETS_SCOPE,
      callback: (resp) => {
        if (resp.error || !resp.access_token) {
          reject(new Error(resp.error ?? 'Google sign-in was cancelled or failed.'))
          return
        }
        cachedToken = resp.access_token
        resolve(resp.access_token)
      },
    })
    client.requestAccessToken()
  })
}

async function sheetsFetch(
  config: GoogleSheetsConfig,
  range: string,
  init: RequestInit = {},
  extraParams: Record<string, string> = {},
): Promise<Response> {
  const token = await getAccessToken(config.clientId)
  const params = new URLSearchParams({ key: config.apiKey, ...extraParams })
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(range)}?${params}`
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...init.headers },
  })
  if (!res.ok) {
    throw new Error(`Google Sheets request failed (${res.status}): ${await res.text()}`)
  }
  return res
}

/** Reads a deal laid out like app/src/mocks/sample-deal.xlsx (label in column A, value in column B) from the configured range. */
export async function fetchDealFromSheet(config: GoogleSheetsConfig): Promise<Deal> {
  const res = await sheetsFetch(config, config.range)
  const body = (await res.json()) as { values?: (string | number)[][] }
  return dealFromLabelRows(body.values ?? [], 'google-sheet', `google-sheet-${Date.now()}`)
}

/** Pushes the dashboard's current rate assumptions back to a sheet range, demonstrating the write half of the read/write scope. */
export async function pushRatesToSheet(config: GoogleSheetsConfig, rates: MarketRates, range: string): Promise<void> {
  await sheetsFetch(
    config,
    range,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        values: [
          ['1M Term SOFR (%)', rates.sofr1m],
          ['1M SOFR As Of', rates.sofr1mAsOf],
          ['Prime Rate (%)', rates.prime],
          ['UST 5Y (%)', rates.ust5y],
          ['UST 10Y (%)', rates.ust10y],
          ['Last Refreshed', rates.lastRefreshed],
        ],
      }),
    },
    { valueInputOption: 'RAW' },
  )
}
