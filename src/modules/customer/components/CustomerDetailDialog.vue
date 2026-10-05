<script setup>
import IconButton from '@/shared/components/IconButton.vue'
import MessageBlock from '@/shared/components/MessageBlock.vue'
import { getCustomerDisplayName, getCustomerStatusLabel } from '@/modules/customer/utils/customerFilters'
import { getOrderStatusLabel } from '@/modules/order/utils/orderStatuses'

defineProps({
  detail: { type: Object, default: null },
  formatDateTime: { type: Function, required: true },
  formatCurrency: { type: Function, required: true },
})

defineEmits(['close', 'open-order'])
</script>

<template>
  <div class="modal-backdrop" @wheel.stop>
    <section class="customer-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="customer-detail-title">
      <div class="customer-detail-heading">
        <div class="customer-detail-title">
          <img class="customer-detail-avatar" :src="detail?.profile?.pictureUrl || '/cc-admin-mark.svg'" alt="" />
          <div>
            <p class="section-eyebrow">Customer #{{ detail?.profile?.id }}</p>
            <h2 id="customer-detail-title">{{ getCustomerDisplayName(detail?.profile) }}</h2>
            <span class="customer-status-badge" :class="{ 'is-deleted': detail?.profile?.isDelete }">
              {{ getCustomerStatusLabel(detail?.profile?.isDelete) }}
            </span>
          </div>
        </div>
        <IconButton variant="soft-close" aria-label="關閉" @click="$emit('close')">×</IconButton>
      </div>

      <div class="customer-detail-body">
      <dl class="customer-stat-grid">
        <div>
          <dt>訂單數</dt>
          <dd>{{ detail?.profile?.orderCount || 0 }}</dd>
        </div>
        <div>
          <dt>累計消費</dt>
          <dd>{{ formatCurrency(detail?.profile?.totalSpent) }}</dd>
        </div>
        <div>
          <dt>最近下單</dt>
          <dd>{{ formatDateTime(detail?.profile?.lastOrderedAt) }}</dd>
        </div>
        <div>
          <dt>加入時間</dt>
          <dd>{{ formatDateTime(detail?.profile?.createdAt) }}</dd>
        </div>
      </dl>

      <section>
        <h3>聯絡資料</h3>
        <p class="customer-line-note">這些資料由顧客自行維護，後台僅能停用或恢復帳號。</p>
        <dl class="customer-contact-grid">
          <div>
            <dt>LINE 顯示名稱</dt>
            <dd>{{ detail?.profile?.displayName || '—' }}</dd>
          </div>
          <div>
            <dt>姓名</dt>
            <dd>{{ detail?.profile?.name || '—' }}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{{ detail?.profile?.email || '—' }}</dd>
          </div>
          <div>
            <dt>電話</dt>
            <dd>{{ detail?.profile?.phone || '—' }}</dd>
          </div>
        </dl>
      </section>

      <section>
        <h3>常用地址</h3>
        <MessageBlock v-if="!(detail?.addresses || []).length" tone="empty" module="customers">目前沒有常用地址</MessageBlock>
        <ul v-else class="customer-address-list">
          <li v-for="address in detail.addresses" :key="address.id">
            <strong>{{ address.addressName || address.deliveryTypeName || '地址' }}</strong>
            <span>{{ address.address || '—' }}</span>
            <em v-if="address.isDefault">預設</em>
          </li>
        </ul>
      </section>

      <section>
        <h3>近期訂單</h3>
        <MessageBlock v-if="!(detail?.orders || []).length" tone="empty" module="customers">目前沒有訂單</MessageBlock>
        <div v-else class="customer-order-list">
          <button
            v-for="order in detail.orders"
            :key="order.id"
            class="customer-order-row"
            type="button"
            @click="$emit('open-order', order)"
          >
            <span>#{{ order.id }}</span>
            <strong>{{ order.activityName || '—' }}</strong>
            <span>{{ getOrderStatusLabel(order.orderStatus) }}</span>
            <b>{{ formatCurrency(order.grandTotal) }}</b>
          </button>
        </div>
      </section>
      </div>
    </section>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: grid;
  place-items: center;
  overflow: hidden;
  overscroll-behavior: contain;
  background: rgb(36 22 14 / 46%);
  padding: 24px;
}
.customer-detail-dialog {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  width: min(100%, 760px);
  height: min(80vh, calc(100vh - 48px));
  max-height: min(80vh, calc(100vh - 48px));
  overflow: hidden;
  gap: 20px;
  border: 1px solid #d2b496;
  border-radius: 18px;
  background: linear-gradient(135deg, rgb(255 255 255 / 96%), rgb(255 248 220 / 98%)), #ffffff;
  box-shadow: 0 26px 76px rgb(92 56 32 / 22%);
  padding: 28px;
}
.customer-detail-body {
  display: grid;
  align-content: start;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  gap: 22px;
  padding-right: 4px;
  scrollbar-gutter: stable;
}
.customer-detail-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}
.customer-detail-title {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 14px;
}
.customer-detail-avatar {
  width: 64px;
  height: 64px;
  border: 1px solid #d2b496;
  border-radius: 16px;
  object-fit: cover;
}
.customer-detail-title h2 {
  margin: 0 0 8px;
  color: #1f1b14;
  font-size: 1.45rem;
  line-height: 1.25;
}
.section-eyebrow {
  margin: 0 0 4px;
  color: #7a5640;
  font-size: 0.76rem;
  font-weight: 800;
  text-transform: uppercase;
}
.customer-status-badge {
  display: inline-flex;
  min-height: 28px;
  align-items: center;
  border: 1px solid #d2b496;
  border-radius: 999px;
  background: #f4e9dc;
  color: #3d2618;
  font-size: 0.82rem;
  font-weight: 850;
  padding: 0 10px;
}
.customer-status-badge.is-deleted {
  border-color: #e7c5c7;
  background: #fff4f4;
  color: #9d3e46;
}
.customer-stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
}
.customer-stat-grid div {
  border: 1px solid #d2b496;
  border-radius: 12px;
  background: #faf5ef;
  padding: 12px;
}
.customer-stat-grid dt {
  color: #7a5640;
  font-size: 0.8rem;
  font-weight: 800;
}
.customer-stat-grid dd {
  margin: 6px 0 0;
  color: #1f1b14;
  font-size: 1.05rem;
  font-weight: 900;
}
.customer-detail-dialog section {
  display: grid;
  gap: 12px;
}
.customer-detail-dialog h3 {
  margin: 0;
  color: #3d2618;
  font-size: 1.02rem;
}
.customer-line-note {
  margin: 0;
  color: #7a5640;
  font-size: 0.9rem;
}
.customer-contact-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
}
.customer-contact-grid div {
  border: 1px solid #d2b496;
  border-radius: 12px;
  background: #faf5ef;
  padding: 12px;
}
.customer-contact-grid dt {
  color: #7a5640;
  font-size: 0.8rem;
  font-weight: 800;
}
.customer-contact-grid dd {
  margin: 6px 0 0;
  color: #1f1b14;
  font-size: 1.02rem;
  font-weight: 800;
  overflow-wrap: anywhere;
}
.customer-address-list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.customer-address-list li {
  display: grid;
  gap: 4px;
  border: 1px solid #d2b496;
  border-radius: 12px;
  background: #faf5ef;
  padding: 12px 14px;
}
.customer-address-list strong {
  color: #1f1b14;
}
.customer-address-list span {
  color: #5a4030;
}
.customer-address-list em {
  color: #277867;
  font-style: normal;
  font-weight: 800;
}
.customer-order-list {
  display: grid;
  gap: 8px;
}
.customer-order-row {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 12px;
  border: 1px solid #d2b496;
  border-radius: 12px;
  background: #faf5ef;
  color: inherit;
  padding: 12px 14px;
  text-align: left;
}
.customer-order-row:hover {
  border-color: #5c3820;
  background: #f4e9dc;
}
.customer-order-row b {
  color: #1f1b14;
}
@media (max-width: 760px) {
  .customer-stat-grid,
  .customer-contact-grid,
  .customer-order-row {
    grid-template-columns: 1fr;
  }
}
</style>
