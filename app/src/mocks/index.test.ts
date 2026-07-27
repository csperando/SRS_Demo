import { describe, expect, it } from 'vitest'
import { mockDeals, mockRates } from './index'

describe('mock fixtures', () => {
  it('loads at least 3 deals with unique ids and positive sizing inputs', () => {
    expect(mockDeals.length).toBeGreaterThanOrEqual(3)
    const ids = mockDeals.map((d) => d.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const deal of mockDeals) {
      expect(deal.inputs.propertyValue).toBeGreaterThan(0)
      expect(deal.inputs.noi).toBeGreaterThan(0)
      expect(deal.inputs.loanRequested).toBeGreaterThan(0)
    }
  })

  it('loads a market rate snapshot with all fields sizing.ts expects', () => {
    expect(mockRates.sofr1m).toBeGreaterThan(0)
    expect(mockRates.lastRefreshed).toBeTruthy()
    expect(mockRates.sofr1mAsOf).toBeTruthy()
  })
})
