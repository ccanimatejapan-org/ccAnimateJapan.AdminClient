<script setup>
import { computed } from 'vue'
import apexchart from 'vue3-apexcharts'

const props = defineProps({
  title: {
    type: String,
    default: '',
  },
  labels: {
    type: Array,
    default: () => [],
  },
  series: {
    type: Array,
    default: () => [],
  },
})

const hasData = computed(() => props.series.some((value) => Number(value) > 0))

const options = computed(() => ({
  chart: { fontFamily: 'inherit' },
  labels: props.labels,
  legend: { position: 'bottom', fontSize: '12px' },
  dataLabels: { enabled: true, formatter: (value) => `${Math.round(value)}%` },
  colors: ['#5468a6', '#277867', '#c48445', '#b84d55', '#7a5bb0', '#3f9d8a', '#cf9a52'],
  stroke: { width: 1 },
  tooltip: { y: { formatter: (value) => `${value} 筆` } },
}))
</script>

<template>
  <div class="donut">
    <p class="donut__title">{{ title }}</p>
    <apexchart v-if="hasData" type="donut" height="240" :options="options" :series="series" />
    <p v-else class="donut__empty">無資料</p>
  </div>
</template>

<style scoped>
.donut {
  display: grid;
  gap: 6px;
}

.donut__title {
  margin: 0;
  color: #44506e;
  font-size: 0.9rem;
  font-weight: 700;
}

.donut__empty {
  color: #8a93a6;
  font-size: 0.85rem;
  padding: 40px 0;
  text-align: center;
}
</style>
