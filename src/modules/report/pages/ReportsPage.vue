<script setup>
import { onMounted, ref } from 'vue'
import PageShell from '@/shared/components/PageShell.vue'
import PageHeading from '@/shared/components/PageHeading.vue'
import MessageBlock from '@/shared/components/MessageBlock.vue'
import ReportFilterBar from '@/modules/report/components/ReportFilterBar.vue'
import ReportKpiCards from '@/modules/report/components/ReportKpiCards.vue'
import RevenueTrendChart from '@/modules/report/components/RevenueTrendChart.vue'
import OrderBreakdownPanel from '@/modules/report/components/OrderBreakdownPanel.vue'
import ActivityPerformancePanel from '@/modules/report/components/ActivityPerformancePanel.vue'
import TopProductsPanel from '@/modules/report/components/TopProductsPanel.vue'
import InventoryHealthPanel from '@/modules/report/components/InventoryHealthPanel.vue'
import MarginPanel from '@/modules/report/components/MarginPanel.vue'
import { getDefaultPeriod } from '@/modules/report/utils/reportPeriods'
import {
  getActivityPerformance,
  getInventoryHealth,
  getMargins,
  getReportOverview,
  getTopProducts,
} from '@/modules/report/api/reportApi'

const period = ref(getDefaultPeriod())
const overview = ref(null)
const activities = ref([])
const topProducts = ref([])
const inventory = ref(null)
const margins = ref(null)
const errorMessage = ref('')

let requestToken = 0

const toIso = (date) => (date ? date.toISOString() : undefined)

const loadAll = async () => {
  const token = ++requestToken
  errorMessage.value = ''

  const range = { startDate: toIso(period.value.start), endDate: toIso(period.value.end) }

  try {
    const [ov, act, top, inv, mar] = await Promise.all([
      getReportOverview({ ...range, granularity: period.value.granularity }),
      getActivityPerformance(range),
      getTopProducts({ ...range, limit: 10 }),
      getInventoryHealth(),
      getMargins({ ...range, limit: 10 }),
    ])

    if (token !== requestToken) return

    overview.value = ov
    activities.value = act
    topProducts.value = top
    inventory.value = inv
    margins.value = mar
  } catch (err) {
    if (token !== requestToken) return
    errorMessage.value = err?.message || '報表資料載入失敗'
  }
}

const onPeriodChange = (next) => {
  period.value = next
  loadAll()
}

onMounted(loadAll)
</script>

<template>
  <PageShell>
    <PageHeading
      eyebrow="Analytics"
      title="報表分析"
      copy="營運數據總覽：營收、訂單、活動、商品、庫存與毛利。"
    />

    <ReportFilterBar :period="period" @change="onPeriodChange" />

    <MessageBlock v-if="errorMessage" tone="error">{{ errorMessage }}</MessageBlock>

    <ReportKpiCards :kpis="overview?.kpis" />
    <RevenueTrendChart :trend="overview?.revenueTrend || []" :granularity="period.granularity" />
    <OrderBreakdownPanel :overview="overview" />
    <ActivityPerformancePanel :items="activities" />
    <TopProductsPanel :items="topProducts" />
    <InventoryHealthPanel :data="inventory" />
    <MarginPanel :data="margins" />
  </PageShell>
</template>
