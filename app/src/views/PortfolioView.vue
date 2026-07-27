<script setup lang="ts">
import { computed } from 'vue'
import BlueprintCard from '../components/ui/BlueprintCard.vue'
import { fmtMoney, fmtPct, sizeAllScenarios } from '../lib/sizing'
import { mockRates } from '../mocks'
import { useDealsStore } from '../stores/deals'

const store = useDealsStore()

// Every deal's base-case scenario at the current market-rate snapshot —
// the same sizeAllScenarios() the Dashboard uses, just run once per deal.
const baseCaseByDeal = computed(() =>
  store.deals.value.map((deal) => ({
    deal,
    base: sizeAllScenarios(deal.inputs, mockRates).find((s) => s.key === 'base')!,
  })),
)

const dealCount = computed(() => store.deals.value.length)
const totalRequested = computed(() => store.deals.value.reduce((sum, d) => sum + d.inputs.loanRequested, 0))
const totalSizedProceeds = computed(() =>
  baseCaseByDeal.value.reduce((sum, { base }) => sum + base.sizedProceeds, 0),
)
const avgAllInRate = computed(() => {
  const rates = baseCaseByDeal.value.map(({ base }) => base.allInRate)
  return rates.reduce((a, b) => a + b, 0) / (rates.length || 1)
})

// A dumbbell per deal: requested loan amount vs. base-case sized proceeds —
// one hue, two shades, since two comparable dollar figures per item is
// exactly the "before/after per item" job (dataviz skill: choosing-a-form.md).
// (An earlier version compared Max LTV assumption vs. the LTV implied by
// sized proceeds, but LTV is the binding constraint for every mock deal in
// the base case, which makes "implied LTV" mathematically equal to the
// assumption whenever it binds — a tautological, always-flat chart. Request
// vs. sized proceeds are independent figures, so the gap is always real.)
const dealRows = computed(() =>
  baseCaseByDeal.value.map(({ deal, base }) => ({
    id: deal.id,
    name: deal.name,
    requested: deal.inputs.loanRequested,
    sized: base.sizedProceeds,
    coveragePct: (base.sizedProceeds / deal.inputs.loanRequested) * 100,
  })),
)

const axisMax = computed(() => {
  const max = Math.max(...dealRows.value.flatMap((r) => [r.requested, r.sized]), 1)
  return Math.ceil((max * 1.1) / 1_000_000) * 1_000_000
})

const axisTicks = computed(() => [0, axisMax.value / 2, axisMax.value])

function pct(value: number) {
  return (value / axisMax.value) * 100
}

function compactMoney(n: number): string {
  return '$' + (n / 1_000_000).toFixed(1) + 'M'
}
</script>

<template>
  <div class="portfolio-page" style="max-width: 1100px; margin: 0 auto">
    <h2>Portfolio</h2>
    <p class="text-muted" style="margin-top: -8px">
      Aggregated across every deal currently loaded — mock, Excel-imported, or Google Sheet-connected.
    </p>

    <div
      style="
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--space-6);
        margin: var(--space-6) 0;
      "
    >
      <BlueprintCard style="padding: 16px">
        <div style="font-size: 12px; opacity: 0.65">Deals in portfolio</div>
        <div style="font-family: var(--font-heading); font-size: 32px; font-weight: 600">{{ dealCount }}</div>
      </BlueprintCard>
      <BlueprintCard style="padding: 16px">
        <div style="font-size: 12px; opacity: 0.65">Total requested</div>
        <div style="font-family: var(--font-heading); font-size: 32px; font-weight: 600">
          {{ fmtMoney(totalRequested) }}
        </div>
      </BlueprintCard>
      <BlueprintCard style="padding: 16px">
        <div style="font-size: 12px; opacity: 0.65">Total sized proceeds (base case)</div>
        <div style="font-family: var(--font-heading); font-size: 32px; font-weight: 600">
          {{ fmtMoney(totalSizedProceeds) }}
        </div>
      </BlueprintCard>
      <BlueprintCard style="padding: 16px">
        <div style="font-size: 12px; opacity: 0.65">Avg all-in rate (base case)</div>
        <div style="font-family: var(--font-heading); font-size: 32px; font-weight: 600">
          {{ fmtPct(avgAllInRate) }}
        </div>
      </BlueprintCard>
    </div>

    <BlueprintCard style="padding: 18px 22px">
      <div style="display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 10px">
        <h4 style="margin: 0">Base-Case Sizing: Requested vs. Sized Proceeds</h4>
        <div style="display: flex; gap: 16px; font-size: 12px; color: var(--color-text)">
          <span style="display: flex; align-items: center; gap: 6px">
            <span
              style="width: 10px; height: 10px; border-radius: 50%; background: var(--color-accent-400); display: inline-block"
            ></span>
            Requested
          </span>
          <span style="display: flex; align-items: center; gap: 6px">
            <span
              style="width: 10px; height: 10px; border-radius: 50%; background: var(--color-accent-800); display: inline-block"
            ></span>
            Sized (base case)
          </span>
        </div>
      </div>

      <div style="margin-top: 10px">
        <div
          v-for="row in dealRows"
          :key="row.id"
          class="deal-row-grid"
          style="
            display: grid;
            align-items: center;
            gap: 12px;
            padding: 14px 0;
            border-top: 1px solid var(--color-divider);
          "
        >
          <div style="font-size: 13px">{{ row.name }}</div>
          <div style="display: flex; flex-direction: column; gap: 4px">
            <div style="position: relative; height: 12px">
              <div
                style="position: absolute; top: 50%; height: 2px; background: var(--color-divider); transform: translateY(-50%)"
                :style="{
                  left: Math.min(pct(row.requested), pct(row.sized)) + '%',
                  width: Math.abs(pct(row.requested) - pct(row.sized)) + '%',
                }"
              ></div>
              <div
                :title="`Requested: ${fmtMoney(row.requested)}`"
                style="
                  position: absolute;
                  top: 50%;
                  width: 12px;
                  height: 12px;
                  border-radius: 50%;
                  background: var(--color-accent-400);
                  box-shadow: 0 0 0 2px var(--color-bg);
                  transform: translate(-50%, -50%);
                "
                :style="{ left: pct(row.requested) + '%' }"
              ></div>
              <div
                :title="`Sized (base case): ${fmtMoney(row.sized)}`"
                style="
                  position: absolute;
                  top: 50%;
                  width: 12px;
                  height: 12px;
                  border-radius: 50%;
                  background: var(--color-accent-800);
                  box-shadow: 0 0 0 2px var(--color-bg);
                  transform: translate(-50%, -50%);
                "
                :style="{ left: pct(row.sized) + '%' }"
              ></div>
            </div>
            <div style="font-size: 11px; opacity: 0.7">
              {{ compactMoney(row.sized) }} of {{ compactMoney(row.requested) }} requested
            </div>
          </div>
          <div
            style="text-align: right; font-size: 13px"
            :style="{ fontWeight: row.coveragePct >= 99.5 ? 700 : 500, color: row.coveragePct >= 99.5 ? 'var(--color-accent-700)' : 'inherit' }"
          >
            {{ Math.round(row.coveragePct) }}%
          </div>
        </div>
        <div class="deal-row-grid" style="display: grid; gap: 12px; padding-top: 16px">
          <div></div>
          <div style="position: relative; height: 14px; border-top: 1px solid var(--color-divider)">
            <span
              v-for="tick in axisTicks"
              :key="tick"
              style="position: absolute; top: 4px; font-size: 10px; opacity: 0.6; transform: translateX(-50%)"
              :style="{ left: pct(tick) + '%' }"
            >
              {{ compactMoney(tick) }}
            </span>
          </div>
          <div></div>
        </div>
      </div>
    </BlueprintCard>
  </div>
</template>

<style scoped>
.portfolio-page {
  padding: 24px 32px;
}
.deal-row-grid {
  grid-template-columns: 180px 1fr 60px;
}

@media (max-width: 640px) {
  .portfolio-page {
    padding: 16px;
  }
  .deal-row-grid {
    grid-template-columns: 1fr;
  }
}
</style>
