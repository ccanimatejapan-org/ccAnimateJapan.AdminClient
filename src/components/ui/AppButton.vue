<script setup>
defineOptions({
  inheritAttrs: false,
})

defineProps({
  type: {
    type: String,
    default: 'button',
  },
  variant: {
    type: String,
    default: 'ghost',
  },
  pill: {
    type: Boolean,
    default: false,
  },
  danger: {
    type: Boolean,
    default: false,
  },
  elevated: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <button
    v-bind="$attrs"
    class="app-button"
    :class="[
      `app-button--${variant}`,
      {
        'app-button--pill': pill,
        'app-button--danger': danger,
        'app-button--elevated': elevated,
      },
    ]"
    :type="type"
  >
    <slot />
  </button>
</template>

<style scoped>
.app-button {
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 8px;
  font-weight: 750;
  letter-spacing: 0;
  padding: 0 14px;
  white-space: nowrap;
}

.app-button--primary {
  border: 0;
  background: #b84d55;
  color: #ffffff;
  padding: 0 18px;
}

.app-button--primary:hover:not(:disabled) {
  background: #9d3e46;
}

.app-button--primary:disabled {
  opacity: 0.7;
}

.app-button--ghost {
  border: 1px solid #cbd6cf;
  background: #ffffff;
  color: #25352f;
}

.app-button--ghost:hover:not(:disabled) {
  border-color: #277867;
  color: #1f6154;
}

.app-button--pill {
  min-height: 44px;
  border-radius: 999px;
}

.app-button--pill.app-button--ghost {
  border-color: #eaded2;
  background: #fffdf9;
}

.app-button--pill.app-button--ghost:hover:not(:disabled) {
  border-color: #277867;
  background: #f0faf4;
  color: #1f6154;
}

.app-button--elevated.app-button--primary {
  box-shadow: 0 10px 22px rgb(184 77 85 / 18%);
}

.app-button--danger.app-button--ghost {
  border-color: #e7c5c7;
  background: #fff4f4;
  color: #9d3e46;
}

.app-button--danger.app-button--ghost:hover:not(:disabled) {
  border-color: #b84d55;
  background: #fff0f0;
  color: #9d3e46;
}
</style>
