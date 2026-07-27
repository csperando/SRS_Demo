import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MarketRates } from './sizing'

// googleSheets.ts only touches `window.google` on the already-authorized
// fast path exercised here, so a minimal stub is enough — no jsdom needed.
function stubGoogleIdentity(token = 'fake-token') {
  ;(globalThis as unknown as { window: unknown }).window = {
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (config: { callback: (resp: { access_token?: string; error?: string }) => void }) => ({
            requestAccessToken: () => config.callback({ access_token: token }),
          }),
        },
      },
    },
  }
}

const rates: MarketRates = {
  sofr1m: 4.33,
  sofr1mAsOf: '2026-07-24',
  prime: 7.5,
  ust5y: 4.05,
  ust10y: 4.28,
  fwd1m: 4.33,
  fwd3m: 4.2,
  fwd6m: 4.05,
  fwd12m: 3.85,
  lastRefreshed: 'Jul 24, 2026 · 9:41 AM ET',
}

beforeEach(() => {
  vi.resetModules()
  vi.unstubAllEnvs()
  stubGoogleIdentity()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('getGoogleSheetsConfig', () => {
  it('returns null when any required env var is missing', async () => {
    const { getGoogleSheetsConfig } = await import('./googleSheets')
    expect(getGoogleSheetsConfig()).toBeNull()
  })

  it('returns the config, defaulting the range, once all required vars are set', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'client-123')
    vi.stubEnv('VITE_GOOGLE_API_KEY', 'key-456')
    vi.stubEnv('VITE_GOOGLE_SHEET_ID', 'sheet-789')
    const { getGoogleSheetsConfig } = await import('./googleSheets')
    expect(getGoogleSheetsConfig()).toEqual({
      clientId: 'client-123',
      apiKey: 'key-456',
      spreadsheetId: 'sheet-789',
      range: 'Inputs!A1:B12',
    })
  })
})

describe('fetchDealFromSheet', () => {
  it('reads the configured range and maps label rows to a Deal', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        values: [
          ['Deal Name', 'Sheet Import Deal'],
          ['Property Type', 'Multifamily'],
          ['Location', 'Reno, NV'],
          ['Property Value', 10_000_000],
          ['Annual NOI', 700_000],
          ['Requested Loan Amount', 6_500_000],
          ['Amortization (Years)', 30],
          ['Interest-Only Period (Months)', 12],
          ['Spread over Index (bps)', 200],
          ['Min DSCR', 1.25],
          ['Max LTV (%)', 65],
          ['Min Debt Yield (%)', 8.5],
        ],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const { fetchDealFromSheet } = await import('./googleSheets')
    const deal = await fetchDealFromSheet({
      clientId: 'client-123',
      apiKey: 'key-456',
      spreadsheetId: 'sheet-789',
      range: 'Inputs!A1:B12',
    })

    expect(deal.source).toBe('google-sheet')
    expect(deal.name).toBe('Sheet Import Deal')
    expect(deal.inputs.propertyValue).toBe(10_000_000)

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toContain('/spreadsheets/sheet-789/values/')
    expect(url).toContain('key=key-456')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer fake-token')
  })

  it('throws with the response status and body when the request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 403, text: async () => 'insufficient scope' }),
    )
    const { fetchDealFromSheet } = await import('./googleSheets')
    await expect(
      fetchDealFromSheet({ clientId: 'a', apiKey: 'b', spreadsheetId: 'c', range: 'Inputs!A1:B12' }),
    ).rejects.toThrow(/403/)
  })
})

describe('pushRatesToSheet', () => {
  it('PUTs the rate values with valueInputOption=RAW', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => '' })
    vi.stubGlobal('fetch', fetchMock)

    const { pushRatesToSheet } = await import('./googleSheets')
    await pushRatesToSheet({ clientId: 'a', apiKey: 'b', spreadsheetId: 'c', range: 'Rates!A1:B6' }, rates, 'Rates!A1:B6')

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toContain('valueInputOption=RAW')
    expect(init.method).toBe('PUT')
    const body = JSON.parse(init.body as string)
    expect(body.values).toContainEqual(['1M Term SOFR (%)', 4.33])
  })
})
