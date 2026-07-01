<script setup>
import { computed, ref } from 'vue'
import CustomSelect from '@/shared/components/CustomSelect.vue'
import AppButton from '@/shared/components/AppButton.vue'
import FormField from '@/shared/components/FormField.vue'
import IconButton from '@/shared/components/IconButton.vue'
import MessageBlock from '@/shared/components/MessageBlock.vue'

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
  inOrOut: {
    type: Boolean,
    required: true,
  },
  form: {
    type: Object,
    required: true,
  },
  isSaving: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: '',
  },
  orders: {
    type: Array,
    default: () => [],
  },
  isLoadingOrders: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close', 'submit', 'select-order'])

const actionText = props.inOrOut ? '進貨' : '出貨'
const isOrderSelectOpen = ref(false)
const selectedOrderLabel = computed(() => {
  if (props.isLoadingOrders) return '載入訂單中...'

  const selectedOrder = props.orders.find((order) => Number(order.id) === Number(props.form.orderId))
  return selectedOrder
    ? `#${selectedOrder.id} ${selectedOrder.subscriberName || '-'}（${selectedOrder.amount} 件）`
    : '請選擇訂單'
})

const toggleOrderSelect = () => {
  if (props.isLoadingOrders) return
  isOrderSelectOpen.value = !isOrderSelectOpen.value
}

const selectOrder = (orderId) => {
  props.form.orderId = orderId ? Number(orderId) : ''
  isOrderSelectOpen.value = false
  emit('select-order')
}

</script>

<template>
  <div class="modal-backdrop">
    <form class="stock-dialog" novalidate @submit.prevent="$emit('submit')">
      <div class="dialog-heading">
        <h2>{{ actionText }}庫存</h2>
        <IconButton variant="soft-close" aria-label="關閉" @click="$emit('close')">x</IconButton>
      </div>

      <div class="stock-form-grid">
        <FormField label="商品名稱" soft>
          <input :value="product.name || `#${product.id}`" readonly />
        </FormField>

        <FormField v-if="!inOrOut" label="出貨訂單" soft>
          <CustomSelect
            tone="inventory"
            :label="selectedOrderLabel"
            :open="isOrderSelectOpen"
            :disabled="isLoadingOrders"
            @toggle="toggleOrderSelect"
          >
            <button class="custom-select-option" type="button" @click="selectOrder('')">請選擇訂單</button>
            <button
              v-for="order in orders"
              :key="order.id"
              class="custom-select-option"
              type="button"
              @click="selectOrder(order.id)"
            >
              #{{ order.id }} {{ order.subscriberName || '-' }}（{{ order.amount }} 件）
            </button>
          </CustomSelect>
        </FormField>

        <FormField label="數量" soft>
          <input v-model.number="form.amount" :readonly="!inOrOut" min="1" required step="1" type="number" />
        </FormField>

        <FormField v-if="inOrOut" label="單位成本（台幣）" soft>
          <input v-model.number="form.unitCost" min="0" readonly required step="1" type="number" />
        </FormField>

        <FormField v-else label="單位售價（台幣）" soft>
          <input v-model.number="form.unitPrice" min="0" readonly required step="1" type="number" />
        </FormField>
      </div>

      <MessageBlock v-if="errorMessage">{{ errorMessage }}</MessageBlock>

      <div class="dialog-actions">
        <AppButton pill :disabled="isSaving" @click="$emit('close')">取消</AppButton>
        <AppButton variant="primary" pill elevated type="submit" :disabled="isSaving">
          {{ isSaving ? '儲存中...' : `確認${actionText}` }}
        </AppButton>
      </div>
    </form>
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

.stock-dialog {
  display: grid;
  width: min(100%, 480px);
  gap: 20px;
  border: 1px solid #d8e6de;
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgb(255 255 255 / 96%), rgb(243 249 246 / 98%)),
    #ffffff;
  box-shadow: 0 26px 76px rgb(39 120 103 / 18%);
  padding: 28px;
}

.dialog-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  border-bottom: 1px solid #e3eee8;
  padding-bottom: 16px;
}

.dialog-heading h2 {
  margin: 0;
  color: #13201c;
  font-size: 1.45rem;
}

.stock-form-grid {
  display: grid;
  gap: 16px;
}

:deep(.custom-select-trigger) {
  border-color: #d8e6de;
  background: #f8fcfa;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.app-button--primary) {
  background: #277867;
}

:deep(.app-button--primary:hover:not(:disabled)) {
  background: #1f6154;
}

@media (max-width: 560px) {
  .stock-dialog {
    padding: 18px;
  }

  .dialog-actions {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
