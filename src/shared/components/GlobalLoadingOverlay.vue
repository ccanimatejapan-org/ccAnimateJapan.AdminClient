<script setup>
import { watch, onUnmounted } from 'vue'
import { useUiStore } from '@/shared/stores/uiStore'

const uiStore = useUiStore()

const bodyLockClass = 'global-loading-locked'

// 遮罩顯示時鎖住背景捲動（沿用既有 body class 鎖捲動的做法）
// immediate: true 確保元件掛載時若 isLoading 已為 true，body class 也會被正確補上
watch(
  () => uiStore.isLoading,
  (loading) => {
    document.body.classList.toggle(bodyLockClass, loading)
  },
  { immediate: true },
)

onUnmounted(() => {
  document.body.classList.remove(bodyLockClass)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="global-loading-fade">
      <div
        v-if="uiStore.isLoading"
        class="global-loading"
        role="alert"
        aria-busy="true"
        aria-live="polite"
      >
        <div class="global-loading__spinner" aria-hidden="true" />
        <p class="global-loading__text">處理中...</p>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.global-loading {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 16px;
  background: rgba(20, 18, 16, 0.45);
  backdrop-filter: blur(1px);
}

.global-loading__spinner {
  width: 52px;
  height: 52px;
  border: 4px solid rgba(255, 255, 255, 0.35);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: global-loading-spin 0.8s linear infinite;
}

.global-loading__text {
  margin: 0;
  color: #ffffff;
  font-size: 0.95rem;
  letter-spacing: 0.08em;
}

@keyframes global-loading-spin {
  to {
    transform: rotate(360deg);
  }
}

.global-loading-fade-enter-active,
.global-loading-fade-leave-active {
  transition: opacity 0.2s ease;
}

.global-loading-fade-enter-from,
.global-loading-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .global-loading__spinner {
    animation-duration: 1.6s;
  }
}
</style>
