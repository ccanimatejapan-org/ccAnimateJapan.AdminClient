<script setup>
defineProps({
  activities: {
    type: Array,
    required: true,
  },
  columns: {
    type: Array,
    required: true,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  copyingActivityId: {
    type: [Number, String],
    default: null,
  },
  editIconPaths: {
    type: Array,
    required: true,
  },
  copyIconPaths: {
    type: Array,
    required: true,
  },
  formLinkIconPaths: {
    type: Array,
    required: true,
  },
  productIconPaths: {
    type: Array,
    required: true,
  },
  getActivityTypeName: {
    type: Function,
    required: true,
  },
  getAnimateTypeName: {
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
})

defineEmits(['sort', 'open-note', 'edit', 'copy', 'copy-form-link', 'manage-products'])

const getStatusBadgeClass = (status) => {
  const normalizedStatus = Number(status)

  if (normalizedStatus === 0) return 'status-badge--not-started'
  if (normalizedStatus === 1 || normalizedStatus === 3) return 'status-badge--active'
  if (normalizedStatus === 2 || normalizedStatus === 4) return 'status-badge--ended'

  return 'status-badge--not-started'
}

const getPreOrderBadgeClass = (activity) =>
  activity.isPreOrder ? 'preorder-badge--preorder' : 'preorder-badge--open'
</script>

<template>
  <div class="activity-table-wrap">
    <table class="activity-table">
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
        <tr v-if="!activities.length">
          <td :colspan="columns.length">{{ isLoading ? '正在讀取活動資料...' : '目前尚無活動資料。' }}</td>
        </tr>
        <template v-else>
          <tr v-for="activity in activities" :key="activity.id">
            <td>
              <span class="type-badge status-badge" :class="getStatusBadgeClass(activity.status)">
                {{ activity.statusText }}
              </span>
            </td>
            <td>
              <div class="date-stack">
                <span>{{ activity.activityStartDate || '-' }}</span>
                <span>~</span>
                <span>{{ activity.activityEndDate || '-' }}</span>
              </div>
            </td>
            <td class="activity-name">{{ activity.name || '-' }}</td>
            <td>
              <img class="activity-thumb" :src="activity.image" :alt="activity.name || '活動圖片'" />
            </td>
            <td>{{ activity.address || '-' }}</td>
            <td>
              <span class="type-badge preorder-badge" :class="getPreOrderBadgeClass(activity)">
                {{ activity.preOrderText }}
              </span>
            </td>
            <td>
              <span class="type-badge">{{ getActivityTypeName(activity.activityTypeId) }}</span>
            </td>
            <td>
              <span class="type-badge">{{ getAnimateTypeName(activity.animateTypeId) }}</span>
            </td>
            <td>
              <div class="date-stack">
                <span>{{ activity.prepStartDate || '-' }}</span>
                <span>~</span>
                <span>{{ activity.prepEndDate || '-' }}</span>
              </div>
            </td>
            <td class="activity-note-cell">
              <div
                class="activity-note-preview"
                :class="{ 'is-empty': !stripHtml(activity.info) }"
                role="button"
                :tabindex="stripHtml(activity.info) ? 0 : -1"
                :aria-disabled="!stripHtml(activity.info)"
                @click="$emit('open-note', activity)"
                @keydown.enter.prevent="$emit('open-note', activity)"
                @keydown.space.prevent="$emit('open-note', activity)"
              >
                <div
                  v-if="stripHtml(activity.info)"
                  class="activity-note-preview-content"
                  v-html="sanitizeHtml(activity.info)"
                ></div>
                <span v-else class="activity-note-preview-content">-</span>
              </div>
            </td>
            <td>
              <div class="table-actions">
                <button
                  class="table-action-button icon-action-button table-action-button--edit"
                  type="button"
                  :aria-label="`編輯${activity.name || '活動'}`"
                  title="編輯活動"
                  @click="$emit('edit', activity)"
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
                  :aria-label="`複製${activity.name || '活動'}`"
                  :disabled="copyingActivityId !== null"
                  title="複製活動"
                  @click="$emit('copy', activity)"
                >
                  <svg class="table-button-svg" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      v-for="path in copyIconPaths"
                      :key="path"
                      :d="path"
                    />
                  </svg>
                </button>
                <button
                  class="table-action-button icon-action-button table-action-button--form-link"
                  type="button"
                  :aria-label="`複製${activity.name || '活動'}前台表單連結`"
                  title="複製前台表單連結"
                  @click="$emit('copy-form-link', activity)"
                >
                  <svg class="table-button-svg" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      v-for="path in formLinkIconPaths"
                      :key="path"
                      :d="path"
                    />
                  </svg>
                </button>
                <button
                  class="table-action-button icon-action-button table-action-button--products"
                  type="button"
                  :aria-label="`管理${activity.name || '活動'}商品`"
                  title="商品管理"
                  @click="$emit('manage-products', activity)"
                >
                  <svg class="table-button-svg" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      v-for="path in productIconPaths"
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
.activity-table-wrap {
  position: relative;
  z-index: 1;
  width: 100%;
  overflow-x: auto;
  border: 1px solid #eaded2;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 80%);
}

.activity-table {
  width: 100%;
  min-width: 1700px;
  border-collapse: separate;
  border-spacing: 0;
  background: #fffdf9;
}

.activity-table th,
.activity-table td {
  border-bottom: 1px solid #f0e7df;
  color: #384942;
  font-size: 0.92rem;
  line-height: 1.5;
  padding: 14px 16px;
  text-align: center;
  vertical-align: middle;
  white-space: nowrap;
}

.activity-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  background:
    linear-gradient(135deg, rgb(255 250 244 / 98%), rgb(255 245 236 / 98%)),
    #fff8f0;
  color: #4e443d;
  font-size: 0.84rem;
  font-weight: 900;
}

.activity-table th:first-child,
.activity-table td:first-child {
  padding-left: 20px;
}

.activity-table th:last-child,
.activity-table td:last-child {
  padding-right: 20px;
}

.activity-table tbody tr:hover td {
  background: #fffaf4;
}

.activity-table tbody tr:last-child td {
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

.activity-thumb {
  display: block;
  width: 104px;
  height: 70px;
  margin: 0 auto;
  border: 1px solid #eaded2;
  border-radius: 10px;
  background: #e8eee9;
  box-shadow: 0 10px 24px rgb(114 74 56 / 10%);
  object-fit: cover;
}

.activity-name {
  color: #13201c;
  font-weight: 850;
}

.date-stack {
  display: grid;
  justify-items: center;
  gap: 5px;
  color: #25352f;
  font-weight: 750;
  text-align: center;
}

.date-stack span + span {
  color: #59665f;
  font-weight: 650;
}

.type-badge {
  display: inline-flex;
  min-width: 54px;
  min-height: 30px;
  align-items: center;
  justify-content: center;
  border: 1px solid #e8d8c8;
  border-radius: 999px;
  background: #fff8f0;
  color: #7d4d2f;
  font-size: 0.84rem;
  font-weight: 850;
  padding: 4px 10px;
}

.status-badge {
  font-weight: 900;
}

.status-badge--not-started {
  border-color: #d6dde3;
  background: #eef1f3;
  color: #4b5563;
}

.status-badge--active {
  border-color: #bfd8cb;
  background: #f0faf4;
  color: #22614c;
}

.status-badge--ended {
  border-color: #e7c5c7;
  background: #fff4f4;
  color: #9d3e46;
}

.preorder-badge {
  font-weight: 900;
}

.preorder-badge--open {
  border-color: #f3c98b;
  background: #fff7e8;
  color: #9a5b12;
}

.preorder-badge--preorder {
  border-color: #b9c7f2;
  background: #f3f6ff;
  color: #334c9f;
}

.activity-note-cell {
  text-align: center;
  vertical-align: middle;
}

.activity-note-preview {
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

.activity-note-preview-content {
  display: block;
  width: 100%;
  max-width: 100%;
  max-height: 100%;
  overflow: hidden;
}

.activity-note-preview-content :deep(p),
.activity-note-preview-content :deep(div) {
  margin: 0 0 4px;
}

.activity-note-preview-content :deep(ul),
.activity-note-preview-content :deep(ol) {
  margin: 0;
  padding-left: 18px;
}

.activity-note-preview-content :deep(li) {
  margin: 0;
}

.activity-note-preview-content :deep(strong) {
  font-weight: 850;
}

.activity-note-preview-content :deep(u) {
  text-decoration: underline;
}

.activity-note-preview:hover:not(.is-empty) {
  border-color: #b84d55;
  background: #fff8f0;
  color: #7d4d2f;
}

.activity-note-preview.is-empty {
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
  border-color: #b84d55;
  background: #b84d55;
  color: #ffffff;
}

.table-action-button--edit:hover {
  border-color: #9d3e46;
  background: #9d3e46;
  box-shadow: 0 8px 18px rgb(184 77 85 / 16%);
  color: #ffffff;
}

.table-action-button--copy {
  border-color: #9f6a45;
  background: #9f6a45;
  color: #ffffff;
}

.table-action-button--copy:hover:not(:disabled) {
  border-color: #7d4d2f;
  background: #7d4d2f;
  box-shadow: 0 8px 18px rgb(159 106 69 / 16%);
  color: #ffffff;
}

.table-action-button--form-link {
  border-color: #cf3f49;
  background: #cf3f49;
  color: #ffffff;
}

.table-action-button--form-link:hover {
  border-color: #a8323b;
  background: #a8323b;
  box-shadow: 0 8px 18px rgb(207 63 73 / 16%);
  color: #ffffff;
}

.table-action-button--products {
  border-color: #277867;
  background: #277867;
  color: #ffffff;
}

.table-action-button--products:hover {
  border-color: #1f6154;
  background: #1f6154;
  box-shadow: 0 8px 18px rgb(39 120 103 / 18%);
  color: #ffffff;
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
  .activity-table th,
  .activity-table td {
    padding: 12px 14px;
  }
}
</style>
