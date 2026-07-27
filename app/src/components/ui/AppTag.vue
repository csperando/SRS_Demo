<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'accent' | 'accent-2' | 'neutral' | 'outline' | null
    clickable?: boolean
  }>(),
  {
    variant: null,
    clickable: false,
  },
)
</script>

<template>
  <button v-if="clickable" type="button" class="tag" :class="variant ? `tag-${variant}` : null">
    <slot />
  </button>
  <span v-else class="tag" :class="variant ? `tag-${variant}` : null">
    <slot />
  </span>
</template>
