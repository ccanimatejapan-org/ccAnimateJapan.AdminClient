<script setup>
import AppButton from '@/shared/components/AppButton.vue'
import IconButton from '@/shared/components/IconButton.vue'
import MessageBlock from '@/shared/components/MessageBlock.vue'

defineProps({
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
              <th>時間</th>
              <th>類型</th>
              <th>數量</th>
              <th>單位成本</th>
              <th>單位售價</th>
              <th>管理員</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="transaction in transactions" :key="transaction.id">
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
  border-color: #f3c98b;
  background: #fff7ee;
  color: #9a5b12;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
}
</style>
