<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import brandLogo from '../assets/srs_brand.webp'
import { useDealsStore } from '../stores/deals'
import HelpPanel from './HelpPanel.vue'
import AppButton from './ui/AppButton.vue'

const route = useRoute()
const store = useDealsStore()
const helpOpen = ref(false)

const isDealRoute = computed(() => route.name === 'dashboard')
const printBtnLabel = computed(() => (store.printMode.value ? 'Back to Dashboard' : 'Print Preview'))
</script>

<template>
  <div
    class="nav no-print"
    style="
      border-bottom: 1px solid var(--color-divider);
      position: sticky;
      top: 0;
      background: var(--color-bg);
      z-index: 20;
      flex-wrap: wrap;
      row-gap: 8px;
    "
  >
    <router-link
      to="/"
      style="display: flex; align-items: center; gap: 10px; text-decoration: none; color: inherit; margin-right: auto"
    >
      <img :src="brandLogo" alt="" style="width: 34px; height: 34px" />
      <span class="nav-brand" style="display: flex; align-items: baseline; gap: 10px; margin-right: 0">
        <span>SRS Real Estate Partners</span>
        <span class="nav-subtitle" style="font-family: var(--font-body); font-weight: 400; font-size: 13px; color: var(--color-accent-700)">
          CRE Loan Sizing Model
        </span>
      </span>
    </router-link>
    <router-link to="/portfolio">Portfolio</router-link>
    <AppButton variant="ghost" @click="helpOpen = true">Help</AppButton>
    <AppButton v-if="isDealRoute" variant="secondary" @click="store.togglePrintMode()">
      {{ printBtnLabel }}
    </AppButton>
  </div>
  <HelpPanel :open="helpOpen" @close="helpOpen = false" />
</template>

<style scoped>
@media (max-width: 640px) {
  .nav-subtitle {
    display: none;
  }
}
</style>
