import { computed, reactive } from 'vue'
import type { Deal } from '../lib/deal'
import type { DealInputs } from '../lib/sizing'
import { mockDeals } from '../mocks'

interface DealsState {
  deals: Deal[]
  currentDealId: string | null
  printMode: boolean
}

// Module-level singleton: every call to useDealsStore() shares this one
// reactive object, giving a Pinia-free store for a demo this small.
const state = reactive<DealsState>({
  deals: [...mockDeals],
  currentDealId: mockDeals[0]?.id ?? null,
  printMode: false,
})

export function useDealsStore() {
  return {
    deals: computed(() => state.deals),
    currentDealId: computed(() => state.currentDealId),
    currentDeal: computed(() => state.deals.find((d) => d.id === state.currentDealId) ?? null),
    printMode: computed(() => state.printMode),

    /** Selecting a deal always lands on the dashboard, even if the previously viewed deal was left in print mode. */
    selectDeal(id: string) {
      if (state.deals.some((d) => d.id === id)) {
        state.currentDealId = id
        state.printMode = false
      }
    },

    /** Adds a new deal (from Excel import or a Google Sheet), or replaces one sharing its id, and selects it. */
    addDeal(deal: Deal) {
      const existingIndex = state.deals.findIndex((d) => d.id === deal.id)
      if (existingIndex >= 0) {
        state.deals[existingIndex] = deal
      } else {
        state.deals.push(deal)
      }
      state.currentDealId = deal.id
      state.printMode = false
    },

    togglePrintMode() {
      state.printMode = !state.printMode
    },

    /** Persists an assumptions-form edit on the Dashboard back to the selected deal, so Portfolio stays in sync. */
    updateCurrentDealInputs(patch: Partial<DealInputs>) {
      const deal = state.deals.find((d) => d.id === state.currentDealId)
      if (deal) Object.assign(deal.inputs, patch)
    },
  }
}
