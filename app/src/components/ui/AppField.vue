<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string
    modelValue: string | number
    type?: string
    step?: string | number
  }>(),
  {
    type: 'text',
  },
)
defineEmits<{ 'update:modelValue': [value: string | number] }>()
</script>

<template>
  <div class="field">
    <label v-if="label">{{ label }}</label>
    <input
      class="input"
      :type="type"
      :step="step"
      :value="modelValue"
      @change="
        $emit(
          'update:modelValue',
          type === 'number' ? parseFloat(($event.target as HTMLInputElement).value) || 0 : ($event.target as HTMLInputElement).value,
        )
      "
    />
  </div>
</template>
