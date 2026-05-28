<script setup>
defineProps({
  label: {
    type: String,
    required: true,
  },
  open: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  tone: {
    type: String,
    default: 'activity',
  },
})

defineEmits(['toggle'])
</script>

<template>
  <div class="custom-select" :class="[`custom-select--${tone}`, { 'is-open': open }]">
    <button
      class="custom-select-trigger"
      type="button"
      :disabled="disabled"
      @click="$emit('toggle')"
    >
      <span>{{ label }}</span>
      <span aria-hidden="true">⌄</span>
    </button>
    <div v-if="open" class="custom-select-menu" role="listbox">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.custom-select {
  --select-accent: #b84d55;
  --select-accent-soft: #fff8f0;
  --select-accent-text: #8f3f47;
  --select-shell-background: #fff8f0;
  position: relative;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.2;
}

.custom-select--product,
.custom-select--inventory {
  --select-accent: #277867;
  --select-accent-soft: #f4fbf7;
  --select-accent-text: #1f6154;
  --select-shell-background: #f4fbf7;
}

.custom-select--orders {
  --select-accent: #c48445;
  --select-accent-soft: #fff7eb;
  --select-accent-text: #824b0d;
  --select-shell-background: #fff7eb;
}

.custom-select-trigger {
  display: flex;
  width: 100%;
  min-height: 46px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid #eaded2;
  border-radius: 10px;
  background: var(--select-shell-background);
  color: #2a2825;
  padding: 0 13px;
  font: inherit;
  text-align: left;
}

.custom-select-trigger:hover:not(:disabled),
.custom-select.is-open .custom-select-trigger {
  border-color: var(--select-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--select-accent) 14%, transparent);
}

.custom-select-trigger:disabled {
  cursor: wait;
  opacity: 0.72;
}

.custom-select-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  left: 0;
  z-index: 30;
  display: grid;
  max-height: 220px;
  overflow: auto;
  border: 1px solid #eaded2;
  border-radius: 14px;
  background: var(--select-shell-background);
  box-shadow: 0 18px 44px rgb(114 74 56 / 16%);
  padding: 6px;
}

.custom-select :slotted(.custom-select-option) {
  min-height: 38px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: #384942;
  padding: 0 11px;
  font: inherit;
  text-align: left;
}

.custom-select :slotted(.custom-select-option:hover),
.custom-select :slotted(.custom-select-option:focus-visible) {
  background: var(--select-accent-soft);
  color: var(--select-accent-text);
  outline: none;
}
</style>
