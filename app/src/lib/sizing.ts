export interface DealInputs {
  propertyValue: number
  noi: number
  loanRequested: number
  amortYears: number
  ioMonths: number
  spreadBps: number
  minDSCR: number
  maxLTV: number
  minDY: number
}

export interface MarketRates {
  sofr1m: number
  sofr1mAsOf: string
  prime: number
  ust5y: number
  ust10y: number
  fwd1m: number
  fwd3m: number
  fwd6m: number
  fwd12m: number
  lastRefreshed: string
}

export type MetricKey = 'ltv' | 'dscr' | 'dy' | 'io'

export interface ScenarioDef {
  key: string
  label: string
  spreadAdj: number
  dscrAdj: number
  ltvAdj: number
  dyAdj: number
}

export interface MetricDef {
  key: MetricKey
  label: string
  prop: 'byLTV' | 'byDSCR' | 'byDY' | 'byIO'
}

export const scenarioDefs: ScenarioDef[] = [
  { key: 'conservative', label: 'Conservative', spreadAdj: 35, dscrAdj: 0.15, ltvAdj: -5, dyAdj: 0.5 },
  { key: 'base', label: 'Base Case', spreadAdj: 0, dscrAdj: 0, ltvAdj: 0, dyAdj: 0 },
  { key: 'aggressive', label: 'Aggressive', spreadAdj: -20, dscrAdj: -0.1, ltvAdj: 5, dyAdj: -0.5 },
]

export const metricDefs: MetricDef[] = [
  { key: 'ltv', label: 'Max LTV', prop: 'byLTV' },
  { key: 'dscr', label: 'Min DSCR', prop: 'byDSCR' },
  { key: 'dy', label: 'Min Debt Yield', prop: 'byDY' },
  { key: 'io', label: 'IO Constraint', prop: 'byIO' },
]

export interface ScenarioComputation {
  allInRate: number
  byDSCR: number
  byLTV: number
  byDY: number
  byIO: number
}

/** Ports dc.html's Component.computeScenario 1:1 — see design/CRE Loan Sizing Model.dc.html. */
export function computeScenario(inputs: DealInputs, rates: MarketRates, def: ScenarioDef): ScenarioComputation {
  const allInRate = rates.sofr1m + (inputs.spreadBps + def.spreadAdj) / 100
  const dscrReq = inputs.minDSCR + def.dscrAdj
  const ltvReq = (inputs.maxLTV + def.ltvAdj) / 100
  const dyReq = (inputs.minDY + def.dyAdj) / 100
  const monthlyRate = allInRate / 100 / 12
  const n = inputs.amortYears * 12
  const constant = monthlyRate === 0 ? 1 / n : monthlyRate / (1 - Math.pow(1 + monthlyRate, -n))
  const annualConstant = constant * 12
  const byDSCR = inputs.noi / dscrReq / annualConstant
  const byLTV = inputs.propertyValue * ltvReq
  const byDY = inputs.noi / dyReq
  const byIO = inputs.noi / (dscrReq * 0.9) / (allInRate / 100)
  return { allInRate, byDSCR, byLTV, byDY, byIO }
}

export interface MetricRow {
  key: MetricKey
  label: string
  active: boolean
  value: number
  isBinding: boolean
}

export interface ScenarioResult {
  key: string
  label: string
  allInRate: number
  sizedProceeds: number
  bindingLabel: string
  fullySized: boolean
  rows: MetricRow[]
}

export type ActiveMetrics = Record<MetricKey, boolean>

export const defaultActiveMetrics: ActiveMetrics = { ltv: true, dscr: true, dy: true, io: true }

/**
 * Ports dc.html's renderVals binding-constraint selection: the sized proceeds
 * is the minimum across whichever metric chips are active (falling back to
 * all four if none are toggled on), and that minimum's metric is "binding".
 */
export function sizeScenario(
  inputs: DealInputs,
  rates: MarketRates,
  def: ScenarioDef,
  activeMetrics: ActiveMetrics = defaultActiveMetrics,
): ScenarioResult {
  const calc = computeScenario(inputs, rates, def)
  const rows = metricDefs.map((m) => ({
    key: m.key,
    label: m.label,
    active: !!activeMetrics[m.key],
    value: calc[m.prop],
  }))
  const activeRows = rows.filter((r) => r.active)
  const pool = activeRows.length ? activeRows : rows
  const sizedProceeds = Math.min(...pool.map((r) => r.value))
  const binding = pool.find((r) => r.value === sizedProceeds) ?? pool[0]
  const fullySized = sizedProceeds >= inputs.loanRequested * 0.995
  return {
    key: def.key,
    label: def.label,
    allInRate: calc.allInRate,
    sizedProceeds,
    bindingLabel: binding.label,
    fullySized,
    rows: rows.map((r) => ({ ...r, isBinding: r.key === binding.key })),
  }
}

export function sizeAllScenarios(
  inputs: DealInputs,
  rates: MarketRates,
  activeMetrics: ActiveMetrics = defaultActiveMetrics,
): ScenarioResult[] {
  return scenarioDefs.map((def) => sizeScenario(inputs, rates, def, activeMetrics))
}

export function fmtMoney(n: number): string {
  return !isFinite(n) ? '—' : '$' + Math.round(n).toLocaleString('en-US')
}

export function fmtPct(n: number, digits = 2): string {
  return n.toFixed(digits) + '%'
}

/** Ports dc.html's refreshRates jitter simulation used by the Refresh button. */
export function jitterRates(rates: MarketRates): MarketRates {
  const jitter = (v: number, amt: number) => Math.round((v + (Math.random() - 0.5) * amt) * 100) / 100
  const now = new Date()
  const stamp =
    now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' +
    now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return {
    ...rates,
    ust5y: jitter(rates.ust5y, 0.04),
    ust10y: jitter(rates.ust10y, 0.04),
    fwd1m: jitter(rates.fwd1m, 0.03),
    fwd3m: jitter(rates.fwd3m, 0.03),
    fwd6m: jitter(rates.fwd6m, 0.03),
    fwd12m: jitter(rates.fwd12m, 0.03),
    lastRefreshed: stamp,
  }
}
