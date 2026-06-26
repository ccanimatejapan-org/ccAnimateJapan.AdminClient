<script setup>
import { computed } from 'vue'
import PanelCard from '@/components/layout/PanelCard.vue'
import MessageBlock from '@/components/ui/MessageBlock.vue'
import { formatCurrency, formatNumber, formatPercent } from '@/utils/format'

const props = defineProps({
  data: {
    type: Object,
    default: null,
  },
})

const d = computed(() => props.data || {})
const items = computed(() => d.value.byProduct || [])

const stats = computed(() => [
  { label: '銷售額', value: formatCurrency(d.value.revenue) },
  { label: '估算成本', value: formatCurrency(d.value.estimatedCost) },
  { label: '估算毛利', value: formatCurrency(d.value.grossMargin) },
  { label: '毛利率', value: formatPercent(d.value.marginRate) },
])
</script>

<template>
  <PanelCard>
    <div class="panel-head">
      <h2>毛利分析 <span class="hint">（成本以日幣成本 × 匯率估算）</span></h2>
    </div>

    <div class="mini-grid">
      <div v-for="stat in stats" :key="stat.label" class="mini">
        <span class="mini__value">{{ stat.value }}</span>
        <span class="mini__label">{{ stat.label }}</span>
      </div>
    </div>

    <div class="table-wrap">
      <p class="block-title">毛利商品明細</p>
      <MessageBlock v-if="!items.length" tone="empty">此期間沒有銷售資料</MessageBlock>
      <table v-else>
        <thead>
          <tr>
            <th>商品</th>
            <th>活動</th>
            <th class="num">數量</th>
            <th class="num">銷售額</th>
            <th class="num">估算成本</th>
            <th class="num">毛利</th>
            <th class="num">毛利率</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.productId">
            <td>{{ item.name || `#${item.productId}` }}</td>
            <td>{{ item.activityName || '—' }}</td>
            <td class="num">{{ formatNumber(item.qtySold) }}</td>
            <td class="num">{{ formatCurrency(item.revenue) }}</td>
            <td class="num">{{ formatCurrency(item.cost) }}</td>
            <td class="num" :class="{ negative: item.margin < 0 }">{{ formatCurrency(item.margin) }}</td>
            <td class="num" :class="{ negative: item.margin < 0 }">{{ formatPercent(item.marginRate) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
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

.hint {
  color: #8a93a6;
  font-size: 0.78rem;
  font-weight: 500;
}

.mini-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.mini {
  display: grid;
  gap: 6px;
  border: 1px solid #e7ebf2;
  border-radius: 10px;
  background: #fbfcfe;
  padding: 12px 14px;
}

.mini__value {
  color: #25324f;
  font-size: 1.25rem;
  font-weight: 800;
}

.mini__label {
  color: #6a7488;
  font-size: 0.8rem;
}

.block-title {
  margin: 18px 0 8px;
  color: #44506e;
  font-size: 0.9rem;
  font-weight: 700;
}

.table-wrap {
  overflow-x: auto;
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

.negative {
  color: #b23b3b;
}

@media (max-width: 620px) {
  .mini-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
