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
})

defineEmits(['toggle'])
</script>

<template>
  <div class="custom-select" :class="{ 'is-open': open }">
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
  position: relative;
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
  background: #fffdf9;
  color: #2a2825;
  padding: 0 13px;
  text-align: left;
}

.custom-select-trigger:hover:not(:disabled),
.custom-select.is-open .custom-select-trigger {
  border-color: #b84d55;
  box-shadow: 0 0 0 3px rgb(184 77 85 / 12%);
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
  background: #fffdf9;
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
  text-align: left;
}

.custom-select :slotted(.custom-select-option:hover),
.custom-select :slotted(.custom-select-option:focus-visible) {
  background: #fff4e8;
  color: #7d4d2f;
  outline: none;
}
</style>
