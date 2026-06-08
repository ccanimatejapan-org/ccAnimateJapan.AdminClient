<script setup>
import GlobalLoadingOverlay from '@/components/ui/GlobalLoadingOverlay.vue'
</script>

<template>
  <router-view />
  <GlobalLoadingOverlay />
</template>

<style>
:root {
  color: #2a2825;
  background: #f7f1ea;
  font-family:
    "Noto Sans TC", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
}

* {
  box-sizing: border-box;
}

html {
  min-width: 320px;
  min-height: 100%;
}

body {
  min-width: 320px;
  min-height: 100vh;
  margin: 0;
}

body.dialog-scroll-locked {
  overflow: hidden;
}

body.global-loading-locked {
  overflow: hidden;
}

button,
input,
select,
textarea {
  font: inherit;
}

button {
  cursor: pointer;
}

button:disabled {
  cursor: wait;
}
</style>
