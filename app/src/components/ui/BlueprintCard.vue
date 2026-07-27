<script setup lang="ts">
withDefaults(defineProps<{ elevation?: 'sm' | 'md' | 'lg' | null }>(), {
  elevation: null,
})
</script>

<template>
  <div class="blueprint card" :class="elevation ? `elev-${elevation}` : null">
    <i class="corner tl"></i><i class="corner tr"></i><i class="corner bl"></i><i class="corner br"></i>
    <slot />
  </div>
</template>
