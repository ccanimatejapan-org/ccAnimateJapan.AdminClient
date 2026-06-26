<script setup>
import { computed } from 'vue'
import { formatCurrency, formatNumber } from '@/utils/format'

const props = defineProps({
  kpis: {
    type: Object,
    default: null,
  },
})

const k = computed(() => props.kpis || {})

const primaryStats = computed(() => [
  { label: '總營收（不含取消）', value: formatCurrency(k.value.totalRevenue), accent: '#5468a6' },
  { label: '已收款', value: formatCurrency(k.value.collectedAmount), accent: '#277867' },
  { label: '待收款', value: formatCurrency(k.value.outstandingAmount), accent: '#c48445' },
  { label: '訂單數', value: formatNumber(k.value.orderCount), accent: '#7a5bb0' },
  { label: '平均客單價', value: formatCurrency(k.value.avgOrderValue), accent: '#b84d55' },
])

const pendingStats = computed(() => [
  { label: '待出貨', value: formatNumber(k.value.pendingToShip) },
  { label: '待付款', value: formatNumber(k.value.pendingUnpaid) },
  { label: '退款中', value: formatNumber(k.value.pendingRefunding) },
])
</script>

<template>
  <div class="kpi-wrap">
    <div class="kpi-grid">
      <div v-for="stat in primaryStats" :key="stat.label" class="kpi-card" :style="{ '--accent': stat.accent }">
        <span class="kpi-value">{{ stat.value }}</span>
        <span class="kpi-label">{{ stat.label }}</span>
      </div>
    </div>

    <div class="pending-row">
      <span class="pending-title">待處理</span>
      <span v-for="stat in pendingStats" :key="stat.label" class="pending-pill">
        {{ stat.label }} <strong>{{ stat.value }}</strong>
      </span>
    </div>
  </div>
</template>

<style scoped>
.kpi-wrap {
  display: grid;
  gap: 14px;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
}

.kpi-card {
  display: grid;
  gap: 8px;
  border: 1px solid #e3e8f3;
  border-left: 4px solid var(--accent, #5468a6);
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 12px 30px rgb(40 56 102 / 8%);
  padding: 16px 18px;
}

.kpi-value {
  color: #25324f;
  font-size: 1.5rem;
  font-weight: 800;
  line-height: 1.1;
}

.kpi-label {
  color: #6a7488;
  font-size: 0.84rem;
}

.pending-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.pending-title {
  color: #6a7488;
  font-size: 0.84rem;
  font-weight: 700;
}

.pending-pill {
  border: 1px solid #edcd9c;
  border-radius: 999px;
  background: #fff7eb;
  color: #955916;
  font-size: 0.86rem;
  padding: 6px 12px;
}

.pending-pill strong {
  font-weight: 900;
}

@media (max-width: 1100px) {
  .kpi-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 620px) {
  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
