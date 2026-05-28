<script setup>
import { computed, ref } from 'vue'
import CustomSelect from '@/components/activities/CustomSelect.vue'
import RichHtmlEditor from '@/components/common/RichHtmlEditor.vue'
import AppButton from '@/components/ui/AppButton.vue'
import FormField from '@/components/ui/FormField.vue'
import IconButton from '@/components/ui/IconButton.vue'
import MessageBlock from '@/components/ui/MessageBlock.vue'
import ProductImagePicker from './ProductImagePicker.vue'

const props = defineProps({
  form: {
    type: Object,
    required: true,
  },
  editingProductId: {
    type: [Number, String],
    default: null,
  },
  isSaving: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: '',
  },
  productTypeErrorMessage: {
    type: String,
    default: '',
  },
  productTypes: {
    type: Array,
    default: () => [],
  },
  isLoadingProductTypes: {
    type: Boolean,
    default: false,
  },
  canSubmit: {
    type: Boolean,
    default: true,
  },
  productImages: {
    type: Array,
    default: () => [],
  },
  remainingImageSlots: {
    type: Number,
    default: 5,
  },
  imageLimit: {
    type: Number,
    default: 5,
  },
  isSpotActivity: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['close', 'submit', 'image-change', 'remove-existing-image', 'remove-new-image'])

const isProductTypeSelectOpen = ref(false)

const productTypeSelectLabel = computed(() => {
  if (props.isLoadingProductTypes) return '載入商品類型中...'

  const selectedProductType = props.productTypes.find(
    (productType) => Number(productType.id) === Number(props.form.productTypeId),
  )

  return selectedProductType?.name || (props.productTypes.length ? '請選擇商品類型' : '目前沒有商品類型')
})

const toggleProductTypeSelect = () => {
  if (props.isLoadingProductTypes || !props.productTypes.length) return

  isProductTypeSelectOpen.value = !isProductTypeSelectOpen.value
}

const selectProductType = (productTypeId) => {
  props.form.productTypeId = Number(productTypeId)
  isProductTypeSelectOpen.value = false
}
</script>

<template>
  <div class="modal-backdrop">
    <form class="product-dialog" novalidate @submit.prevent="$emit('submit')">
      <div class="dialog-heading">
        <div>
          <h2>{{ editingProductId ? '編輯商品' : '新增商品' }}</h2>
        </div>
        <IconButton variant="soft-close" aria-label="關閉" @click="$emit('close')">×</IconButton>
      </div>

      <div class="product-form-grid">
        <FormField label="商品名稱" full soft>
          <input v-model="form.name" required placeholder="商品名稱" />
        </FormField>
        <FormField label="成本(日)" soft>
          <input v-model.number="form.japanCost" min="0" type="number" required />
        </FormField>
        <FormField label="成本匯率" soft>
          <input v-model.number="form.rate" min="0" step="0.0001" type="number" required />
        </FormField>
        <FormField label="售價匯率" soft>
          <input v-model.number="form.saleRate" min="0" step="0.0001" type="number" required />
        </FormField>
        <FormField label="售價(台)" soft>
          <input v-model.number="form.price" min="0" type="number" required readonly />
        </FormField>
        <FormField as="div" label="商品類型">
          <CustomSelect
            tone="product"
            :label="productTypeSelectLabel"
            :open="isProductTypeSelectOpen"
            :disabled="isLoadingProductTypes || !productTypes.length"
            @toggle="toggleProductTypeSelect"
          >
            <button
              v-for="productType in productTypes"
              :key="productType.id"
              class="custom-select-option"
              type="button"
              @click="selectProductType(productType.id)"
            >
              {{ productType.name }}
            </button>
          </CustomSelect>
        </FormField>
        <FormField v-if="isSpotActivity" label="商品數量" soft>
          <input
            v-model.number="form.amount"
            min="0"
            step="1"
            type="number"
            :readonly="Boolean(editingProductId)"
          />
          <small v-if="editingProductId" class="stock-help">庫存數量請於庫存管理進行異動。</small>
        </FormField>
        <FormField as="div" label="商品圖片（最多 5 張）" full soft>
          <ProductImagePicker
            :images="productImages"
            :remaining-slots="remainingImageSlots"
            :limit="imageLimit"
            :product-name="form.name"
            @change="$emit('image-change', $event)"
            @remove-existing="$emit('remove-existing-image', $event)"
            @remove-new="$emit('remove-new-image', $event)"
          />
        </FormField>
        <FormField as="div" label="商品說明" full soft>
          <RichHtmlEditor v-model="form.info" placeholder="商品說明" />
        </FormField>
      </div>

      <MessageBlock v-if="productTypeErrorMessage">{{ productTypeErrorMessage }}</MessageBlock>
      <MessageBlock v-if="errorMessage">{{ errorMessage }}</MessageBlock>

      <div class="dialog-actions">
        <AppButton pill :disabled="isSaving" @click="$emit('close')">取消</AppButton>
        <AppButton variant="primary" pill elevated type="submit" :disabled="isSaving || !canSubmit">
          {{ isSaving ? '儲存中...' : '儲存' }}
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

.product-dialog {
  display: grid;
  align-content: start;
  grid-template-rows: auto minmax(0, 1fr) auto auto;
  width: min(100%, 760px);
  height: 80vh;
  max-height: 80vh;
  overflow: hidden;
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
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  border-bottom: 1px solid #dce9e1;
  padding-bottom: 16px;
}

.dialog-heading h2 {
  margin: 0;
  color: #13201c;
  font-size: 1.45rem;
  line-height: 1.25;
}

.eyebrow {
  margin: 0 0 4px;
  color: #5e786f;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

.product-form-grid {
  display: grid;
  align-content: start;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  min-height: 0;
  overflow: auto;
  padding-right: 4px;
  scrollbar-gutter: stable;
  gap: 16px;
}

.product-form-grid input[readonly] {
  cursor: default;
  color: #4e443d;
}

.stock-help {
  color: #5e786f;
  font-size: 0.78rem;
  font-weight: 650;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.form-field--soft input),
:deep(.form-field--soft select),
:deep(.form-field--soft textarea) {
  border-color: #d8e6de;
  background: #f8fcfa;
}

:deep(.form-field input:focus),
:deep(.form-field select:focus),
:deep(.form-field textarea:focus) {
  border-color: #277867;
  box-shadow: 0 0 0 3px rgb(39 120 103 / 15%);
}

.dialog-actions :deep(.app-button--primary) {
  background: #277867;
  box-shadow: 0 10px 22px rgb(39 120 103 / 20%);
}

.dialog-actions :deep(.app-button--primary:hover:not(:disabled)) {
  background: #1f6154;
}

@media (max-width: 560px) {
  .product-dialog {
    padding: 18px;
  }

  .product-form-grid {
    grid-template-columns: 1fr;
    padding-right: 2px;
  }

  .dialog-actions {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
