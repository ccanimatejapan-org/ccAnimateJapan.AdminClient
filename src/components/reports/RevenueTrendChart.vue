<script setup>
import { computed } from 'vue'
import apexchart from 'vue3-apexcharts'
import PanelCard from '@/components/layout/PanelCard.vue'
import MessageBlock from '@/components/ui/MessageBlock.vue'
import { formatNumber } from '@/utils/format'

const props = defineProps({
  trend: {
    type: Array,
    default: () => [],
  },
  granularity: {
    type: String,
    default: 'day',
  },
})

const formatBucket = (iso) => {
  const datePart = String(iso || '').slice(0, 10)
  const [year, month, day] = datePart.split('-')
  if (!year) return iso
  return props.granularity === 'month' ? `${year}/${Number(month)}` : `${Number(month)}/${Number(day)}`
}

const series = computed(() => [
  { name: '營收', type: 'column', data: props.trend.map((point) => Number(point.revenue || 0)) },
  { name: '訂單數', type: 'line', data: props.trend.map((point) => Number(point.orderCount || 0)) },
])

const chartOptions = computed(() => ({
  chart: { toolbar: { show: false }, fontFamily: 'inherit' },
  colors: ['#5468a6', '#c48445'],
  stroke: { width: [0, 3], curve: 'smooth' },
  plotOptions: { bar: { columnWidth: '55%', borderRadius: 4 } },
  dataLabels: { enabled: false },
  xaxis: { categories: props.trend.map((point) => formatBucket(point.bucket)) },
  yaxis: [
    { title: { text: '營收 (TWD)' }, labels: { formatter: (value) => formatNumber(value) } },
    { opposite: true, min: 0, title: { text: '訂單數' }, labels: { formatter: (value) => formatNumber(Math.round(value)) } },
  ],
  legend: { position: 'top' },
  tooltip: { shared: true, intersect: false },
  grid: { borderColor: '#eef1f6' },
}))
</script>

<template>
  <PanelCard>
    <div class="chart-head">
      <h2>營收與訂單趨勢</h2>
    </div>
    <apexchart v-if="trend.length" type="line" height="330" :options="chartOptions" :series="series" />
    <MessageBlock v-else tone="empty">此期間沒有資料</MessageBlock>
  </PanelCard>
</template>

<style scoped>
.chart-head {
  margin-bottom: 8px;
}

.chart-head h2 {
  margin: 0;
  color: #25324f;
  font-size: 1.1rem;
}
</style>
