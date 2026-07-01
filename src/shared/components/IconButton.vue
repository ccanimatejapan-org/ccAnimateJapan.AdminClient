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
    default: 'close',
  },
})
</script>

<template>
  <button
    v-bind="$attrs"
    class="icon-button"
    :class="`icon-button--${variant}`"
    :type="type"
  >
    <slot />
  </button>
</template>

<style scoped>
.icon-button {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid #cbd6cf;
  background: #ffffff;
  color: #25352f;
  line-height: 1;
}

.icon-button:hover:not(:disabled) {
  border-color: #b84d55;
  color: #9d3e46;
}

.icon-button:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.icon-button--close {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  font-size: 1.45rem;
}

.icon-button--soft-close {
  width: 38px;
  height: 38px;
  border-color: #eaded2;
  border-radius: 12px;
  background: #fffdf9;
  font-size: 1.45rem;
}

.icon-button--table {
  width: 42px;
  min-height: 42px;
  border-color: #e8d8c8;
  border-radius: 999px;
  background: #fff8f0;
  color: #7d4d2f;
  font-size: 1.1rem;
}

.icon-button--table:hover:not(:disabled) {
  border-color: #c48445;
  background: #fff4e8;
  color: #7d4d2f;
}
</style>
