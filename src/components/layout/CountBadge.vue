<script setup>
defineProps({
  accent: {
    type: Boolean,
    default: false,
  },
  tone: {
    type: String,
    default: 'inventory',
  },
})
</script>

<template>
  <span class="count-badge" :class="[`count-badge--${tone}`, { 'count-badge--accent': accent }]">
    <slot />
  </span>
</template>

<style scoped>
.count-badge {
  flex: 0 0 auto;
  border: 1px solid #bfd8cb;
  border-radius: 999px;
  background: #f0faf4;
  color: #22614c;
  font-size: 0.88rem;
  font-weight: 800;
  padding: 7px 12px;
}

.count-badge--accent {
  border-color: #e8d8c8;
  background: #fff8f0;
  color: #7d4d2f;
}

.count-badge--activity {
  border-color: #efc9cc;
  background: #fff1f2;
  color: #9d3e46;
}

.count-badge--product,
.count-badge--inventory {
  border-color: #bfd8cb;
  background: #f0faf4;
  color: #22614c;
}

@media (max-width: 560px) {
  .count-badge {
    text-align: center;
  }
}
</style>
