import { reactive, ref } from 'vue'
import {
  createProductStockTransaction,
  listShippableProductOrders,
} from '@/modules/inventory/api/inventoryApi'
import { getCostTwd } from '@/modules/activityProduct/utils/productPricing'
import { toNumber } from '@/modules/activityProduct/utils/productMapper'

// Stock in/out flow: dialog + form state, the可出貨訂單 loader, order selection,
// validation, and the create-then-reload save. `loadProducts` reloads the inventory
// after a successful save; `statusMessage`/`errorMessage` are the page refs.
export const useStockTransaction = ({ loadProducts, statusMessage, errorMessage }) => {
  const selectedTransactionProduct = ref(null)
  const isTransactionDialogOpen = ref(false)
  const isSavingTransaction = ref(false)
  const transactionOrders = ref([])
  const isLoadingTransactionOrders = ref(false)
  const transactionErrorMessage = ref('')
  const transactionInOrOut = ref(true)
  const transactionForm = reactive({
    orderId: '',
    amount: '',
    unitCost: '',
    unitPrice: '',
  })

  const resetTransactionForm = () => {
    transactionForm.orderId = ''
    transactionForm.amount = ''
    transactionForm.unitCost = ''
    transactionForm.unitPrice = ''
    transactionOrders.value = []
    transactionErrorMessage.value = ''
  }

  const loadTransactionOrders = async (product) => {
    isLoadingTransactionOrders.value = true
    transactionErrorMessage.value = ''

    try {
      transactionOrders.value = (await listShippableProductOrders(product.id))
        .map((order) => ({
          ...order,
          amount: toNumber(order.amount),
        }))

      if (!transactionOrders.value.length) {
        transactionErrorMessage.value = '此商品目前沒有可供出貨的訂單。'
      }
    } catch (err) {
      transactionErrorMessage.value = err.message || '載入可出貨訂單失敗。'
    } finally {
      isLoadingTransactionOrders.value = false
    }
  }

  const openTransactionDialog = async (product, inOrOut) => {
    selectedTransactionProduct.value = product
    transactionInOrOut.value = inOrOut
    resetTransactionForm()
    transactionForm.unitCost = inOrOut ? getCostTwd(product) : ''
    transactionForm.unitPrice = inOrOut ? '' : toNumber(product.price)
    isTransactionDialogOpen.value = true

    if (!inOrOut) {
      await loadTransactionOrders(product)
    }
  }

  const selectTransactionOrder = () => {
    const selectedOrder = transactionOrders.value.find(
      (order) => Number(order.id) === Number(transactionForm.orderId),
    )
    transactionForm.amount = selectedOrder?.amount || ''
  }

  const closeTransactionDialog = () => {
    if (isSavingTransaction.value) return

    isTransactionDialogOpen.value = false
    selectedTransactionProduct.value = null
    resetTransactionForm()
  }

  const saveTransaction = async () => {
    const amount = Number(transactionForm.amount)
    const unitValue = Number(transactionInOrOut.value ? transactionForm.unitCost : transactionForm.unitPrice)

    if (!transactionInOrOut.value && !Number(transactionForm.orderId)) {
      transactionErrorMessage.value = '出貨前請先選擇訂單。'
      return
    }

    if (!Number.isInteger(amount) || amount <= 0) {
      transactionErrorMessage.value = '數量必須是大於 0 的整數。'
      return
    }

    if (!Number.isInteger(unitValue) || unitValue < 0) {
      transactionErrorMessage.value = transactionInOrOut.value
        ? '單位成本必須是大於或等於 0 的整數。'
        : '單位售價必須是大於或等於 0 的整數。'
      return
    }

    isSavingTransaction.value = true
    transactionErrorMessage.value = ''
    errorMessage.value = ''
    statusMessage.value = ''

    try {
      await createProductStockTransaction({
        productId: selectedTransactionProduct.value.id,
        amount,
        inOrOut: transactionInOrOut.value,
        unitCost: transactionInOrOut.value ? unitValue : null,
        unitPrice: transactionInOrOut.value ? null : unitValue,
        orderId: transactionInOrOut.value ? null : Number(transactionForm.orderId),
      })

      isTransactionDialogOpen.value = false
      selectedTransactionProduct.value = null
      resetTransactionForm()
      await loadProducts()
      statusMessage.value = transactionInOrOut.value ? '進貨異動新增成功。' : '出貨異動新增成功。'
    } catch (err) {
      transactionErrorMessage.value = err.message || '新增庫存異動失敗。'
    } finally {
      isSavingTransaction.value = false
    }
  }

  return {
    selectedTransactionProduct,
    isTransactionDialogOpen,
    isSavingTransaction,
    transactionOrders,
    isLoadingTransactionOrders,
    transactionErrorMessage,
    transactionInOrOut,
    transactionForm,
    resetTransactionForm,
    loadTransactionOrders,
    openTransactionDialog,
    selectTransactionOrder,
    closeTransactionDialog,
    saveTransaction,
  }
}
