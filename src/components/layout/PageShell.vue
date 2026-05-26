<template>
  <section class="page-shell">
    <slot />
  </section>
</template>

<style scoped>
.page-shell {
  display: grid;
  min-height: calc(100vh - 120px);
  align-content: start;
  gap: 26px;
}
</style>
