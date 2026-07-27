import { describe, expect, it, vi } from 'vitest'
import {
  computeScenario,
  defaultActiveMetrics,
  fmtMoney,
  fmtPct,
  jitterRates,
  scenarioDefs,
  sizeAllScenarios,
  sizeScenario,
  type DealInputs,
  type MarketRates,
} from './sizing'

// Reference deal from design/CRE Loan Sizing Model.dc.html's hardcoded example state.
const inputs: DealInputs = {
  propertyValue: 25_000_000,
  noi: 1_800_000,
  loanRequested: 17_000_000,
  amortYears: 30,
  ioMonths: 24,
  spreadBps: 210,
  minDSCR: 1.25,
  maxLTV: 65,
  minDY: 8.0,
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

const baseDef = scenarioDefs.find((d) => d.key === 'base')!
const conservativeDef = scenarioDefs.find((d) => d.key === 'conservative')!
const aggressiveDef = scenarioDefs.find((d) => d.key === 'aggressive')!

describe('computeScenario', () => {
  it('matches dc.html reference output for the base case', () => {
    const calc = computeScenario(inputs, rates, baseDef)
    expect(calc.allInRate).toBeCloseTo(6.43, 6)
    expect(calc.byDSCR).toBeCloseTo(19_124_374.16, 2)
    expect(calc.byLTV).toBe(16_250_000)
    expect(calc.byDY).toBe(22_500_000)
    expect(calc.byIO).toBeCloseTo(24_883_359.25, 2)
  })

  it('matches dc.html reference output for the conservative case', () => {
    const calc = computeScenario(inputs, rates, conservativeDef)
    expect(calc.allInRate).toBeCloseTo(6.78, 6)
    expect(calc.byDSCR).toBeCloseTo(16_468_479.06, 2)
    expect(calc.byLTV).toBe(15_000_000)
    expect(calc.byDY).toBeCloseTo(21_176_470.59, 2)
    expect(calc.byIO).toBeCloseTo(21_070_375.05, 2)
  })

  it('matches dc.html reference output for the aggressive case', () => {
    const calc = computeScenario(inputs, rates, aggressiveDef)
    expect(calc.allInRate).toBeCloseTo(6.23, 6)
    expect(calc.byDSCR).toBeCloseTo(21_229_031.31, 2)
    expect(calc.byLTV).toBe(17_500_000)
    expect(calc.byDY).toBe(24_000_000)
    expect(calc.byIO).toBeCloseTo(27_915_416.29, 2)
  })
})

describe('sizeScenario', () => {
  it('binds on the lowest active metric and flags whether the request is met', () => {
    const base = sizeScenario(inputs, rates, baseDef, defaultActiveMetrics)
    expect(base.bindingLabel).toBe('Max LTV')
    expect(base.sizedProceeds).toBe(16_250_000)
    expect(base.fullySized).toBe(false)

    const aggressive = sizeScenario(inputs, rates, aggressiveDef, defaultActiveMetrics)
    expect(aggressive.bindingLabel).toBe('Max LTV')
    expect(aggressive.sizedProceeds).toBe(17_500_000)
    expect(aggressive.fullySized).toBe(true)

    const bindingRow = aggressive.rows.find((r) => r.key === 'ltv')
    expect(bindingRow?.isBinding).toBe(true)
    expect(aggressive.rows.find((r) => r.key === 'dscr')?.isBinding).toBe(false)
  })

  it('re-sizes off the remaining active metrics when a chip is toggled off', () => {
    const withoutLTV = sizeScenario(inputs, rates, baseDef, { ...defaultActiveMetrics, ltv: false })
    expect(withoutLTV.bindingLabel).toBe('Min DSCR')
    expect(withoutLTV.sizedProceeds).toBeCloseTo(19_124_374.16, 2)
  })

  it('falls back to all four metrics when every chip is toggled off', () => {
    const noneActive = sizeScenario(inputs, rates, baseDef, { ltv: false, dscr: false, dy: false, io: false })
    expect(noneActive.sizedProceeds).toBe(16_250_000)
    expect(noneActive.bindingLabel).toBe('Max LTV')
  })
})

describe('sizeAllScenarios', () => {
  it('returns one result per scenario def, in order', () => {
    const results = sizeAllScenarios(inputs, rates, defaultActiveMetrics)
    expect(results.map((r) => r.key)).toEqual(['conservative', 'base', 'aggressive'])
  })
})

describe('fmtMoney / fmtPct', () => {
  it('formats a finite amount as a rounded, comma-grouped dollar figure', () => {
    expect(fmtMoney(16_250_000)).toBe('$16,250,000')
    expect(fmtMoney(1_800_000.6)).toBe('$1,800,001')
  })

  it('formats a non-finite amount as an em dash', () => {
    expect(fmtMoney(Infinity)).toBe('—')
    expect(fmtMoney(NaN)).toBe('—')
  })

  it('formats a percent to the requested precision, defaulting to 2', () => {
    expect(fmtPct(6.43)).toBe('6.43%')
    expect(fmtPct(6.4, 1)).toBe('6.4%')
  })
})

describe('jitterRates', () => {
  it('keeps rates unchanged when Math.random is pinned to the midpoint, and stamps a refresh time', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const refreshed = jitterRates(rates)
    expect(refreshed.ust5y).toBe(rates.ust5y)
    expect(refreshed.ust10y).toBe(rates.ust10y)
    expect(refreshed.fwd1m).toBe(rates.fwd1m)
    expect(refreshed.lastRefreshed).not.toBe(rates.lastRefreshed)
    vi.restoreAllMocks()
  })

  it('leaves the manual 1M SOFR input and its as-of date untouched', () => {
    const refreshed = jitterRates(rates)
    expect(refreshed.sofr1m).toBe(rates.sofr1m)
    expect(refreshed.sofr1mAsOf).toBe(rates.sofr1mAsOf)
  })
})
