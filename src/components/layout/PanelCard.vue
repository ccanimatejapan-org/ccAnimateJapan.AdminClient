<script setup>
defineProps({
  accent: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <section class="panel-card" :class="{ 'panel-card--accent': accent }">
    <slot />
  </section>
</template>

<style scoped>
.panel-card {
  min-width: 0;
  border: 1px solid #cddbd2;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 18px 48px rgb(24 42 38 / 8%);
  padding: 22px;
}

.panel-card--accent {
  position: relative;
  overflow: hidden;
  border-color: #eaded2;
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgb(255 255 255 / 96%), rgb(255 250 244 / 98%)),
    #ffffff;
  box-shadow: 0 18px 44px rgb(114 74 56 / 10%);
  padding: 24px;
}

.panel-card--accent::before {
  position: absolute;
  inset: 0 0 auto;
  height: 5px;
  background: #b84d55;
  content: '';
}

@media (max-width: 560px) {
  .panel-card {
    padding: 16px;
  }

  .panel-card--accent {
    padding: 18px;
  }
}
</style>
