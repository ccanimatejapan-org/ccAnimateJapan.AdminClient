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
  module: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <component
    :is="as"
    v-bind="$attrs"
    class="message-block"
    :class="[`message-block--${tone}`, module && `message-block--module-${module}`]"
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

.message-block--success.message-block--module-activity,
.message-block--empty.message-block--module-activity {
  border-color: #e6c3c7;
  background: #fff4f4;
  color: #963b44;
}

.message-block--success.message-block--module-orders,
.message-block--empty.message-block--module-orders {
  border-color: #edcd9c;
  background: #fff7eb;
  color: #955916;
}

.message-block--success.message-block--module-product,
.message-block--empty.message-block--module-product,
.message-block--success.message-block--module-inventory,
.message-block--empty.message-block--module-inventory {
  border-color: #bfd8cb;
  background: #f0faf4;
  color: #22614c;
}
</style>
