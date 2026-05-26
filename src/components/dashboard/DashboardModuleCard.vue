<script setup>
defineProps({
  module: {
    type: Object,
    required: true,
  },
  iconPaths: {
    type: Array,
    required: true,
  },
})

defineEmits(['open'])
</script>

<template>
  <button
    class="module-card"
    type="button"
    :style="{ '--module-accent': module.accent }"
    :aria-label="module.path ? `進入${module.title}` : module.title"
    @click="$emit('open', module)"
  >
    <span class="module-icon" aria-hidden="true">
      <svg class="module-svg" viewBox="0 0 24 24" role="img">
        <path
          v-for="path in iconPaths"
          :key="path"
          :d="path"
        />
      </svg>
    </span>
    <span class="module-title">{{ module.title }}</span>
    <span v-if="module.path" class="module-arrow" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </svg>
    </span>
  </button>
</template>

<style scoped>
.module-card {
  --module-accent: #277867;
  position: relative;
  display: grid;
  min-height: 188px;
  align-content: space-between;
  gap: 18px;
  overflow: hidden;
  border: 1px solid #eaded2;
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgb(255 255 255 / 94%), rgb(255 250 244 / 98%)),
    #ffffff;
  box-shadow: 0 18px 44px rgb(114 74 56 / 10%);
  color: #13201c;
  text-align: left;
  padding: 24px;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
}

.module-card::before {
  position: absolute;
  inset: 0 0 auto;
  height: 5px;
  background: var(--module-accent);
  content: '';
}

.module-card::after {
  position: absolute;
  right: -42px;
  bottom: -48px;
  width: 132px;
  height: 132px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--module-accent) 14%, transparent);
  content: '';
}

.module-card:hover {
  border-color: color-mix(in srgb, var(--module-accent) 58%, #eaded2);
  box-shadow: 0 22px 56px rgb(114 74 56 / 15%);
  transform: translateY(-3px);
}

.module-card:focus-visible {
  border-color: var(--module-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--module-accent) 22%, transparent);
  outline: none;
}

.module-icon {
  position: relative;
  z-index: 1;
  display: grid;
  width: 58px;
  height: 58px;
  place-items: center;
  border-radius: 16px;
  background: color-mix(in srgb, var(--module-accent) 13%, #ffffff);
  color: var(--module-accent);
}

.module-svg {
  width: 30px;
  height: 30px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.9;
}

.module-title {
  position: relative;
  z-index: 1;
  display: block;
  color: #13201c;
  font-size: 1.28rem;
  font-weight: 800;
  line-height: 1.25;
}

.module-arrow {
  position: absolute;
  right: 22px;
  bottom: 18px;
  z-index: 1;
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border-radius: 999px;
  background: #fffaf4;
  color: var(--module-accent);
}

.module-arrow svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

@media (max-width: 560px) {
  .module-card {
    min-height: 156px;
    padding: 22px;
  }
}
</style>
