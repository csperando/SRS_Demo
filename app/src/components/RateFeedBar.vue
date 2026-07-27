<script setup lang="ts">
import { computed } from 'vue'
import AppButton from './ui/AppButton.vue'
import AppTag from './ui/AppTag.vue'
import BlueprintCard from './ui/BlueprintCard.vue'
import { fmtPct, type MarketRates } from '../lib/sizing'

const props = withDefaults(
  defineProps<{
    rates: MarketRates
    showForwardCurve?: boolean
    isFallback?: boolean
  }>(),
  {
    showForwardCurve: true,
    isFallback: false,
  },
)

const emit = defineEmits<{
  'update:sofr1m': [value: number]
  'update:sofr1mAsOf': [value: string]
  refresh: []
}>()

const statusLabel = computed(() => (props.isFallback ? 'Fallback — last known' : 'Live'))
const statusVariant = computed(() => (props.isFallback ? 'neutral' : 'accent'))

function onSofr1mChange(event: Event) {
  emit('update:sofr1m', parseFloat((event.target as HTMLInputElement).value) || 0)
}

function onSofr1mDateChange(event: Event) {
  emit('update:sofr1mAsOf', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <BlueprintCard style="padding: 16px 22px">
    <div style="display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 18px">
      <div style="display: flex; gap: 30px; flex-wrap: wrap">
        <div style="min-width: 80px">
          <div class="rate-label">UST 5Y</div>
          <div class="rate-value">{{ fmtPct(rates.ust5y) }}</div>
        </div>
        <div style="min-width: 80px">
          <div class="rate-label">UST 10Y</div>
          <div class="rate-value">{{ fmtPct(rates.ust10y) }}</div>
        </div>
        <div style="min-width: 80px">
          <div class="rate-label">Prime Rate</div>
          <div class="rate-value">{{ fmtPct(rates.prime) }}</div>
        </div>
        <div style="min-width: 160px">
          <div class="rate-label" style="display: flex; align-items: center; gap: 5px">
            1M Term SOFR <AppTag variant="outline" style="font-size: 9px; padding: 1px 5px">Manual</AppTag>
          </div>
          <div style="display: flex; align-items: baseline; gap: 5px">
            <input
              class="input"
              type="number"
              step="0.01"
              :value="rates.sofr1m"
              style="
                width: 64px;
                font-family: var(--font-heading);
                font-size: 18px;
                font-weight: 600;
                padding: 2px 6px;
                min-height: auto;
              "
              @change="onSofr1mChange"
            />
            <span style="font-size: 15px">%</span>
          </div>
          <div style="display: flex; align-items: center; gap: 4px; margin-top: 3px">
            <span style="font-size: 10px; opacity: 0.55">as of</span>
            <input
              class="input"
              type="date"
              :value="rates.sofr1mAsOf"
              style="font-size: 11px; padding: 2px 4px; min-height: auto; width: 126px"
              @change="onSofr1mDateChange"
            />
          </div>
        </div>
        <div v-if="showForwardCurve" style="min-width: 220px">
          <div class="rate-label">SOFR Forward Curve</div>
          <div style="display: flex; gap: 14px; margin-top: 3px">
            <div><div style="font-size: 9px; opacity: 0.55">1M</div><div style="font-size: 13px; font-weight: 600">{{ fmtPct(rates.fwd1m) }}</div></div>
            <div><div style="font-size: 9px; opacity: 0.55">3M</div><div style="font-size: 13px; font-weight: 600">{{ fmtPct(rates.fwd3m) }}</div></div>
            <div><div style="font-size: 9px; opacity: 0.55">6M</div><div style="font-size: 13px; font-weight: 600">{{ fmtPct(rates.fwd6m) }}</div></div>
            <div><div style="font-size: 9px; opacity: 0.55">12M</div><div style="font-size: 13px; font-weight: 600">{{ fmtPct(rates.fwd12m) }}</div></div>
          </div>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 10px">
        <AppTag :variant="statusVariant">{{ statusLabel }}</AppTag>
        <span style="font-size: 11px; opacity: 0.6">as of {{ rates.lastRefreshed }}</span>
        <AppButton variant="secondary" @click="emit('refresh')">Refresh</AppButton>
      </div>
    </div>
    <p v-if="isFallback" style="font-size: 12px; margin: 10px 0 0; opacity: 0.7">
      Source unreachable — showing last cached values from {{ rates.lastRefreshed }}. Retrying automatically on next
      open.
    </p>
  </BlueprintCard>
</template>

<style scoped>
.rate-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.6;
}
.rate-value {
  font-family: var(--font-heading);
  font-size: 20px;
  font-weight: 600;
}
</style>
