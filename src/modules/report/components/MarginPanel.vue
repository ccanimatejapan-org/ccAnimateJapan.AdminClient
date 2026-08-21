<script setup>
import { computed } from 'vue'
import PanelCard from '@/shared/components/PanelCard.vue'
import MessageBlock from '@/shared/components/MessageBlock.vue'
import { formatCurrency, formatNumber, formatPercent } from '@/shared/utils/format'
import { buildProfitReport } from '@/modules/report/utils/profitReport'

const props = defineProps({
  data: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const report = computed(() => buildProfitReport(props.data))

const formatRate = (rate, operatingRevenue) => (operatingRevenue > 0 ? formatPercent(rate) : '—')
const formatStatValue = (stat) =>
  stat.type === 'percent'
    ? formatRate(stat.value, report.value.totals.operatingRevenue)
    : formatCurrency(stat.value)
</script>

<template>
  <PanelCard>
    <div class="panel-head">
      <h2>損益分析 <span class="hint">（已收款合格訂單口徑）</span></h2>
    </div>

    <MessageBlock v-if="loading" tone="empty">損益資料載入中</MessageBlock>
    <MessageBlock v-else-if="!data || !report.items.length" tone="empty">
      此期間沒有符合損益口徑的訂單資料
    </MessageBlock>

    <template v-else>
      <div class="mini-grid">
        <div
          v-for="stat in report.stats"
          :key="stat.key"
          class="mini"
          :class="stat.profitState?.tone"
        >
          <span class="mini__value">{{ formatStatValue(stat) }}</span>
          <span class="mini__label">{{ stat.label }}</span>
          <span v-if="stat.profitState" class="mini__meta">{{ stat.profitState.label }}</span>
        </div>
      </div>

      <div class="split-grid">
        <section class="breakdown-card">
          <h3 class="block-title">營收拆解</h3>
          <dl class="breakdown-list">
            <div v-for="item in report.revenueBreakdown" :key="item.key" class="breakdown-row">
              <dt>{{ item.label }}</dt>
              <dd>{{ formatCurrency(item.amount) }}</dd>
            </div>
          </dl>
        </section>

        <section class="breakdown-card">
          <h3 class="block-title">成本拆解</h3>
          <dl class="breakdown-list">
            <div v-for="item in report.costBreakdown" :key="item.key" class="breakdown-row">
              <dt>{{ item.label }}</dt>
              <dd>{{ formatCurrency(item.amount) }}</dd>
            </div>
          </dl>
        </section>
      </div>

      <div class="notes">
        <p v-for="note in report.notes" :key="note">{{ note }}</p>
      </div>

      <div
        class="table-wrap"
        tabindex="0"
        role="region"
        aria-label="商品損益明細（依淨利排序，最多 10 筆）"
      >
        <h3 class="block-title">商品損益明細（依淨利排序，最多 10 筆）</h3>
        <table>
          <thead>
            <tr>
              <th>商品</th>
              <th>活動</th>
              <th class="num">數量</th>
              <th class="num">營業額</th>
              <th class="num">商品營收</th>
              <th class="num">已收補運費</th>
              <th class="num">商品成本</th>
              <th class="num">分攤活動運費</th>
              <th class="num">總成本</th>
              <th class="num">淨利</th>
              <th class="num">淨利率</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in report.items" :key="item.productId">
              <td>{{ item.name || `#${item.productId}` }}</td>
              <td>{{ item.activityName || '—' }}</td>
              <td class="num">{{ formatNumber(item.qtySold) }}</td>
              <td class="num">{{ formatCurrency(item.operatingRevenue) }}</td>
              <td class="num">{{ formatCurrency(item.productRevenue) }}</td>
              <td class="num">{{ formatCurrency(item.paidShippingRevenue) }}</td>
              <td class="num">{{ formatCurrency(item.productCost) }}</td>
              <td class="num">{{ formatCurrency(item.activityShippingCost) }}</td>
              <td class="num">{{ formatCurrency(item.totalCost) }}</td>
              <td class="num profit-cell" :class="item.profitState.tone">
                <span class="profit-state">{{ item.profitState.label }}</span>
                <span>{{ formatCurrency(item.netProfit) }}</span>
              </td>
              <td class="num profit-cell" :class="item.profitState.tone">
                <span class="profit-state">{{ item.profitState.label }}</span>
                <span>{{ formatRate(item.netProfitRate, item.operatingRevenue) }}</span>
              </td>
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

.mini__meta {
  color: #6a7488;
  font-size: 0.78rem;
  font-weight: 700;
}

.mini.negative .mini__value,
.mini.negative .mini__meta {
  color: #b23b3b;
}

.mini.positive .mini__meta {
  color: #277867;
}

.split-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.breakdown-card {
  border: 1px solid #e7ebf2;
  border-radius: 10px;
  background: #fbfcfe;
  padding: 12px 14px;
}

.block-title {
  margin: 0 0 8px;
  color: #44506e;
  font-size: 0.9rem;
  font-weight: 700;
}

.breakdown-list {
  display: grid;
  gap: 10px;
  margin: 0;
}

.breakdown-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.breakdown-row dt {
  color: #6a7488;
}

.breakdown-row dd {
  margin: 0;
  color: #25324f;
  font-weight: 700;
}

.notes {
  display: grid;
  gap: 6px;
  margin-top: 16px;
  color: #5a667f;
  font-size: 0.82rem;
}

.notes p {
  margin: 0;
}

.table-wrap {
  overflow-x: auto;
  margin-top: 16px;
}

.table-wrap:focus-visible {
  outline: 2px solid #5468a6;
  outline-offset: 3px;
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

.profit-cell {
  display: grid;
  gap: 2px;
  justify-items: end;
}

.profit-state {
  font-size: 0.76rem;
  font-weight: 700;
}

.profit-cell.negative {
  color: #b23b3b;
}

.profit-cell.positive {
  color: #277867;
}

.profit-cell.neutral {
  color: #6a7488;
}

@media (max-width: 900px) {
  .mini-grid,
  .split-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 620px) {
  .mini-grid,
  .split-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
