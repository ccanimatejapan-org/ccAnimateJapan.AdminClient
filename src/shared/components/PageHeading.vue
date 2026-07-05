<script setup>
defineProps({
  eyebrow: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    required: true,
  },
  copy: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <div class="page-heading">
    <p v-if="eyebrow" class="page-heading__eyebrow">{{ eyebrow }}</p>
    <h1>{{ title }}</h1>
    <p v-if="copy" class="page-heading__copy">{{ copy }}</p>
  </div>
</template>

<style scoped>
.page-heading {
  display: grid;
  max-width: 720px;
  gap: 8px;
}

.page-heading__eyebrow {
  margin: 0 0 4px;
  color: #8a6c61;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

.page-heading h1 {
  margin: 0;
  color: #2c2926;
  font-size: 1.85rem;
  line-height: 1.18;
  letter-spacing: 0;
}

.page-heading__copy {
  margin: 0;
  color: #59665f;
  font-size: 1rem;
  line-height: 1.7;
}
</style>
