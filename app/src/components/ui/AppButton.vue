<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost'
    icon?: boolean
    block?: boolean
    disabled?: boolean
    type?: 'button' | 'submit'
  }>(),
  {
    variant: 'secondary',
    icon: false,
    block: false,
    disabled: false,
    type: 'button',
  },
)
</script>

<template>
  <button
    class="btn"
    :class="[`btn-${variant}`, { 'btn-icon': icon, 'btn-block': block }]"
    :type="type"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>
