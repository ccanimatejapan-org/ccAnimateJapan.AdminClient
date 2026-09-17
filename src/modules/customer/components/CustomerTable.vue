<script setup>
import { computed } from 'vue'
import { getCustomerDisplayName, getCustomerStatusLabel } from '@/modules/customer/utils/customerFilters'
import { createCustomerTableColumns } from '@/modules/customer/utils/customerTableColumns'
import { useTableSort } from '@/shared/composables/useTableSort'

const props = defineProps({
  items: { type: Array, required: true },
  isLoading: { type: Boolean, default: false },
  mutatingId: { type: [Number, String], default: null },
  formatDateTime: { type: Function, required: true },
  formatCurrency: { type: Function, required: true },
})

defineEmits(['open', 'delete', 'restore'])

const columns = createCustomerTableColumns()
const {
  sortedItems,
  isSortActive,
  toggleSort,
  getSortAriaSort,
  getSortButtonLabel,
  getSortIndicator,
} = useTableSort(computed(() => props.items), columns, { key: 'lastOrderedAt', direction: 'desc' })

const viewIconPaths = [
  'M2.5 12s3.6-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.6 6.5-9.5 6.5S2.5 12 2.5 12Z',
  'M12 9a3 3 0 1 1 0 6a3 3 0 0 1 0-6Z',
]
const banIconPaths = [
  'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z',
  'M4.93 4.93 19.07 19.07',
]
</script>

<template>
  <div class="customer-table-wrap">
    <table class="customer-table">
      <thead>
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            :aria-sort="getSortAriaSort(column)"
          >
            <button
              v-if="column.sortable"
              class="table-sort-button"
              type="button"
              :class="{ 'is-active': isSortActive(column) }"
              :aria-label="getSortButtonLabel(column)"
              @click="toggleSort(column)"
            >
              <span>{{ column.label }}</span>
              <span class="table-sort-icon" aria-hidden="true">{{ getSortIndicator(column) }}</span>
            </button>
            <span v-else>{{ column.label }}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="isLoading && !items.length">
          <td colspan="8" class="customer-table-empty">正在讀取顧客資料...</td>
        </tr>
        <tr v-else-if="!items.length">
          <td colspan="8" class="customer-table-empty">目前沒有顧客。</td>
        </tr>
        <template v-else>
          <tr v-for="item in sortedItems" :key="item.id">
            <td class="customer-cell-profile">
              <div class="customer-profile">
                <img class="customer-avatar" :src="item.pictureUrl || '/cc-admin-mark.svg'" alt="" />
                <div class="customer-profile__text">
                  <strong>{{ getCustomerDisplayName(item) }}</strong>
                  <span v-if="item.name && item.name !== item.displayName">{{ item.name }}</span>
                </div>
              </div>
            </td>
            <td>{{ item.email || '—' }}</td>
            <td>{{ item.phone || '—' }}</td>
            <td class="customer-cell-number">{{ item.orderCount || 0 }}</td>
            <td class="customer-cell-money">{{ formatCurrency(item.totalSpent) }}</td>
            <td>{{ formatDateTime(item.lastOrderedAt) }}</td>
            <td>
              <span class="customer-status-badge" :class="{ 'is-deleted': item.isDelete }">
                {{ getCustomerStatusLabel(item.isDelete) }}
              </span>
            </td>
            <td>
              <div class="customer-actions">
                <button
                  class="customer-icon-button"
                  type="button"
                  :aria-label="`查看${getCustomerDisplayName(item)}`"
                  title="查看顧客"
                  @click="$emit('open', item.id)"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path v-for="d in viewIconPaths" :key="d" :d="d" />
                  </svg>
                </button>
                <button
                  v-if="item.isDelete"
                  class="customer-text-button"
                  type="button"
                  :disabled="mutatingId === item.id"
                  @click="$emit('restore', item)"
                >
                  恢復
                </button>
                <button
                  v-else
                  class="customer-icon-button customer-icon-button--danger"
                  type="button"
                  :aria-label="`停用${getCustomerDisplayName(item)}`"
                  title="停用顧客"
                  :disabled="mutatingId === item.id"
                  @click="$emit('delete', item)"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path v-for="d in banIconPaths" :key="d" :d="d" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.customer-table-wrap {
  position: relative;
  z-index: 1;
  width: 100%;
  overflow-x: auto;
  border: 1px solid #d2b496;
  border-radius: 14px;
  background: #ffffff;
}
.customer-table {
  width: 100%;
  min-width: 1080px;
  border-collapse: separate;
  border-spacing: 0;
  background: #faf5ef;
}
.customer-table th,
.customer-table td {
  border-bottom: 1px solid #e4d2bc;
  color: #5a4030;
  font-size: 0.92rem;
  line-height: 1.5;
  padding: 14px 16px;
  text-align: center;
  vertical-align: middle;
  white-space: nowrap;
}
.customer-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: linear-gradient(135deg, #f4e9dc, #eadccb);
  color: #3d2618;
  font-size: 0.84rem;
  font-weight: 900;
}
.customer-table th:nth-child(even) {
  background: linear-gradient(135deg, #eadccb, #e2d0bc);
}
.table-sort-button {
  display: inline-flex;
  width: 100%;
  min-height: 32px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  font-weight: inherit;
  padding: 0;
  white-space: nowrap;
}
.table-sort-button:hover,
.table-sort-button.is-active {
  color: #111111;
}
.table-sort-button.is-active {
  font-weight: 900;
}
.table-sort-icon {
  display: inline-grid;
  width: 16px;
  place-items: center;
  font-size: 0.78rem;
  line-height: 1;
}
.table-sort-button.is-active .table-sort-icon {
  color: #111111;
}
.customer-table tbody tr:hover td {
  background: #f4e9dc;
}
.customer-table tbody tr:last-child td {
  border-bottom: 0;
}
.customer-table-empty {
  padding: 32px 16px;
  color: #7a5640;
  font-weight: 700;
}
.customer-cell-profile {
  text-align: left;
}
.customer-profile {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
}
.customer-avatar {
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  border: 1px solid #d2b496;
  border-radius: 12px;
  background: #f4e9dc;
  object-fit: cover;
}
.customer-profile__text {
  display: grid;
  min-width: 0;
  gap: 2px;
  text-align: left;
}
.customer-profile__text strong {
  color: #1f1b14;
  font-weight: 850;
}
.customer-profile__text span {
  color: #7a5640;
  font-size: 0.82rem;
}
.customer-cell-number,
.customer-cell-money {
  color: #1f1b14;
  font-weight: 900;
}
.customer-status-badge {
  display: inline-flex;
  min-width: 54px;
  min-height: 30px;
  align-items: center;
  justify-content: center;
  border: 1px solid #d2b496;
  border-radius: 999px;
  background: #f4e9dc;
  color: #3d2618;
  font-size: 0.84rem;
  font-weight: 850;
  padding: 4px 10px;
}
.customer-status-badge.is-deleted {
  border-color: #e7c5c7;
  background: #fff4f4;
  color: #9d3e46;
}
.customer-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.customer-icon-button {
  display: grid;
  width: 40px;
  min-height: 40px;
  place-items: center;
  border: 1px solid #d2b496;
  border-radius: 999px;
  background: #faf5ef;
  color: #432818;
  padding: 0;
}
.customer-icon-button svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.9;
}
.customer-icon-button:hover:not(:disabled) {
  border-color: #432818;
  color: #3d2618;
}
.customer-icon-button--danger {
  border-color: #e7c5c7;
  background: #fff4f4;
  color: #9d3e46;
}
.customer-icon-button--danger:hover:not(:disabled) {
  border-color: #b84d55;
  background: #fff0f0;
  color: #9d3e46;
}
.customer-icon-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}
.customer-text-button {
  min-height: 34px;
  border: 1px solid #d2b496;
  border-radius: 999px;
  background: #f4e9dc;
  color: #3d2618;
  font-size: 0.86rem;
  font-weight: 850;
  padding: 0 12px;
}
.customer-text-button--danger {
  border-color: #e7c5c7;
  background: #fff4f4;
  color: #9d3e46;
}
.customer-text-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}
</style>
