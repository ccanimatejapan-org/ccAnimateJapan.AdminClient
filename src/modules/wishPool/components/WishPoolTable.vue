<script setup>
import { computed } from 'vue'
import {
  getWishPoolDecisionBadgeClass,
  getWishPoolDecisionLabel,
  isSafeHttpUrl,
  WISH_POOL_DECISIONS,
} from '@/modules/wishPool/utils/wishPoolDecisions'
import { createWishPoolTableColumns } from '@/modules/wishPool/utils/wishPoolTableColumns'
import { useTableSort } from '@/shared/composables/useTableSort'

const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  updatingId: {
    type: [Number, String],
    default: null,
  },
  formatDateTime: {
    type: Function,
    required: true,
  },
})

const columns = createWishPoolTableColumns()
const {
  sortedItems,
  isSortActive,
  toggleSort,
  getSortAriaSort,
  getSortButtonLabel,
  getSortIndicator,
} = useTableSort(computed(() => props.items), columns, { key: 'createdAt', direction: 'desc' })

defineEmits(['update-decision'])

const decisions = [
  { value: WISH_POOL_DECISIONS.OPENED, label: '已開團' },
  { value: WISH_POOL_DECISIONS.NOT_OPENED, label: '不開團' },
]
</script>

<template>
  <div class="wp-table-wrap">
    <table class="wp-table">
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
          <td colspan="9" class="wp-table-empty">正在讀取許願資料...</td>
        </tr>
        <tr v-else-if="!items.length">
          <td colspan="9" class="wp-table-empty">目前沒有許願。</td>
        </tr>
        <template v-else>
          <tr v-for="item in sortedItems" :key="item.id">
            <td>{{ item.id }}</td>
            <td>{{ item.animateTypeName || '-' }}</td>
            <td class="wp-cell-name">{{ item.activityName || '-' }}</td>
            <td>
              <div v-if="item.productImageUrl" class="wp-thumb">
                <img :src="item.productImageUrl" :alt="item.activityName || '商品圖片'" />
              </div>
              <span v-else class="wp-no-image">未上傳</span>
            </td>
            <td>
              <a
                v-if="isSafeHttpUrl(item.productUrl)"
                class="wp-link"
                :href="item.productUrl"
                target="_blank"
                rel="noopener noreferrer"
              >
                開啟連結
              </a>
              <span v-else>-</span>
            </td>
            <td>{{ formatDateTime(item.createdAt) }}</td>
            <td class="wp-cell-reaction">{{ item.reactionCount ?? 0 }}</td>
            <td>
              <span class="wp-decision-badge" :class="getWishPoolDecisionBadgeClass(item.groupBuyDecision)">
                {{ getWishPoolDecisionLabel(item.groupBuyDecision) }}
              </span>
            </td>
            <td>
              <div class="wp-actions">
                <button
                  v-for="decision in decisions"
                  :key="decision.value"
                  class="wp-action-button"
                  :class="'wp-action-button--' + decision.value"
                  type="button"
                  :disabled="updatingId === item.id || item.groupBuyDecision === decision.value"
                  :aria-label="'將許願 ' + item.id + ' 設為' + decision.label"
                  @click="$emit('update-decision', item, decision.value)"
                >
                  {{ decision.label }}
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
/* ── Table wrap: same as ProductTable ── */
.wp-table-wrap {
  position: relative;
  z-index: 1;
  width: 100%;
  overflow-x: auto;
  border: 1px solid #c4d5de;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 80%);
}

.wp-table {
  width: 100%;
  min-width: 1120px;
  border-collapse: separate;
  border-spacing: 0;
  background: #fbfdfe;
}

/* ── Header & cells: mirrors ProductTable structure ── */
.wp-table th,
.wp-table td {
  border-bottom: 1px solid #dce8ef;
  color: #2a4f63;
  font-size: 0.92rem;
  line-height: 1.5;
  padding: 14px 16px;
  text-align: center;
  vertical-align: middle;
  white-space: nowrap;
}

.wp-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: linear-gradient(135deg, #eef6fa, #dceaf2);
  color: #2a5d78;
  font-size: 0.84rem;
  font-weight: 900;
}

.wp-table th:nth-child(even) {
  background: linear-gradient(135deg, #dceaf2, #cde0eb);
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

.wp-table th:first-child,
.wp-table td:first-child {
  padding-left: 20px;
}

.wp-table th:last-child,
.wp-table td:last-child {
  padding-right: 20px;
}

.wp-table tbody tr:hover td {
  background: #f4fafd;
}

.wp-table tbody tr:last-child td {
  border-bottom: 0;
}

.wp-table-empty {
  padding: 32px 16px;
  color: #5a8a9e;
  font-weight: 700;
  text-align: center;
}

/* ── Cells ── */
.wp-cell-name {
  color: #13201c;
  font-weight: 850;
  text-align: left;
}

.wp-cell-reaction {
  color: #1b4d66;
  font-weight: 900;
}

/* ── Thumbnail: same dimensions as ProductTable ── */
.wp-thumb {
  display: block;
  width: 104px;
  height: 70px;
  margin: 0 auto;
  overflow: hidden;
  border: 1px solid #c4d5de;
  border-radius: 10px;
  background: #e4f0f6;
  box-shadow: 0 10px 24px rgb(47 111 143 / 10%);
}

.wp-thumb img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.wp-no-image {
  color: #5a8a9e;
  font-size: 0.86rem;
  font-weight: 750;
}

/* ── Link ── */
.wp-link {
  color: #2f6f8f;
  font-weight: 850;
  text-decoration: underline;
}

.wp-link:hover {
  color: #1b4d66;
}

/* ── Decision badge: type-badge pattern ── */
.wp-decision-badge {
  display: inline-flex;
  min-width: 54px;
  min-height: 30px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  font-size: 0.84rem;
  font-weight: 850;
  padding: 4px 10px;
}

.wish-pool-badge--pending {
  border: 1px solid #b4ceda;
  background: #e4f0f6;
  color: #2a5d78;
}

.wish-pool-badge--opened {
  border: 1px solid #a3cbb8;
  background: #e8f5ee;
  color: #1d6048;
}

.wish-pool-badge--not-opened,
.wish-pool-badge--unknown {
  border: 1px solid #c4cdd4;
  background: #ecf0f3;
  color: #4b5e6b;
}

/* ── Action buttons: same structure as ProductTable stock actions ── */
.wp-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.wp-action-button {
  min-height: 34px;
  border: 1px solid #c4d5de;
  border-radius: 999px;
  background: #f6fafe;
  color: #2f6f8f;
  font-size: 0.86rem;
  font-weight: 850;
  padding: 0 12px;
  white-space: nowrap;
}

.wp-action-button--Opened {
  border-color: #2f8f6f;
  background: #2f8f6f;
  color: #ffffff;
}

.wp-action-button--Opened:hover:not(:disabled) {
  border-color: #257a5d;
  background: #257a5d;
  box-shadow: 0 8px 18px rgb(47 143 111 / 16%);
}

.wp-action-button--NotOpened {
  border-color: #c4d5de;
  background: #eef6fa;
  color: #4b6d80;
}

.wp-action-button--NotOpened:hover:not(:disabled) {
  border-color: #5a8a9e;
  background: #e4f0f6;
  color: #2a5d78;
}

.wp-action-button--Pending {
  border-color: #2f6f8f;
  background: #2f6f8f;
  color: #ffffff;
}

.wp-action-button--Pending:hover:not(:disabled) {
  border-color: #1b4d66;
  background: #1b4d66;
  box-shadow: 0 8px 18px rgb(47 111 143 / 16%);
}

.wp-action-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

@media (max-width: 560px) {
  .wp-table th,
  .wp-table td {
    padding: 12px 14px;
  }
}
</style>
