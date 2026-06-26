<script setup>
import { computed } from 'vue'
import PanelCard from '@/components/layout/PanelCard.vue'
import MessageBlock from '@/components/ui/MessageBlock.vue'
import { formatCurrency, formatNumber } from '@/utils/format'

const props = defineProps({
  data: {
    type: Object,
    default: null,
  },
})

const d = computed(() => props.data || {})
const items = computed(() => d.value.lowStockItems || [])

const stats = computed(() => [
  { label: '缺貨商品', value: formatNumber(d.value.outOfStockCount), tone: 'danger' },
  { label: '低庫存', value: formatNumber(d.value.lowStockCount), tone: 'warn' },
  { label: '預購未到貨', value: formatNumber(d.value.preorderPendingCount), tone: 'warn' },
  { label: '待出貨數量', value: formatNumber(d.value.toShipUnits), tone: 'info' },
  { label: '庫存估值', value: formatCurrency(d.value.inventoryValue), tone: 'info' },
])
</script>

<template>
  <PanelCard>
    <div class="panel-head"><h2>庫存健康度</h2></div>

    <div class="mini-grid">
      <div v-for="stat in stats" :key="stat.label" class="mini" :class="`mini--${stat.tone}`">
        <span class="mini__value">{{ stat.value }}</span>
        <span class="mini__label">{{ stat.label }}</span>
      </div>
    </div>

    <div class="table-wrap">
      <p class="block-title">缺貨 / 低庫存清單</p>
      <MessageBlock v-if="!items.length" tone="empty">沒有缺貨或低庫存商品</MessageBlock>
      <table v-else>
        <thead>
          <tr>
            <th>商品</th>
            <th>活動</th>
            <th class="num">庫存</th>
            <th class="num">待出貨</th>
            <th>狀態</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.productId">
            <td>{{ item.name || `#${item.productId}` }}</td>
            <td>{{ item.activityName || '—' }}</td>
            <td class="num">{{ formatNumber(item.stock) }}</td>
            <td class="num">{{ formatNumber(item.orderedAmount) }}</td>
            <td>
              <span class="badge" :class="item.isOutStock ? 'badge--danger' : 'badge--warn'">
                {{ item.isOutStock ? '缺貨' : '低庫存' }}
              </span>
            </td>
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

.mini-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
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

.mini--danger {
  border-color: #f0c4c4;
  background: #fff4f3;
}

.mini--warn {
  border-color: #efd6a6;
  background: #fff9ee;
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

.badge {
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 800;
  padding: 3px 10px;
}

.badge--danger {
  border: 1px solid #efbcbc;
  background: #fdeceb;
  color: #b23b3b;
}

.badge--warn {
  border: 1px solid #e7cf9b;
  background: #fff5e2;
  color: #976a18;
}

@media (max-width: 1100px) {
  .mini-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 620px) {
  .mini-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
