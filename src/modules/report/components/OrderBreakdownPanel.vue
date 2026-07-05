<script setup>
import { computed } from 'vue'
import apexchart from 'vue3-apexcharts'
import PanelCard from '@/shared/components/PanelCard.vue'
import MessageBlock from '@/shared/components/MessageBlock.vue'
import ReportDonut from '@/modules/report/components/ReportDonut.vue'
import {
  getDeliveryStatusLabel,
  getOrderStatusLabel,
  getPaymentStatusLabel,
} from '@/modules/order/utils/orderStatuses'

const props = defineProps({
  overview: {
    type: Object,
    default: null,
  },
})

const orderItems = computed(() => props.overview?.orderStatusBreakdown || [])
const paymentItems = computed(() => props.overview?.paymentStatusBreakdown || [])
const deliveryItems = computed(() => props.overview?.deliveryStatusBreakdown || [])
const deliveryTypeItems = computed(() => props.overview?.deliveryTypeBreakdown || [])

const hasOrderData = computed(() => orderItems.value.some((item) => Number(item.count) > 0))

const orderBarSeries = computed(() => [
  { name: '訂單數', data: orderItems.value.map((item) => Number(item.count || 0)) },
])

const orderBarOptions = computed(() => ({
  chart: { toolbar: { show: false }, fontFamily: 'inherit' },
  colors: ['#5468a6'],
  plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '62%' } },
  dataLabels: { enabled: true },
  xaxis: { categories: orderItems.value.map((item) => getOrderStatusLabel(item.code)) },
  grid: { borderColor: '#eef1f6' },
  tooltip: { y: { formatter: (value) => `${value} 筆` } },
}))

const paymentLabels = computed(() => paymentItems.value.map((item) => getPaymentStatusLabel(item.code)))
const paymentSeries = computed(() => paymentItems.value.map((item) => Number(item.count || 0)))

const deliveryLabels = computed(() => deliveryItems.value.map((item) => getDeliveryStatusLabel(item.code)))
const deliverySeries = computed(() => deliveryItems.value.map((item) => Number(item.count || 0)))

const deliveryTypeLabels = computed(() =>
  deliveryTypeItems.value.map((item) => item.label || `配送 #${item.code}`),
)
const deliveryTypeSeries = computed(() => deliveryTypeItems.value.map((item) => Number(item.count || 0)))
</script>

<template>
  <PanelCard>
    <div class="panel-head">
      <h2>訂單狀態與配送分佈</h2>
    </div>

    <MessageBlock v-if="!hasOrderData" tone="empty">此期間沒有訂單資料</MessageBlock>

    <template v-else>
      <div class="order-bar">
        <p class="block-title">訂單狀態分佈</p>
        <apexchart type="bar" height="280" :options="orderBarOptions" :series="orderBarSeries" />
      </div>

      <div class="donut-grid">
        <ReportDonut title="付款狀態" :labels="paymentLabels" :series="paymentSeries" />
        <ReportDonut title="配送狀態" :labels="deliveryLabels" :series="deliverySeries" />
        <ReportDonut title="配送方式" :labels="deliveryTypeLabels" :series="deliveryTypeSeries" />
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

.block-title {
  margin: 0 0 4px;
  color: #44506e;
  font-size: 0.9rem;
  font-weight: 700;
}

.donut-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: 18px;
}

@media (max-width: 860px) {
  .donut-grid {
    grid-template-columns: 1fr;
  }
}
</style>
