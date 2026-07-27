<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '../components/ui/AppButton.vue'
import AppTag from '../components/ui/AppTag.vue'
import BlueprintCard from '../components/ui/BlueprintCard.vue'
import { fmtMoney } from '../lib/sizing'
import { useDealsStore } from '../stores/deals'

const router = useRouter()
const store = useDealsStore()
const sampleDealBase = import.meta.env.BASE_URL

const excelInput = ref<HTMLInputElement | null>(null)
const excelError = ref<string | null>(null)
const excelBusy = ref(false)

const googleBusy = ref(false)
const googleNotice = ref<string | null>(null)

function selectDeal(id: string) {
  store.selectDeal(id)
  router.push({ name: 'dashboard', params: { dealId: id } })
}

function openExcelPicker() {
  excelError.value = null
  excelInput.value?.click()
}

async function onExcelChosen(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  excelBusy.value = true
  excelError.value = null
  try {
    // Dynamically imported so the ~370kB xlsx parser only loads if someone
    // actually uploads a workbook, instead of bloating the initial bundle.
    const { importExcelDeal } = await import('../lib/importExcel')
    const deal = await importExcelDeal(file)
    store.addDeal(deal)
    router.push({ name: 'dashboard', params: { dealId: deal.id } })
  } catch (err) {
    excelError.value = err instanceof Error ? err.message : 'Could not import this workbook.'
  } finally {
    excelBusy.value = false
    if (excelInput.value) excelInput.value.value = ''
  }
}

async function connectGoogleSheet() {
  googleNotice.value = null
  googleBusy.value = true
  try {
    // Dynamically imported so the Google Identity Services bootstrapping
    // only happens if someone actually clicks Connect.
    const { getGoogleSheetsConfig, fetchDealFromSheet } = await import('../lib/googleSheets')
    const config = getGoogleSheetsConfig()
    if (!config) {
      googleNotice.value =
        'Using sample data — set VITE_GOOGLE_CLIENT_ID, VITE_GOOGLE_API_KEY, and VITE_GOOGLE_SHEET_ID in app/.env to connect a real Google Sheet (see app/.env.example).'
      return
    }
    const deal = await fetchDealFromSheet(config)
    store.addDeal(deal)
    router.push({ name: 'dashboard', params: { dealId: deal.id } })
  } catch (err) {
    googleNotice.value = `Using sample data — ${err instanceof Error ? err.message : 'the Google Sheets connection failed.'}`
  } finally {
    googleBusy.value = false
  }
}
</script>

<template>
  <div class="import-page" style="max-width: 1100px; margin: 0 auto">
    <h2>Select a Deal</h2>
    <p class="text-muted" style="margin-top: -8px">
      Pick a mock deal, upload a workbook, or connect a Google Sheet to load one into the sizing dashboard.
    </p>

    <div
      style="
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: var(--space-6);
        margin-top: var(--space-6);
      "
    >
      <BlueprintCard v-for="deal in store.deals.value" :key="deal.id" style="padding: 18px">
        <div style="display: flex; justify-content: space-between; align-items: baseline">
          <span class="card-kicker">{{ deal.propertyType }}</span>
          <AppTag variant="outline">{{ deal.source }}</AppTag>
        </div>
        <div class="card-title">{{ deal.name }}</div>
        <p class="card-body">{{ deal.location }}</p>
        <div class="card-meta" style="flex-wrap: wrap; gap: 12px">
          <span>Value {{ fmtMoney(deal.inputs.propertyValue) }}</span>
          <span>NOI {{ fmtMoney(deal.inputs.noi) }}</span>
          <span>Requested {{ fmtMoney(deal.inputs.loanRequested) }}</span>
        </div>
        <AppButton variant="primary" block @click="selectDeal(deal.id)">Open Sizing Dashboard</AppButton>
      </BlueprintCard>
    </div>

    <BlueprintCard style="padding: 18px; margin-top: var(--space-8); max-width: 480px">
      <h4 style="margin: 0">Import a Deal</h4>
      <p class="card-body" style="margin: 0">
        Bring in a deal from your own Excel workbook or a connected Google Sheet.
        <a :href="`${sampleDealBase}sample-deal.xlsx`" download>Download a sample workbook</a> to see the expected layout, or to try
        the upload yourself.
      </p>
      <div style="display: flex; gap: 10px; flex-wrap: wrap">
        <AppButton variant="secondary" :disabled="excelBusy" @click="openExcelPicker">
          {{ excelBusy ? 'Importing…' : 'Upload Excel' }}
        </AppButton>
        <AppButton variant="secondary" :disabled="googleBusy" @click="connectGoogleSheet">
          {{ googleBusy ? 'Connecting…' : 'Connect Google Sheet' }}
        </AppButton>
      </div>
      <input
        ref="excelInput"
        type="file"
        accept=".xlsx,.xls"
        style="display: none"
        @change="onExcelChosen"
      />
      <p v-if="excelError" style="color: var(--color-accent-700); font-size: 13px; margin: 0">
        {{ excelError }}
      </p>
      <p v-if="googleNotice" class="text-muted" style="font-size: 13px; margin: 0">
        {{ googleNotice }}
      </p>
    </BlueprintCard>
  </div>
</template>

<style scoped>
.import-page {
  padding: 32px;
}

@media (max-width: 640px) {
  .import-page {
    padding: 16px;
  }
}
</style>
