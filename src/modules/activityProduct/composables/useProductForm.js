import { computed, reactive, ref } from 'vue'
import {
  copyActivityProduct,
  createActivityProduct,
  updateActivityProduct,
} from '@/modules/activityProduct/api/activityProductApi'
import { useMultiImageUpload } from '@/shared/composables/useMultiImageUpload'
import { appendIfValue } from '@/shared/utils/formData'
import {
  formatRequiredFieldsMessage,
  hasPositiveNumberValue,
  isBlankValue,
} from '@/shared/utils/validation'
import { mapProductFromApi, toNumber } from '@/modules/activityProduct/utils/productMapper'
import {
  buildProductPayload,
  createEmptyProductForm,
  getSaleRateFromProduct,
} from '@/modules/activityProduct/utils/productForm'
import { getAdminToken } from '@/shared/stores/authSession'

const PRODUCT_IMAGE_LIMIT = 5
const PRODUCT_IMAGE_MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_PRODUCT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

// Product create/edit form: owns the reactive form + the multi-image upload, validates
// (incl. the spot-activity integer-stock rule), builds the multipart payload, and saves /
// copies (updating the shared products list in place). Activity context, product types,
// rate defaults and status/error messages are injected from the page.
export const useProductForm = ({
  activityId,
  activityName,
  selectedActivity,
  isSpotActivity,
  isPreOrderActivity,
  productTypes,
  isLoadingProductTypes,
  activityRateDefaults,
  products,
  statusMessage,
  errorMessage,
}) => {
  const emptyForm = createEmptyProductForm()
  const form = reactive(createEmptyProductForm())
  const editingProductId = ref(null)
  const isDialogOpen = ref(false)
  const isSaving = ref(false)
  const copyingProductId = ref(null)

  const imageUpload = useMultiImageUpload({
    limit: PRODUCT_IMAGE_LIMIT,
    maxBytes: PRODUCT_IMAGE_MAX_BYTES,
    allowedTypes: ALLOWED_PRODUCT_IMAGE_TYPES,
    getExistingImageName: () => form.name || '商品圖片',
    onError: (message) => {
      errorMessage.value = message
    },
  })

  const getNormalizedRateValue = (value, fallback) => {
    const numberValue = Number(value)
    return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : fallback
  }

  const getDefaultProductTypeId = () => productTypes.value[0]?.id || emptyForm.productTypeId

  const hasSelectedProductType = computed(() =>
    productTypes.value.some((productType) => productType.id === toNumber(form.productTypeId)),
  )

  const canSaveProduct = computed(() => !isLoadingProductTypes.value && hasSelectedProductType.value)

  const validateProductForm = () => {
    const missingFields = []

    if (isBlankValue(form.name)) missingFields.push('商品名稱')
    if (!hasPositiveNumberValue(form.japanCost)) missingFields.push('日本成本')
    if (!hasPositiveNumberValue(form.rate)) missingFields.push('成本匯率')
    if (!hasPositiveNumberValue(form.saleRate)) missingFields.push('售價匯率')
    if (!hasPositiveNumberValue(form.price)) missingFields.push('售價')
    if (!hasSelectedProductType.value) missingFields.push('商品類型')
    if (imageUpload.imageItems.value.length === 0) missingFields.push('商品圖片')

    if (missingFields.length) {
      errorMessage.value = formatRequiredFieldsMessage(missingFields)
      return false
    }

    if (!editingProductId.value && isSpotActivity.value) {
      const amount = Number(form.amount)
      if (!Number.isInteger(amount) || amount < 0) {
        errorMessage.value = '現貨商品數量必須是大於或等於 0 的整數。'
        return false
      }
    }

    return true
  }

  const buildProductFormData = (productId = null) => {
    const formData = new FormData()
    const payload = buildProductPayload(form, {
      isPreOrderActivity: isPreOrderActivity.value,
      isSpotActivity: isSpotActivity.value,
      isEditing: Boolean(editingProductId.value),
    })

    appendIfValue(formData, 'id', productId)
    Object.entries(payload).forEach(([key, value]) => {
      appendIfValue(formData, key, value)
    })
    imageUpload.appendTo(formData)

    return formData
  }

  const resetForm = () => {
    imageUpload.reset()
    Object.assign(form, {
      ...emptyForm,
      rate: getNormalizedRateValue(activityRateDefaults.rate, emptyForm.rate),
      saleRate: getNormalizedRateValue(activityRateDefaults.saleRate, emptyForm.saleRate),
      productTypeId: getDefaultProductTypeId(),
    })
    editingProductId.value = null
  }

  const openCreateDialog = () => {
    resetForm()
    statusMessage.value = ''
    errorMessage.value = ''
    isDialogOpen.value = true
  }

  const openEditDialog = (product) => {
    resetForm()
    editingProductId.value = product.id
    imageUpload.existingImages.value = product.images || []
    Object.assign(form, {
      name: product.name,
      japanCost: product.japanCost,
      rate: product.rate,
      saleRate: getSaleRateFromProduct(product),
      price: product.price,
      amount: product.amount,
      isOutStock: product.isOutStock === true,
      productTypeId: product.productTypeId || getDefaultProductTypeId(),
      info: product.info || '',
    })
    statusMessage.value = ''
    errorMessage.value = ''
    isDialogOpen.value = true
  }

  const closeDialog = () => {
    isDialogOpen.value = false
    resetForm()
  }

  const saveProduct = async () => {
    if (!validateProductForm()) {
      return
    }

    if (!getAdminToken()) {
      errorMessage.value = '登入狀態已失效，請重新登入後再儲存商品。'
      return
    }

    if (!hasSelectedProductType.value) {
      errorMessage.value = '請先選擇有效的商品類型。'
      return
    }

    isSaving.value = true
    errorMessage.value = ''
    statusMessage.value = ''

    try {
      const payload = buildProductFormData(editingProductId.value)
      const response = editingProductId.value
        ? await updateActivityProduct(activityId.value, payload)
        : await createActivityProduct(activityId.value, payload)
      const savedProduct = {
        ...mapProductFromApi(response?.data, activityId.value),
        activityName: activityName.value,
        isPreOrder: selectedActivity.value?.isPreOrder === true,
      }

      if (editingProductId.value) {
        products.value = products.value.map((product) =>
          product.id === editingProductId.value ? savedProduct : product,
        )
        statusMessage.value = '編輯商品成功。'
      } else {
        products.value.unshift(savedProduct)
        statusMessage.value = '新增商品成功。'
      }

      closeDialog()
    } catch (err) {
      errorMessage.value = err.message || '儲存商品失敗。'
    } finally {
      isSaving.value = false
    }
  }

  const copyProduct = async (product) => {
    if (copyingProductId.value) return

    if (!activityId.value || !product?.id) {
      errorMessage.value = '商品資料無效，無法複製商品。'
      return
    }

    if (!getAdminToken()) {
      errorMessage.value = '登入狀態已失效，請重新登入後再複製商品。'
      return
    }

    copyingProductId.value = product.id
    errorMessage.value = ''
    statusMessage.value = ''

    try {
      const response = await copyActivityProduct(activityId.value, product.id)
      const copiedProduct = {
        ...mapProductFromApi(response?.data, activityId.value),
        activityName: activityName.value,
        isPreOrder: selectedActivity.value?.isPreOrder === true,
      }

      products.value.unshift(copiedProduct)
      statusMessage.value = '複製商品成功。'
    } catch (err) {
      errorMessage.value = err.message || '複製商品失敗。'
    } finally {
      copyingProductId.value = null
    }
  }

  return {
    form,
    editingProductId,
    isDialogOpen,
    isSaving,
    copyingProductId,
    hasSelectedProductType,
    canSaveProduct,
    imageUpload,
    getDefaultProductTypeId,
    resetForm,
    openCreateDialog,
    openEditDialog,
    closeDialog,
    saveProduct,
    copyProduct,
  }
}
