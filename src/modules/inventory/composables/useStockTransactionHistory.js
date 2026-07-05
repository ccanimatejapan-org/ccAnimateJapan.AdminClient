import { ref } from 'vue'
import { listProductStockTransactions } from '@/modules/inventory/api/inventoryApi'

// Stock-transaction history dialog: open/load/close + state.
export const useStockTransactionHistory = () => {
  const selectedHistoryProduct = ref(null)
  const isHistoryDialogOpen = ref(false)
  const isLoadingHistory = ref(false)
  const transactionHistory = ref([])
  const historyErrorMessage = ref('')

  const openTransactionHistory = async (product) => {
    selectedHistoryProduct.value = product
    isHistoryDialogOpen.value = true
    isLoadingHistory.value = true
    historyErrorMessage.value = ''
    transactionHistory.value = []

    try {
      transactionHistory.value = await listProductStockTransactions(product.id)
    } catch (err) {
      historyErrorMessage.value = err.message || '載入庫存異動明細失敗。'
    } finally {
      isLoadingHistory.value = false
    }
  }

  const closeTransactionHistory = () => {
    isHistoryDialogOpen.value = false
    selectedHistoryProduct.value = null
    transactionHistory.value = []
    historyErrorMessage.value = ''
  }

  return {
    selectedHistoryProduct,
    isHistoryDialogOpen,
    isLoadingHistory,
    transactionHistory,
    historyErrorMessage,
    openTransactionHistory,
    closeTransactionHistory,
  }
}
