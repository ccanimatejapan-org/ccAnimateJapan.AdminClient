<script setup>
import { computed } from 'vue'
import apexchart from 'vue3-apexcharts'
import PanelCard from '@/shared/components/PanelCard.vue'
import MessageBlock from '@/shared/components/MessageBlock.vue'
import { formatCurrency, formatNumber } from '@/shared/utils/format'
import { activityStatusOptions } from '@/modules/activity/utils/activityMapper'

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
})

const statusLabel = (status) =>
  activityStatusOptions.find((option) => option.value === Number(status))?.label || '—'

const topItems = computed(() => props.items.slice(0, 8))

const barSeries = computed(() => [
  { name: '營收', data: topItems.value.map((item) => Number(item.revenue || 0)) },
])

const barOptions = computed(() => ({
  chart: { toolbar: { show: false }, fontFamily: 'inherit' },
  colors: ['#5468a6'],
  plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '60%' } },
  dataLabels: { enabled: false },
  xaxis: {
    categories: topItems.value.map((item) => item.name || `#${item.activityId}`),
    labels: { formatter: (value) => formatNumber(value) },
  },
  grid: { borderColor: '#eef1f6' },
  tooltip: { y: { formatter: (value) => formatCurrency(value) } },
}))
</script>

<template>
  <PanelCard>
    <div class="panel-head"><h2>活動表現</h2></div>
    <MessageBlock v-if="!items.length" tone="empty">此期間沒有活動訂單</MessageBlock>
    <template v-else>
      <apexchart type="bar" height="300" :options="barOptions" :series="barSeries" />
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>活動</th>
              <th>狀態</th>
              <th class="num">訂單數</th>
              <th class="num">營收</th>
              <th class="num">商品數</th>
              <th class="num">客單價</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.activityId">
              <td>{{ item.name || `#${item.activityId}` }}</td>
              <td>{{ statusLabel(item.status) }}</td>
              <td class="num">{{ formatNumber(item.orderCount) }}</td>
              <td class="num">{{ formatCurrency(item.revenue) }}</td>
              <td class="num">{{ formatNumber(item.productCount) }}</td>
              <td class="num">{{ formatCurrency(item.avgOrderValue) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </PanelCard>
</template>

<style scoped>
.panel-head {
  margin-bottom: 12px;
}

.panel-head h2 {
  margin: 0;
  color: #25324f;
  font-size: 1.1rem;
}

.table-wrap {
  overflow-x: auto;
  margin-top: 12px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}

th,
td {
  padding: 9px 12px;
  border-bottom: 1px solid #eef1f6;
  text-align: left;
  white-space: nowrap;
}

th {
  color: #6a7488;
  font-weight: 700;
}

td {
  color: #2c3346;
}

.num {
  text-align: right;
}
</style>
