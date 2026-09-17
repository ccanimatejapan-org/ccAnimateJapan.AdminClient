<script setup>
import { computed } from 'vue'
import { useTableSort } from '@/shared/composables/useTableSort'
import apexchart from 'vue3-apexcharts'
import PanelCard from '@/shared/components/PanelCard.vue'
import MessageBlock from '@/shared/components/MessageBlock.vue'
import { formatCurrency, formatNumber } from '@/shared/utils/format'

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
})

const barSeries = computed(() => [
  { name: '銷售數量', data: props.items.map((item) => Number(item.qtySold || 0)) },
])

const barOptions = computed(() => ({
  chart: { toolbar: { show: false }, fontFamily: 'inherit' },
  colors: ['#277867'],
  plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '60%' } },
  dataLabels: { enabled: true },
  xaxis: { categories: props.items.map((item) => item.name || `#${item.productId}`) },
  grid: { borderColor: '#eef1f6' },
  tooltip: { y: { formatter: (value) => `${value} 件` } },
}))

const columns = [
  { key: 'name', label: '商品', sortable: true, getValue: (item) => item.name || ('#' + item.productId) },
  { key: 'activityName', label: '活動', sortable: true, getValue: (item) => item.activityName || '' },
  { key: 'qtySold', label: '數量', sortable: true, align: 'num', getValue: (item) => Number(item.qtySold || 0) },
  { key: 'revenue', label: '銷售額', sortable: true, align: 'num', getValue: (item) => Number(item.revenue || 0) },
]
const { sortedItems, isSortActive, toggleSort, getSortAriaSort, getSortButtonLabel, getSortIndicator } = useTableSort(computed(() => props.items), columns)

</script>

<template>
  <PanelCard>
    <div class="panel-head"><h2>熱銷商品排行</h2></div>
    <MessageBlock v-if="!items.length" tone="empty">此期間沒有銷售商品</MessageBlock>
    <template v-else>
      <apexchart type="bar" height="320" :options="barOptions" :series="barSeries" />
      <div class="table-wrap">
        <table>
          <thead>
<tr>
              <th
                v-for="column in columns"
                :key="column.key"
                :class="column.align"
                :aria-sort="getSortAriaSort(column)"
              >
                <button
                  class="table-sort-button"
                  type="button"
                  :class="{ 'is-active': isSortActive(column), 'is-num': column.align === 'num' }"
                  :aria-label="getSortButtonLabel(column)"
                  @click="toggleSort(column)"
                >
                  <span>{{ column.label }}</span>
                  <span class="table-sort-icon" aria-hidden="true">{{ getSortIndicator(column) }}</span>
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in sortedItems" :key="item.productId">
              <td>{{ item.name || `#${item.productId}` }}</td>
              <td>{{ item.activityName || '—' }}</td>
              <td class="num">{{ formatNumber(item.qtySold) }}</td>
              <td class="num">{{ formatCurrency(item.revenue) }}</td>
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
