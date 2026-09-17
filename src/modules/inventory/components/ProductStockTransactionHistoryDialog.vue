<script setup>
import { computed } from 'vue'
import { useTableSort } from '@/shared/composables/useTableSort'
import AppButton from '@/shared/components/AppButton.vue'
import IconButton from '@/shared/components/IconButton.vue'
import MessageBlock from '@/shared/components/MessageBlock.vue'

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
  transactions: {
    type: Array,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: '',
  },
  formatDateTime: {
    type: Function,
    required: true,
  },
  formatCurrency: {
    type: Function,
    required: true,
  },
})

defineEmits(['close'])

const columns = [
  { key: 'createdAt', label: '時間', sortable: true, getValue: (row) => new Date(row.createdAt || 0) },
  { key: 'type', label: '類型', sortable: true, getValue: (row) => (row.inOrOut ? '進貨' : '出貨') },
  { key: 'amount', label: '數量', sortable: true, getValue: (row) => Number(row.amount || 0) },
  { key: 'unitCost', label: '單位成本', sortable: true, getValue: (row) => Number(row.unitCost || 0) },
  { key: 'unitPrice', label: '單位售價', sortable: true, getValue: (row) => Number(row.unitPrice || 0) },
  { key: 'admin', label: '管理員', sortable: true, getValue: (row) => Number(row.createAdminId || 0) },
]
const { sortedItems, isSortActive, toggleSort, getSortAriaSort, getSortButtonLabel, getSortIndicator } = useTableSort(computed(() => props.transactions), columns, { key: 'createdAt', direction: 'desc' })

</script>

<template>
  <div class="modal-backdrop">
    <section class="history-dialog" aria-label="庫存異動明細">
      <div class="dialog-heading">
        <div>
          <h2>庫存異動明細</h2>
          <p>{{ product.name || `#${product.id}` }}</p>
        </div>
        <IconButton variant="soft-close" aria-label="關閉" @click="$emit('close')">x</IconButton>
      </div>

      <MessageBlock v-if="errorMessage" tone="error">{{ errorMessage }}</MessageBlock>
      <MessageBlock v-else-if="isLoading" tone="empty">載入異動資料中...</MessageBlock>
      <MessageBlock v-else-if="!transactions.length" tone="empty">目前沒有進出貨資料。</MessageBlock>

      <div v-else class="history-table-wrap">
        <table class="history-table">
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
            <tr v-for="transaction in sortedItems" :key="transaction.id">
              <td>{{ formatDateTime(transaction.createdAt) }}</td>
              <td>
                <span class="type-badge" :class="{ 'is-out': !transaction.inOrOut }">
                  {{ transaction.inOrOut ? '進貨' : '出貨' }}
                </span>
              </td>
              <td>{{ Number(transaction.amount || 0).toLocaleString() }}</td>
              <td>{{ transaction.unitCost == null ? '-' : formatCurrency(transaction.unitCost) }}</td>
              <td>{{ transaction.unitPrice == null ? '-' : formatCurrency(transaction.unitPrice) }}</td>
              <td>#{{ transaction.createAdminId }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="dialog-actions">
        <AppButton pill @click="$emit('close')">關閉</AppButton>
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
  background: rgb(19 32 28 / 46%);
  padding: 24px;
}

.history-dialog {
  display: grid;
  width: min(100%, 880px);
  max-height: calc(100vh - 48px);
  gap: 20px;
  overflow: hidden;
  border: 1px solid #d8e6de;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 26px 76px rgb(39 120 103 / 18%);
  padding: 26px;
}

.dialog-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  border-bottom: 1px solid #e3eee8;
  padding-bottom: 16px;
}

.dialog-heading h2 {
  margin: 0;
  color: #13201c;
  font-size: 1.4rem;
}

.dialog-heading p {
  margin: 6px 0 0;
  color: #5e786f;
  font-weight: 700;
}

.history-table-wrap {
  overflow: auto;
  border: 1px solid #d8e6de;
  border-radius: 12px;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
}

.history-table th,
.history-table td {
  border-bottom: 1px solid #e3eee8;
  color: #384942;
  font-size: 0.9rem;
  padding: 12px;
  text-align: center;
  white-space: nowrap;
}

.history-table th {
  background: #f4fbf7;
  color: #4e443d;
  font-weight: 850;
}

.type-badge {
  display: inline-flex;
  border: 1px solid #bfd8cb;
  border-radius: 999px;
  background: #f0faf4;
  color: #22614c;
  font-weight: 800;
  padding: 3px 10px;
}

.type-badge.is-out {
  border-color: #9fc4b6;
  background: #e7f5ec;
  color: #1f6154;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
}

:deep(.form-field input),
:deep(.form-field select),
:deep(.form-field textarea) {
  border-color: #d8e6de;
  background: #f8fcfa;
}

:deep(.form-field input:focus),
:deep(.form-field select:focus),
:deep(.form-field textarea:focus) {
  border-color: #277867;
  box-shadow: 0 0 0 3px rgb(39 120 103 / 15%);
}

:deep(.icon-button) {
  border-color: #d8e6de;
  background: #f8fcfa;
  color: #1f6154;
}

:deep(.icon-button:hover:not(:disabled)) {
  border-color: #277867;
  color: #1f6154;
}

:deep(.app-button--primary) {
  background: #277867;
}

:deep(.app-button--primary:hover:not(:disabled)) {
  background: #1f6154;
}

:deep(.app-button--pill.app-button--ghost) {
  border-color: #d8e6de;
  background: #f8fcfa;
  color: #1f6154;
}

:deep(.app-button--pill.app-button--ghost:hover:not(:disabled)) {
  border-color: #277867;
  background: #f0faf4;
  color: #1f6154;
}

:deep(.rich-html-editor) {
  border-color: #d8e6de;
  background: #f8fcfa;
}

:deep(.rich-html-toolbar) {
  border-bottom-color: #e3eee8;
  background: #f4fbf7;
}

:deep(.rich-html-toolbar button) {
  border-color: #d8e6de;
  background: #ffffff;
  color: #1f6154;
}

:deep(.rich-html-toolbar button:hover) {
  border-color: #277867;
  color: #1f6154;
}

</style>
