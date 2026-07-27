<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import RateFeedBar from '../components/RateFeedBar.vue'
import AppButton from '../components/ui/AppButton.vue'
import AppField from '../components/ui/AppField.vue'
import AppTag from '../components/ui/AppTag.vue'
import BlueprintCard from '../components/ui/BlueprintCard.vue'
import brandLogo from '../assets/srs_brand.webp'
import type { DealInputs } from '../lib/sizing'
import { defaultActiveMetrics, fmtMoney, fmtPct, jitterRates, metricDefs, sizeAllScenarios } from '../lib/sizing'
import { mockRates } from '../mocks'
import { useDealsStore } from '../stores/deals'

const route = useRoute()
const store = useDealsStore()

watch(
  () => route.params.dealId,
  (id) => {
    if (typeof id === 'string') store.selectDeal(id)
  },
  { immediate: true },
)

const rates = ref({ ...mockRates })
function refreshRates() {
  rates.value = jitterRates(rates.value)
}

const activeMetrics = ref({ ...defaultActiveMetrics })
function toggleMetric(key: keyof typeof activeMetrics.value) {
  activeMetrics.value[key] = !activeMetrics.value[key]
}

function setInput(key: keyof DealInputs, value: number) {
  store.updateCurrentDealInputs({ [key]: value })
}

const scenarios = computed(() => {
  const inputs = store.currentDeal.value?.inputs
  return inputs ? sizeAllScenarios(inputs, rates.value, activeMetrics.value) : []
})

const printDate = computed(() =>
  new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
)

const printRows = computed(() => {
  const rows = metricDefs.map((m, i) => ({
    label: m.label,
    bold: false,
    values: scenarios.value.map((sc) => fmtMoney(sc.rows[i].value)),
  }))
  rows.push({
    label: 'Sized Proceeds',
    bold: true,
    values: scenarios.value.map((sc) => fmtMoney(sc.sizedProceeds)),
  })
  return rows
})

function exportPdf() {
  window.print()
}
</script>

<template>
  <div v-if="store.currentDeal.value && !store.printMode.value" class="dashboard-page" style="max-width: 1200px; margin: 0 auto">
    <div style="margin-bottom: 16px">
      <h2 style="margin: 0 0 2px">{{ store.currentDeal.value.name }}</h2>
      <p class="text-muted" style="margin: 0">
        {{ store.currentDeal.value.propertyType }} · {{ store.currentDeal.value.location }}
      </p>
    </div>

    <RateFeedBar
      :rates="rates"
      @update:sofr1m="(v) => (rates.sofr1m = v)"
      @update:sofr1mAsOf="(v) => (rates.sofr1mAsOf = v)"
      @refresh="refreshRates"
    />

    <div class="assumptions-grid" style="display: grid; gap: 20px; margin: 24px 0; align-items: start">
      <BlueprintCard style="padding: 18px">
        <h4 style="margin: 0 0 14px">Property &amp; Loan Assumptions</h4>
        <AppField
          label="Property Value ($)"
          type="number"
          :model-value="store.currentDeal.value.inputs.propertyValue"
          @update:modelValue="(v) => setInput('propertyValue', v as number)"
        />
        <AppField
          label="Annual NOI ($)"
          type="number"
          :model-value="store.currentDeal.value.inputs.noi"
          @update:modelValue="(v) => setInput('noi', v as number)"
        />
        <AppField
          label="Requested Loan Amount ($)"
          type="number"
          :model-value="store.currentDeal.value.inputs.loanRequested"
          @update:modelValue="(v) => setInput('loanRequested', v as number)"
        />
        <AppField
          label="Amortization (years)"
          type="number"
          :model-value="store.currentDeal.value.inputs.amortYears"
          @update:modelValue="(v) => setInput('amortYears', v as number)"
        />
        <AppField
          label="Interest-Only Period (months)"
          type="number"
          :model-value="store.currentDeal.value.inputs.ioMonths"
          @update:modelValue="(v) => setInput('ioMonths', v as number)"
        />
        <AppField
          label="Spread over Index (bps)"
          type="number"
          :model-value="store.currentDeal.value.inputs.spreadBps"
          @update:modelValue="(v) => setInput('spreadBps', v as number)"
        />
        <AppField
          label="Min DSCR"
          type="number"
          step="0.01"
          :model-value="store.currentDeal.value.inputs.minDSCR"
          @update:modelValue="(v) => setInput('minDSCR', v as number)"
        />
        <AppField
          label="Max LTV (%)"
          type="number"
          step="0.5"
          :model-value="store.currentDeal.value.inputs.maxLTV"
          @update:modelValue="(v) => setInput('maxLTV', v as number)"
        />
        <AppField
          label="Min Debt Yield (%)"
          type="number"
          step="0.1"
          :model-value="store.currentDeal.value.inputs.minDY"
          @update:modelValue="(v) => setInput('minDY', v as number)"
        />
      </BlueprintCard>

      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 10px">
          <h4 style="margin: 0">Sizing Results</h4>
          <div style="display: flex; gap: 8px; flex-wrap: wrap">
            <AppTag
              v-for="m in metricDefs"
              :key="m.key"
              clickable
              :style="
                activeMetrics[m.key]
                  ? 'background:var(--color-accent);color:var(--color-bg);border:1px solid var(--color-accent);'
                  : 'background:transparent;color:var(--color-accent-700);border:1px solid var(--color-accent);'
              "
              @click="toggleMetric(m.key)"
            >
              {{ m.label }}
            </AppTag>
          </div>
        </div>

        <div class="scenario-grid" style="display: grid; gap: 20px">
          <BlueprintCard v-for="sc in scenarios" :key="sc.key" style="padding: 18px; display: flex; flex-direction: column; gap: 10px">
            <div style="display: flex; justify-content: space-between; align-items: baseline">
              <span class="card-kicker">{{ sc.label }}</span>
              <AppTag :variant="sc.fullySized ? 'accent' : 'neutral'">
                {{ sc.fullySized ? 'Meets Request' : 'Below Request' }}
              </AppTag>
            </div>
            <div>
              <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.6">
                Sized Proceeds
              </div>
              <div style="font-family: var(--font-heading); font-size: 28px; font-weight: 600">
                {{ fmtMoney(sc.sizedProceeds) }}
              </div>
              <div style="font-size: 12px; opacity: 0.7">
                Binding: {{ sc.bindingLabel }} · All-in rate {{ fmtPct(sc.allInRate) }}
              </div>
            </div>
            <div class="hr" style="margin: 2px 0"></div>
            <template v-for="row in sc.rows" :key="row.key">
              <div v-if="row.active" style="display: flex; justify-content: space-between; font-size: 13px; padding: 3px 0">
                <span style="opacity: 0.75">{{ row.label }}</span>
                <span :style="row.isBinding ? 'font-weight:700;color:var(--color-accent-700);' : 'font-weight:500;'">
                  {{ fmtMoney(row.value) }}
                </span>
              </div>
            </template>
          </BlueprintCard>
        </div>
      </div>
    </div>
  </div>

  <div v-else-if="store.currentDeal.value && store.printMode.value">
    <div
      class="print-sheet"
      style="
        max-width: 850px;
        margin: 32px auto 0;
        border: 1px solid var(--color-divider);
        box-shadow: var(--shadow-md);
        min-height: 1000px;
        display: flex;
        flex-direction: column;
        background: var(--color-bg);
      "
    >
      <div style="display: flex; align-items: center; justify-content: space-between">
        <div style="display: flex; align-items: center; gap: 12px">
          <img :src="brandLogo" alt="" style="width: 40px; height: 40px" />
          <div>
            <div style="font-family: var(--font-heading); font-size: 19px; font-weight: 600">
              SRS Real Estate Partners
            </div>
            <div style="font-size: 12px; opacity: 0.65">CRE Loan Sizing Summary</div>
          </div>
        </div>
        <div style="font-size: 12px; opacity: 0.65; text-align: right">
          {{ printDate }}<br />
          Rates as of {{ rates.lastRefreshed }}
        </div>
      </div>
      <div style="margin-top: 18px">
        <div style="font-family: var(--font-heading); font-size: 17px; font-weight: 600">
          {{ store.currentDeal.value.name }}
        </div>
        <div style="font-size: 12px; opacity: 0.65">
          {{ store.currentDeal.value.propertyType }} · {{ store.currentDeal.value.location }}
        </div>
      </div>
      <div class="hr" style="margin: 22px 0"></div>
      <div style="overflow-x: auto">
        <table class="table" style="min-width: 480px">
          <thead>
            <tr>
              <th>Constraint</th>
              <th v-for="sc in scenarios" :key="sc.key">{{ sc.label }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in printRows" :key="row.label" :style="row.bold ? 'font-weight:700;border-top:2px solid var(--color-text);' : ''">
              <td>{{ row.label }}</td>
              <td v-for="(v, i) in row.values" :key="i">{{ v }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div style="margin-top: auto; padding-top: 28px; font-size: 10px; opacity: 0.6; line-height: 1.5">
        Prepared by SRS Real Estate Partners for internal underwriting use. Sizing is indicative, subject to full
        underwriting, third-party reports and lender credit approval. Confidential — not for redistribution.
        <div style="display: flex; justify-content: space-between; margin-top: 6px">
          <span>srsre.com</span><span>Page 1 of 1</span>
        </div>
      </div>
    </div>
    <div class="no-print" style="text-align: center; padding: 20px; display: flex; justify-content: center; gap: 10px">
      <AppButton variant="primary" @click="exportPdf">Print</AppButton>
      <AppButton variant="secondary" @click="store.togglePrintMode()">Back to Dashboard</AppButton>
    </div>
  </div>
</template>

<style scoped>
.dashboard-page {
  padding: 24px 32px;
}
.assumptions-grid {
  grid-template-columns: 280px 1fr;
}
.scenario-grid {
  grid-template-columns: repeat(3, 1fr);
}
.print-sheet {
  padding: 56px 64px;
}

@media (max-width: 640px) {
  .dashboard-page {
    padding: 16px;
  }
  .assumptions-grid,
  .scenario-grid {
    grid-template-columns: 1fr;
  }
  .print-sheet {
    padding: 20px;
  }
}
</style>
