<script setup>
import ProductTable from '@/shared/components/ProductTable.vue'

defineProps({
  group: {
    type: Object,
    required: true,
  },
  panelId: {
    type: String,
    required: true,
  },
  collapsed: {
    type: Boolean,
    default: false,
  },
  columns: {
    type: Array,
    required: true,
  },
  productTypes: {
    type: Array,
    default: () => [],
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
})

defineEmits([
  'toggle',
  'sort',
  'open-note',
  'stock-in',
  'stock-out',
  'stock-history',
])
</script>

<template>
  <section class="inventory-activity-group">
    <button
      class="inventory-activity-group__toggle"
      type="button"
      :aria-expanded="!collapsed"
      :aria-controls="panelId"
      @click="$emit('toggle')"
    >
      <span
        class="inventory-activity-group__arrow"
        :class="{ 'is-collapsed': collapsed }"
        aria-hidden="true"
      >
        ⌄
      </span>
      <span class="inventory-activity-group__name">{{ group.activityName }}</span>
      <span class="inventory-activity-group__count">{{ group.count }} 筆</span>
    </button>

    <div
      v-show="!collapsed"
      :id="panelId"
      class="inventory-activity-group__panel"
    >
      <ProductTable
        :products="group.products"
        :columns="columns"
        :product-types="productTypes"
        :format-currency="formatCurrency"
        :get-cost-twd="getCostTwd"
        :format-date-time="formatDateTime"
        :strip-html="stripHtml"
        :sanitize-html="sanitizeHtml"
        :is-sort-active="isSortActive"
        :get-sort-aria-sort="getSortAriaSort"
        :get-sort-button-label="getSortButtonLabel"
        :get-sort-indicator="getSortIndicator"
        show-stock-actions
        show-ordered-amount
        @sort="$emit('sort', $event)"
        @open-note="$emit('open-note', $event)"
        @stock-in="$emit('stock-in', $event)"
        @stock-out="$emit('stock-out', $event)"
        @stock-history="$emit('stock-history', $event)"
      />
    </div>
  </section>
</template>

<style scoped lang="scss">
.inventory-activity-group {
  overflow: hidden;
  border: 1px solid #d8e6de;
  border-radius: 16px;
  background: #fffdf9;
  box-shadow: 0 12px 28px rgb(39 120 103 / 8%);
}

.inventory-activity-group__toggle {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 12px;
  border: 0;
  background: linear-gradient(135deg, #f7fcf9, #edf8f1);
  color: #13201c;
  cursor: pointer;
  font: inherit;
  padding: 14px 16px;
  text-align: left;
}

.inventory-activity-group__toggle:hover {
  background: linear-gradient(135deg, #eff9f3, #e5f4eb);
}

.inventory-activity-group__toggle:focus-visible {
  outline: 3px solid rgb(39 120 103 / 22%);
  outline-offset: -3px;
}

.inventory-activity-group__arrow {
  display: inline-grid;
  width: 28px;
  height: 28px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 999px;
  background: #277867;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 900;
  transition: transform 160ms ease;
}

.inventory-activity-group__arrow.is-collapsed {
  transform: rotate(-90deg);
}

.inventory-activity-group__name {
  flex: 1 1 auto;
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: 1rem;
  font-weight: 900;
}

.inventory-activity-group__count {
  flex: 0 0 auto;
  color: #5e786f;
  font-size: 0.86rem;
  font-weight: 850;
}

.inventory-activity-group__panel {
  padding: 14px;
}

@media (max-width: 720px) {
  .inventory-activity-group__toggle {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .inventory-activity-group__name {
    flex-basis: calc(100% - 40px);
  }

  .inventory-activity-group__count {
    margin-left: 40px;
  }

  .inventory-activity-group__panel {
    padding: 10px;
  }
}
</style>
