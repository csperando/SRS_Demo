import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Deal } from '../lib/deal'
import { mockDeals } from '../mocks'

// The store is a module-level singleton, so each test re-imports it fresh
// after resetting the module cache to avoid state leaking between cases.
async function freshStore() {
  vi.resetModules()
  const { useDealsStore } = await import('./deals')
  return useDealsStore()
}

beforeEach(() => {
  vi.resetModules()
})

describe('useDealsStore', () => {
  it('seeds from the mock deals and selects the first one by default', async () => {
    const store = await freshStore()
    expect(store.deals.value).toHaveLength(mockDeals.length)
    expect(store.currentDealId.value).toBe(mockDeals[0].id)
    expect(store.currentDeal.value?.id).toBe(mockDeals[0].id)
  })

  it('selectDeal switches the current deal only for a known id', async () => {
    const store = await freshStore()
    const targetId = mockDeals[1].id
    store.selectDeal(targetId)
    expect(store.currentDealId.value).toBe(targetId)

    store.selectDeal('does-not-exist')
    expect(store.currentDealId.value).toBe(targetId)
  })

  it('selectDeal exits print mode, so opening a new deal never lands back on its print preview', async () => {
    const store = await freshStore()
    store.togglePrintMode()
    expect(store.printMode.value).toBe(true)

    store.selectDeal(mockDeals[1].id)
    expect(store.printMode.value).toBe(false)
  })

  it('addDeal exits print mode too', async () => {
    const store = await freshStore()
    store.togglePrintMode()
    store.addDeal({ ...mockDeals[0], id: 'excel-456' })
    expect(store.printMode.value).toBe(false)
  })

  it('addDeal appends a new deal and selects it', async () => {
    const store = await freshStore()
    const newDeal: Deal = {
      id: 'excel-123',
      name: 'Test Deal',
      propertyType: 'Retail',
      location: 'Nowhere, TX',
      source: 'excel',
      inputs: {
        propertyValue: 1,
        noi: 1,
        loanRequested: 1,
        amortYears: 1,
        ioMonths: 1,
        spreadBps: 1,
        minDSCR: 1,
        maxLTV: 1,
        minDY: 1,
      },
    }
    store.addDeal(newDeal)
    expect(store.deals.value).toHaveLength(mockDeals.length + 1)
    expect(store.currentDealId.value).toBe('excel-123')
  })

  it('addDeal replaces an existing deal sharing its id instead of duplicating it', async () => {
    const store = await freshStore()
    const original = mockDeals[0]
    const updated: Deal = { ...original, name: 'Renamed Deal' }
    store.addDeal(updated)
    expect(store.deals.value).toHaveLength(mockDeals.length)
    expect(store.deals.value.find((d) => d.id === original.id)?.name).toBe('Renamed Deal')
  })

  it('updateCurrentDealInputs patches only the selected deal, leaving others untouched', async () => {
    const store = await freshStore()
    const otherId = mockDeals[1].id
    const otherNoiBefore = store.deals.value.find((d) => d.id === otherId)?.inputs.noi

    store.updateCurrentDealInputs({ noi: 999_999 })

    expect(store.currentDeal.value?.inputs.noi).toBe(999_999)
    expect(store.deals.value.find((d) => d.id === otherId)?.inputs.noi).toBe(otherNoiBefore)
  })

  it('togglePrintMode flips the shared printMode flag', async () => {
    const store = await freshStore()
    expect(store.printMode.value).toBe(false)
    store.togglePrintMode()
    expect(store.printMode.value).toBe(true)
    store.togglePrintMode()
    expect(store.printMode.value).toBe(false)
  })

  it('shares state across every useDealsStore() call (singleton)', async () => {
    vi.resetModules()
    const { useDealsStore } = await import('./deals')
    const storeA = useDealsStore()
    const storeB = useDealsStore()
    storeA.togglePrintMode()
    expect(storeB.printMode.value).toBe(true)
  })
})
