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
  loadProducts,
  loadOrders,
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
      const detail = await getOrderDetail(order.id)
      selectedOrder.value = detail
      editingOrderId.value = detail.id
      orderForm.value = {
        subscriberName: detail.subscriberName || '',
        subscriberEmail: detail.subscriberEmail || '',
        subscriberBank: detail.subscriberBank || '',
        deliveryTypeId: detail.deliveryType?.id || '',
        orderStatus: detail.orderStatus || 1,
        paymentStatus: detail.paymentStatus || 1,
        deliveryStatus: detail.deliveryStatus || 1,
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

  const submitOrderForm = async () => {
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
      const savedOrder = editingOrderId.value
        ? await updateOrder(editingOrderId.value, buildUpdateOrderPayload(orderForm.value, selectedActivityId.value))
        : await createOrder(buildCreateOrderPayload(orderForm.value, selectedActivityId.value))

      closeOrderDialog()
      await Promise.all([loadProducts(), loadOrders()])
      selectedOrder.value = savedOrder
    } catch (err) {
      formErrorMessage.value = err?.message || '訂單儲存失敗'
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
