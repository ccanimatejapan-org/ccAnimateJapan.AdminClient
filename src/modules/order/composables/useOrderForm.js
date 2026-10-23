import { computed, ref } from 'vue'
import { createOrder, getOrderDetail, updateOrder } from '@/modules/order/api/orderApi'
import {
  buildCreateOrderPayload,
  buildUpdateOrderPayload,
  createEmptyOrderForm,
  createEmptyOrderItem,
  validateOrderForm,
} from '@/modules/order/utils/orderForm'

export const useOrderForm = ({
  selectedActivityId,
  selectedActivityReadOnly,
  deliveryTypes,
  products,
  selectedOrder,
  errorMessage,
  isLoadingDetail,
  loadProducts = async () => {},
  refreshAfterChange,
}) => {
  const orderForm = ref(createEmptyOrderForm())
  const editingOrderId = ref(null)
  const isOrderDialogOpen = ref(false)
  const formErrorMessage = ref('')
  const isSavingOrder = ref(false)

  const formProductOptions = computed(() => {
    const optionsById = new Map(
      products.value.map((product) => [Number(product.productId), product]),
    )

    ;(selectedOrder.value?.items || []).forEach((item) => {
      const productId = Number(item.productId)
      if (!optionsById.has(productId)) {
        optionsById.set(productId, {
          productId,
          name: item.name,
          price: item.price,
          amount: item.amount,
        })
      }
    })

    return Array.from(optionsById.values())
  })

  const openCreateOrder = () => {
    if (!selectedActivityId.value) {
      errorMessage.value = '請先選擇活動'
      return
    }

    if (selectedActivityReadOnly.value) {
      errorMessage.value = '此活動非進行中，無法新增訂單'
      return
    }

    editingOrderId.value = null
    selectedOrder.value = null
    orderForm.value = createEmptyOrderForm()
    orderForm.value.deliveryTypeId = deliveryTypes.value[0]?.id || ''
    formErrorMessage.value = ''
    isOrderDialogOpen.value = true
  }

  const openEditOrder = async (order) => {
    isLoadingDetail.value = true
    formErrorMessage.value = ''
    errorMessage.value = ''

    try {
      // 商品選項只有編輯視窗要用，所以在打開視窗時才取（與訂單明細同時發出，視窗顯示時已備妥）。
      const [detail] = await Promise.all([getOrderDetail(order.id), loadProducts()])
      selectedOrder.value = detail
      editingOrderId.value = detail.id
      orderForm.value = {
        subscriberName: detail.subscriberName || '',
        subscriberEmail: detail.subscriberEmail || '',
        subscriberBank: detail.subscriberBank || '',
        deliveryTypeId: detail.deliveryType?.id || '',
        orderStatus: detail.orderStatus || 1,
        paymentStatus: detail.paymentStatus || 1,
        shippingFee: detail.shippingFee || 0,
        shippingPaymentStatus: detail.shippingPaymentStatus || 0,
        items: (detail.items || []).map((item) => ({
          productId: item.productId,
          amount: item.amount,
          info: String(item.info || '').slice(0, 10),
        })),
      }
      if (orderForm.value.items.length === 0) {
        orderForm.value.items = [createEmptyOrderItem()]
      }
      isOrderDialogOpen.value = true
    } catch (err) {
      errorMessage.value = err?.message || '訂單明細載入失敗'
    } finally {
      isLoadingDetail.value = false
    }
  }

  const closeOrderDialog = () => {
    isOrderDialogOpen.value = false
    formErrorMessage.value = ''
  }

  const addOrderItem = () => {
    orderForm.value.items.push(createEmptyOrderItem())
  }

  const removeOrderItem = (index) => {
    if (orderForm.value.items.length <= 1) return
    orderForm.value.items.splice(index, 1)
  }

  // 儲存成功後立刻重整（refreshAfterChange 由頁面傳入：活動列表、商品、訂單、明細與未處理計數）；
  // 重整期間 isSavingOrder 維持 true，儲存按鈕不會被重複觸發。
  const submitOrderForm = async () => {
    if (isSavingOrder.value) return

    const validationError = validateOrderForm(orderForm.value, {
      isEdit: Boolean(editingOrderId.value),
      activityId: selectedActivityId.value,
    })
    if (validationError) {
      formErrorMessage.value = validationError
      return
    }

    isSavingOrder.value = true
    formErrorMessage.value = ''

    try {
      let savedOrder

      try {
        savedOrder = editingOrderId.value
          ? await updateOrder(editingOrderId.value, buildUpdateOrderPayload(orderForm.value, selectedActivityId.value))
          : await createOrder(buildCreateOrderPayload(orderForm.value, selectedActivityId.value))
      } catch (err) {
        formErrorMessage.value = err?.message || '訂單儲存失敗'
        return
      }

      closeOrderDialog()
      selectedOrder.value = savedOrder
      await refreshAfterChange()
    } finally {
      isSavingOrder.value = false
    }
  }

  return {
    orderForm,
    editingOrderId,
    isOrderDialogOpen,
    formErrorMessage,
    isSavingOrder,
    formProductOptions,
    openCreateOrder,
    openEditOrder,
    closeOrderDialog,
    addOrderItem,
    removeOrderItem,
    submitOrderForm,
  }
}
