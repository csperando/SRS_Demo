<script setup lang="ts">
defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <div
    v-if="open"
    class="dialog-backdrop"
    style="justify-content: flex-end; padding: 0; z-index: 30"
    @click="emit('close')"
  >
    <div
      class="dialog elev-lg"
      style="height: 100%; width: 420px; max-width: 90vw; border-radius: 0; overflow-y: auto; gap: 18px"
      @click.stop
    >
      <div style="display: flex; justify-content: space-between; align-items: center">
        <div class="dialog-title">User Guide</div>
        <button class="btn btn-ghost" @click="emit('close')">Close</button>
      </div>
      <div>
        <h5 style="margin: 0 0 6px">Getting Started</h5>
        <p style="font-size: 13px; opacity: 0.8; margin: 0">
          Enter the deal's property value, NOI, requested loan amount and underwriting assumptions on the left.
          Sizing recalculates instantly across three scenarios and four constraint methods.
        </p>
      </div>
      <div>
        <h5 style="margin: 0 0 6px">Refreshing Rates</h5>
        <p style="font-size: 13px; opacity: 0.8; margin: 0">
          UST yields and Prime pull automatically from public sources on open and via Refresh. 1-Month Term SOFR
          has no compliant free public feed, so it's entered manually with an as-of date — swap in a licensed
          feed if your team has one. If a source is unreachable, the model keeps the last known values and flags
          them as a fallback.
        </p>
      </div>
      <div>
        <h5 style="margin: 0 0 6px">Exporting for Print</h5>
        <p style="font-size: 13px; opacity: 0.8; margin: 0">
          Switch to Print Preview for the client/lender-ready layout with letterhead, scenario summary and footer
          disclosure. Export PDF opens your browser's print dialog — choose "Save as PDF" there.
        </p>
      </div>
      <div>
        <h5 style="margin: 0 0 6px">Rate Feed Architecture</h5>
        <p style="font-size: 13px; opacity: 0.8; margin: 0">
          Sources → refresh handler (on open + manual button) → last-known-value cache → display with timestamp.
          This keeps the model usable even when a source is temporarily unreachable.
        </p>
      </div>
      <div>
        <h5 style="margin: 0 0 6px">Customizing the Dashboard</h5>
        <p style="font-size: 13px; opacity: 0.8; margin: 0">
          Use the chips above the scenario cards to show or hide any constraint method — the layout remembers
          your selection for the session.
        </p>
      </div>
    </div>
  </div>
</template>
