<script setup>
import { ref } from 'vue'
import CustomSelect from '@/components/activities/CustomSelect.vue'
import AppButton from '@/components/ui/AppButton.vue'
import IconButton from '@/components/ui/IconButton.vue'
import MessageBlock from '@/components/ui/MessageBlock.vue'

const props = defineProps({
  form: {
    type: Object,
    required: true,
  },
  editingOrderId: {
    type: [Number, String],
    default: null,
  },
  products: {
    type: Array,
    required: true,
  },
  deliveryTypes: {
    type: Array,
    required: true,
  },
  orderStatusOptions: {
    type: Array,
    required: true,
  },
  paymentStatusOptions: {
    type: Array,
    required: true,
  },
  deliveryStatusOptions: {
    type: Array,
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
})

defineEmits(['close', 'submit', 'add-item', 'remove-item', 'delete'])

const openSelectKey = ref('')

const toggleSelect = (key) => {
  openSelectKey.value = openSelectKey.value === key ? '' : key
}

const selectOption = (field, value) => {
  props.form[field] = value === '' ? '' : Number(value)
  openSelectKey.value = ''
}

const selectItemProduct = (item, value) => {
  item.productId = value === '' ? '' : Number(value)
  openSelectKey.value = ''
}

const getDeliveryTypeLabel = () => {
  const deliveryTypeId = Number(props.form.deliveryTypeId)
  if (!deliveryTypeId) return '請選擇配送方式'

  const deliveryType = props.deliveryTypes.find(({ id }) => Number(id) === deliveryTypeId)
  return deliveryType?.name || `#${deliveryTypeId}`
}

const getStatusLabel = (field, options) => {
  const value = Number(props.form[field])
  const option = options.find((statusOption) => Number(statusOption.value) === value)
  return option?.label || '請選擇狀態'
}

const getProductLabel = (item) => {
  const productId = Number(item.productId)
  if (!productId) return '請選擇商品'

  const product = props.products.find((productItem) => Number(productItem.productId) === productId)
  if (!product) return `#${productId}`

  return `${product.name || `#${productId}`} - ${product.activityName || `活動 #${product.activityId}`}`
}
</script>

<template>
  <div class="modal-backdrop">
    <form class="order-dialog" novalidate @submit.prevent="$emit('submit')">
      <div class="dialog-heading">
        <div>
          <h2>{{ props.editingOrderId ? '編輯訂單' : '新增訂單' }}</h2>
        </div>
        <IconButton variant="soft-close" aria-label="關閉" @click="$emit('close')">×</IconButton>
      </div>

      <div class="order-form-grid">
        <label class="order-form-field">
          <span>訂購人</span>
          <input v-model="props.form.subscriberName" required />
        </label>

        <label class="order-form-field">
          <span>Email</span>
          <input v-model="props.form.subscriberEmail" required type="email" />
        </label>

        <label class="order-form-field">
          <span>電話</span>
          <input v-model="props.form.subscriberPhone" required />
        </label>

        <div class="form-field">
          <span class="field-label">配送方式</span>
          <CustomSelect
            tone="orders"
            :label="getDeliveryTypeLabel()"
            :open="openSelectKey === 'deliveryTypeId'"
            @toggle="toggleSelect('deliveryTypeId')"
          >
            <button class="custom-select-option" type="button" @click="selectOption('deliveryTypeId', '')">
              請選擇配送方式
            </button>
            <button
              v-for="deliveryType in props.deliveryTypes"
              :key="deliveryType.id"
              class="custom-select-option"
              type="button"
              @click="selectOption('deliveryTypeId', deliveryType.id)"
            >
              {{ deliveryType.name || `#${deliveryType.id}` }}
            </button>
          </CustomSelect>
        </div>

        <div v-if="props.editingOrderId" class="form-field">
          <span class="field-label">訂單狀態</span>
          <CustomSelect
            tone="orders"
            :label="getStatusLabel('orderStatus', props.orderStatusOptions)"
            :open="openSelectKey === 'orderStatus'"
            @toggle="toggleSelect('orderStatus')"
          >
            <button
              v-for="option in props.orderStatusOptions"
              :key="option.value"
              class="custom-select-option"
              type="button"
              @click="selectOption('orderStatus', option.value)"
            >
              {{ option.label }}
            </button>
          </CustomSelect>
        </div>

        <div v-if="props.editingOrderId" class="form-field">
          <span class="field-label">付款狀態</span>
          <CustomSelect
            tone="orders"
            :label="getStatusLabel('paymentStatus', props.paymentStatusOptions)"
            :open="openSelectKey === 'paymentStatus'"
            @toggle="toggleSelect('paymentStatus')"
          >
            <button
              v-for="option in props.paymentStatusOptions"
              :key="option.value"
              class="custom-select-option"
              type="button"
              @click="selectOption('paymentStatus', option.value)"
            >
              {{ option.label }}
            </button>
          </CustomSelect>
        </div>

        <div v-if="props.editingOrderId" class="form-field">
          <span class="field-label">物流狀態</span>
          <CustomSelect
            tone="orders"
            :label="getStatusLabel('deliveryStatus', props.deliveryStatusOptions)"
            :open="openSelectKey === 'deliveryStatus'"
            @toggle="toggleSelect('deliveryStatus')"
          >
            <button
              v-for="option in props.deliveryStatusOptions"
              :key="option.value"
              class="custom-select-option"
              type="button"
              @click="selectOption('deliveryStatus', option.value)"
            >
              {{ option.label }}
            </button>
          </CustomSelect>
        </div>

        <section class="order-items-section">
          <div class="order-items-heading">
            <h3>商品</h3>
            <AppButton type="button" pill @click="$emit('add-item')">新增商品</AppButton>
          </div>

          <div class="order-items">
            <div v-for="(item, index) in props.form.items" :key="index" class="order-item-row">
              <div class="form-field">
                <span class="field-label">商品</span>
                <CustomSelect
                  tone="orders"
                  :label="getProductLabel(item)"
                  :open="openSelectKey === `product-${index}`"
                  @toggle="toggleSelect(`product-${index}`)"
                >
                  <button class="custom-select-option" type="button" @click="selectItemProduct(item, '')">
                    請選擇商品
                  </button>
                  <button
                    v-for="product in props.products"
                    :key="product.productId"
                    class="custom-select-option"
                    type="button"
                    @click="selectItemProduct(item, product.productId)"
                  >
                    {{ product.name || `#${product.productId}` }} - {{ product.activityName || `活動 #${product.activityId}` }}
                  </button>
                </CustomSelect>
              </div>

              <label class="order-form-field order-form-field--item-info">
                <span>商品備註 / 關鍵字</span>
                <input v-model="item.info" maxlength="10" />
              </label>

              <label class="order-form-field order-form-field--quantity">
                <span>數量</span>
                <input v-model.number="item.amount" min="1" required type="number" />
              </label>

              <button
                class="remove-item-button"
                type="button"
                :disabled="props.form.items.length <= 1"
                @click="$emit('remove-item', index)"
              >
                刪除
              </button>
            </div>
          </div>
        </section>
      </div>

      <MessageBlock v-if="props.errorMessage">{{ props.errorMessage }}</MessageBlock>

      <div class="dialog-actions">
        <button
          v-if="props.editingOrderId"
          class="dialog-delete-button"
          type="button"
          :disabled="props.isSaving"
          @click="$emit('delete')"
        >
          刪除
        </button>

        <div class="dialog-actions-right">
          <AppButton pill :disabled="props.isSaving" @click="$emit('close')">取消</AppButton>
          <AppButton
            class="order-save-button"
            variant="primary"
            pill
            elevated
            type="submit"
            :disabled="props.isSaving"
          >
            {{ props.isSaving ? '儲存中...' : '儲存' }}
          </AppButton>
        </div>
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

.order-dialog {
  display: grid;
  align-content: start;
  grid-template-rows: auto minmax(0, 1fr) auto auto;
  width: min(100%, 760px);
  height: 80vh;
  max-height: 80vh;
  overflow: hidden;
  gap: 20px;
  border: 1px solid #eaded2;
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgb(255 255 255 / 96%), rgb(255 250 244 / 98%)),
    #ffffff;
  box-shadow: 0 26px 76px rgb(114 74 56 / 22%);
  padding: 28px;
}

.dialog-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  border-bottom: 1px solid #f0e5dc;
  padding-bottom: 16px;
}

.dialog-heading h2 {
  margin: 0;
  color: #13201c;
  font-size: 1.45rem;
  line-height: 1.25;
}

.order-form-grid {
  display: grid;
  align-content: start;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  min-height: 0;
  overflow: auto;
  padding-right: 4px;
  scrollbar-gutter: stable;
  gap: 16px;
}

.order-form-field,
.form-field {
  display: grid;
  align-content: start;
  gap: 8px;
  color: #59665f;
  font-size: 0.92rem;
  font-weight: 800;
}

.order-form-field > span,
.field-label {
  color: #59665f;
  line-height: 1.2;
  margin: 0;
}

.order-form-grid input {
  width: 100%;
  border: 1px solid #eaded2;
  border-radius: 10px;
  background: #fffdf9;
  color: #25352f;
  font: inherit;
  min-height: 46px;
  padding: 0 13px;
}

:deep(.custom-select-trigger) {
  min-height: 46px;
  border-radius: 10px;
  background: #fffdf9;
  color: #25352f;
  font: inherit;
}

.custom-select-option {
  width: 100%;
  font: inherit;
  cursor: pointer;
}

.order-items-section {
  display: grid;
  grid-column: 1 / -1;
  gap: 12px;
  border-top: 1px solid #f0e5dc;
  padding-top: 16px;
}

.order-items-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.order-items-heading h3 {
  margin: 0;
  color: #25352f;
  font-size: 1.05rem;
}

.order-items {
  display: grid;
  gap: 10px;
}

.order-item-row {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(150px, 180px) 120px auto;
  align-items: end;
  gap: 10px;
  border: 1px solid #eaded2;
  border-radius: 8px;
  background: #fffdf9;
  padding: 12px;
}

.order-form-field--quantity,
.order-form-field--item-info {
  min-width: 0;
}

.remove-item-button {
  align-self: end;
  min-height: 46px;
  border: 1px solid #d6dde3;
  border-radius: 8px;
  background: #eef1f3;
  color: #4b5563;
  font-weight: 800;
  padding: 0 12px;
}

.remove-item-button:hover:not(:disabled) {
  border-color: #b9c2ca;
  background: #e2e7ea;
  color: #374151;
}

.remove-item-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.dialog-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.dialog-actions-right {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.dialog-delete-button {
  min-height: 44px;
  margin-right: auto;
  border: 1px solid #d6dde3;
  border-radius: 999px;
  background: #eef1f3;
  color: #4b5563;
  font-size: 0.92rem;
  font-weight: 800;
  padding: 0 18px;
}

.dialog-delete-button:hover:not(:disabled) {
  border-color: #b9c2ca;
  background: #e2e7ea;
  color: #374151;
}

.dialog-delete-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

:deep(.order-save-button.app-button--primary) {
  background: #c48445;
  box-shadow: 0 10px 22px rgb(196 132 69 / 20%);
}

:deep(.order-save-button.app-button--primary:hover:not(:disabled)) {
  background: #a86b33;
}

@media (max-width: 640px) {
  .order-dialog {
    padding: 18px;
  }

  .order-form-grid,
  .order-item-row {
    grid-template-columns: 1fr;
  }

  .dialog-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .dialog-actions-right {
    display: grid;
    width: 100%;
  }

  .dialog-delete-button {
    width: 100%;
    margin-right: 0;
  }
}
</style>
