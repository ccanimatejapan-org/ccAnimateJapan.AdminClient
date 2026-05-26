<script setup>
defineOptions({
  inheritAttrs: false,
})

defineProps({
  as: {
    type: String,
    default: 'p',
  },
  tone: {
    type: String,
    default: 'error',
  },
})
</script>

<template>
  <component
    :is="as"
    v-bind="$attrs"
    class="message-block"
    :class="`message-block--${tone}`"
  >
    <slot />
  </component>
</template>

<style scoped>
.message-block {
  margin: 0;
  border-radius: 8px;
  font-size: 0.9rem;
  line-height: 1.5;
  padding: 10px 12px;
}

.message-block--error {
  border: 1px solid #efc2c2;
  background: #fff3f0;
  color: #9d2b2f;
}

.message-block--success {
  border: 1px solid #bfd8cb;
  background: #f0faf4;
  color: #22614c;
}

.message-block--empty {
  border: 1px dashed #cddbd2;
  color: #59665f;
  padding: 18px;
}
</style>
