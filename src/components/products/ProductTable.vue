<script setup>
import { computed } from 'vue'
import MessageBlock from '@/components/ui/MessageBlock.vue'

const editIconPaths = [
  'M12 20h9',
  'M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z',
]
const copyIconPaths = [
  'M8 8h10v12H8z',
  'M6 16H4V4h10v2',
]

const getProductImages = (product) =>
  Array.isArray(product.images)
    ? product.images.filter((image) => image?.productImageUrl)
    : []

const getPrimaryProductImage = (product) => getProductImages(product)[0]?.productImageUrl || ''

const props = defineProps({
  products: {
    type: Array,
    required: true,
  },
  columns: {
    type: Array,
    required: true,
  },
  productTypes: {
    type: Array,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  loadingText: {
    type: String,
    default: '正在載入商品...',
  },
  emptyText: {
    type: String,
    default: '目前沒有商品。',
  },
  formatCurrency: {
    type: Function,
    required: true,
  },
  getCostTwd: {
    type: Function,
    required: true,
  },
  formatDateTime: {
    type: Function,
    required: true,
  },
  stripHtml: {
    type: Function,
    required: true,
  },
  sanitizeHtml: {
    type: Function,
    required: true,
  },
  isSortActive: {
    type: Function,
    required: true,
  },
  getSortAriaSort: {
    type: Function,
    required: true,
  },
  getSortButtonLabel: {
    type: Function,
    required: true,
  },
  getSortIndicator: {
    type: Function,
    required: true,
  },
  showStockActions: {
    type: Boolean,
    default: false,
  },
  showOrderedAmount: {
    type: Boolean,
    default: false,
  },
})

const hasActionsColumn = computed(() => props.columns.some((column) => column.key === 'actions'))
const tableColspan = computed(() => Math.max(props.columns.length, 1))

defineEmits(['sort', 'open-note', 'edit', 'copy', 'stock-in', 'stock-out', 'stock-history'])

const getProductTypeName = (productTypeId) => {
  const normalizedProductTypeId = Number(productTypeId)
  const productType = props.productTypes.find(
    (type) => Number(type?.id) === normalizedProductTypeId,
  )

  return productType?.name || (normalizedProductTypeId ? `#${normalizedProductTypeId}` : '-')
}
</script>

<template>
  <div class="product-table-wrap">
    <table class="product-table">
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
              @click="$emit('sort', column)"
            >
              <span>{{ column.label }}</span>
              <span class="table-sort-icon" aria-hidden="true">{{ getSortIndicator(column) }}</span>
            </button>
            <span v-else>{{ column.label }}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="isLoading">
          <MessageBlock as="td" :colspan="tableColspan" tone="empty">{{ loadingText }}</MessageBlock>
        </tr>
        <tr v-else-if="!products.length">
          <MessageBlock as="td" :colspan="tableColspan" tone="empty">{{ emptyText }}</MessageBlock>
        </tr>
        <template v-else>
          <tr v-for="product in products" :key="product.id">
            <td class="product-name">{{ product.name }}</td>
            <td>
              <div v-if="getPrimaryProductImage(product)" class="product-image-cell">
                <div class="product-thumb" aria-hidden="true">
                  <img :src="getPrimaryProductImage(product)" :alt="product.name || '商品圖片'" />
                </div>
                <span
                  v-if="getProductImages(product).length > 1"
                  class="product-image-count"
                >
                  +{{ getProductImages(product).length - 1 }}
                </span>
              </div>
              <span v-else class="no-product-image">未上傳</span>
            </td>
            <td>
              <span class="type-badge">{{ getProductTypeName(product.productTypeId) }}</span>
            </td>
            <td class="money-cell">{{ formatCurrency(getCostTwd(product), 'NT$') }}</td>
            <td class="money-cell">{{ formatCurrency(product.price, 'NT$') }}</td>
            <td>{{ product.amount.toLocaleString() }}</td>
            <td v-if="showOrderedAmount">{{ product.orderedAmount.toLocaleString() }}</td>
            <td>
              <span
                class="type-badge product-activity-kind-badge"
                :class="{ 'is-preorder': product.isPreOrder }"
              >
                {{ product.isPreOrder ? '預購' : '現貨' }}
              </span>
            </td>
            <td>
              <span class="type-badge product-stock-badge" :class="{ 'is-out': product.isOutStock }">
                {{ product.isOutStock ? '缺貨' : '尚有庫存' }}
              </span>
            </td>
            <td class="product-note-cell">
              <div
                class="product-note-preview"
                :class="{ 'is-empty': !stripHtml(product.info) }"
                role="button"
                :tabindex="stripHtml(product.info) ? 0 : -1"
                :aria-disabled="!stripHtml(product.info)"
                @click="$emit('open-note', product)"
                @keydown.enter.prevent="$emit('open-note', product)"
                @keydown.space.prevent="$emit('open-note', product)"
              >
                <div
                  v-if="stripHtml(product.info)"
                  class="product-note-preview-content"
                  v-html="sanitizeHtml(product.info)"
                ></div>
                <span v-else class="product-note-preview-content">-</span>
              </div>
            </td>
            <td>{{ formatDateTime(product.updateAt || product.createdAt) }}</td>
            <td v-if="hasActionsColumn">
              <div v-if="showStockActions" class="table-actions table-actions--stock">
                <button
                  class="table-action-button table-action-button--stock-in"
                  type="button"
                  @click="$emit('stock-in', product)"
                >
                  進貨
                </button>
                <button
                  class="table-action-button table-action-button--stock-out"
                  type="button"
                  @click="$emit('stock-out', product)"
                >
                  出貨
                </button>
                <button
                  class="table-action-button table-action-button--stock-history"
                  type="button"
                  @click="$emit('stock-history', product)"
                >
                  明細
                </button>
              </div>
              <div v-else class="table-actions">
                <button
                  class="table-action-button icon-action-button table-action-button--edit"
                  type="button"
                  :aria-label="`編輯${product.name || '商品'}`"
                  title="編輯商品"
                  @click="$emit('edit', product)"
                >
                  <svg class="table-button-svg" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      v-for="path in editIconPaths"
                      :key="path"
                      :d="path"
                    />
                  </svg>
                </button>
                <button
                  class="table-action-button icon-action-button table-action-button--copy"
                  type="button"
                  :aria-label="`複製${product.name || '商品'}`"
                  title="複製商品"
                  @click="$emit('copy', product)"
                >
                  <svg class="table-button-svg" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      v-for="path in copyIconPaths"
                      :key="path"
                      :d="path"
                    />
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
.product-table-wrap {
  position: relative;
  z-index: 1;
  width: 100%;
  overflow-x: auto;
  border: 1px solid #eaded2;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 80%);
}

.product-table {
  width: 100%;
  min-width: 1280px;
  border-collapse: separate;
  border-spacing: 0;
  background: #fffdf9;
}

.product-table th,
.product-table td {
  border-bottom: 1px solid #f0e7df;
  color: #384942;
  font-size: 0.92rem;
  line-height: 1.5;
  padding: 14px 16px;
  text-align: center;
  vertical-align: middle;
  white-space: nowrap;
}

.product-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  background:
    linear-gradient(135deg, rgb(247 252 249 / 98%), rgb(240 249 244 / 98%)),
    #f4fbf7;
  color: #4e443d;
  font-size: 0.84rem;
  font-weight: 900;
}

.product-table th:first-child,
.product-table td:first-child {
  padding-left: 20px;
}

.product-table th:last-child,
.product-table td:last-child {
  padding-right: 20px;
}

.product-table tbody tr:hover td {
  background: #fffaf4;
}

.product-table tbody tr:last-child td {
  border-bottom: 0;
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
  color: #1f6154;
}

.table-sort-icon {
  display: inline-grid;
  width: 16px;
  place-items: center;
  color: #9f6a45;
  font-size: 0.78rem;
  line-height: 1;
}

.table-sort-button.is-active .table-sort-icon {
  color: #1f6154;
}

.product-name {
  color: #13201c;
  font-weight: 850;
}

.money-cell {
  color: #13201c;
  font-weight: 900;
}

.product-note-cell {
  text-align: center;
  vertical-align: middle;
}

.product-image-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
}

.product-thumb {
  display: block;
  width: 104px;
  height: 70px;
  margin: 0 auto;
  overflow: hidden;
  border: 1px solid #eaded2;
  border-radius: 10px;
  background: #e8eee9;
  box-shadow: 0 10px 24px rgb(114 74 56 / 10%);
}

.product-thumb img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-image-count {
  display: inline-flex;
  min-width: 32px;
  min-height: 26px;
  align-items: center;
  justify-content: center;
  border: 1px solid #d9e5de;
  border-radius: 999px;
  background: #f2faf5;
  color: #1f6154;
  font-size: 0.8rem;
  font-weight: 900;
}

.no-product-image {
  color: #8a6c61;
  font-size: 0.86rem;
  font-weight: 750;
}

.type-badge {
  display: inline-flex;
  min-width: 54px;
  min-height: 30px;
  align-items: center;
  justify-content: center;
  border: 1px solid #bfd8cb;
  border-radius: 999px;
  background: #f0faf4;
  color: #22614c;
  font-size: 0.84rem;
  font-weight: 850;
  padding: 4px 10px;
}

.product-stock-badge {
  border-color: #bfd8cb;
  background: #f0faf4;
  color: #22614c;
}

.product-activity-kind-badge {
  border-color: #bfd8cb;
  background: #f0faf4;
  color: #22614c;
}

.product-activity-kind-badge.is-preorder {
  border-color: #9bc6b1;
  background: #e7f5ec;
  color: #1f6154;
}

.product-stock-badge.is-out {
  border-color: #f0c3c8;
  background: #fff1f2;
  color: #9d3e46;
}

.product-note-preview {
  display: grid;
  width: 180px;
  height: 64px;
  place-items: center;
  overflow: hidden;
  border: 1px solid #eaded2;
  border-radius: 12px;
  background: #fffdf9;
  color: #384942;
  cursor: pointer;
  font-size: 0.86rem;
  font-weight: 700;
  line-height: 1.45;
  margin: 0 auto;
  padding: 10px;
  text-align: left;
  white-space: normal;
}

.product-note-preview-content {
  display: block;
  width: 100%;
  max-width: 100%;
  max-height: 100%;
  overflow: hidden;
}

.product-note-preview-content :deep(p),
.product-note-preview-content :deep(div) {
  margin: 0 0 4px;
}

.product-note-preview-content :deep(ul),
.product-note-preview-content :deep(ol) {
  margin: 0;
  padding-left: 18px;
}

.product-note-preview-content :deep(li) {
  margin: 0;
}

.product-note-preview-content :deep(strong) {
  font-weight: 850;
}

.product-note-preview-content :deep(u) {
  text-decoration: underline;
}

.product-note-preview:hover:not(.is-empty) {
  border-color: #277867;
  background: #f0faf4;
  color: #1f6154;
}

.product-note-preview.is-empty {
  cursor: default;
  opacity: 0.75;
  text-align: center;
}

.table-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.table-actions--stock {
  gap: 8px;
}

.table-action-button {
  min-height: 34px;
  border: 1px solid #e8d8c8;
  border-radius: 999px;
  background: #fffdf9;
  color: #1f6154;
  font-size: 0.86rem;
  font-weight: 850;
  padding: 0 12px;
  white-space: nowrap;
}

.table-action-button:hover {
  border-color: #277867;
  box-shadow: 0 8px 18px rgb(39 120 103 / 10%);
}

.table-action-button:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.table-action-button--edit {
  border-color: #277867;
  background: #277867;
  color: #ffffff;
}

.table-action-button--edit:hover {
  border-color: #1f6154;
  background: #1f6154;
  box-shadow: 0 8px 18px rgb(39 120 103 / 16%);
  color: #ffffff;
}

.table-action-button--copy {
  border-color: #d8e6de;
  background: #f2faf5;
  color: #1f6154;
}

.table-action-button--copy:hover {
  border-color: #277867;
  background: #e7f5ec;
  color: #1f6154;
}

.table-action-button--stock-in {
  border-color: #277867;
  background: #277867;
  color: #ffffff;
}

.table-action-button--stock-out {
  border-color: #c48445;
  background: #fff7ee;
  color: #9a5b12;
}

.table-action-button--stock-history {
  border-color: #d8e6de;
  background: #f2faf5;
  color: #1f6154;
}

.table-action-button--stock-in:hover {
  border-color: #1f6154;
  background: #1f6154;
  color: #ffffff;
}

.table-action-button--stock-out:hover {
  border-color: #c48445;
  background: #fff1df;
  color: #824b0d;
}

.table-action-button--stock-history:hover {
  border-color: #277867;
  background: #e7f5ec;
  color: #1f6154;
}

.icon-action-button {
  display: grid;
  width: 40px;
  min-height: 40px;
  place-items: center;
  padding: 0;
}

.table-button-svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.9;
}

@media (max-width: 560px) {
  .product-table th,
  .product-table td {
    padding: 12px 14px;
  }
}
</style>
