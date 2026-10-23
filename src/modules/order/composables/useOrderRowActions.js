import { computed, ref } from 'vue'
import { downloadOrderPdf, sendOrderConfirmationEmail } from '@/modules/order/api/orderApi'
import { triggerBlobDownload } from '@/shared/utils/download'

export const useOrderRowActions = ({ errorMessage, statusMessage, refreshAfterChange }) => {
  const downloadingOrderId = ref(null)
  const sendingConfirmationOrderId = ref(null)

  const isSendingConfirmationEmail = computed(() => sendingConfirmationOrderId.value !== null)

  const downloadOrderPdfFile = async (orderId) => {
    if (!orderId) {
      errorMessage.value = '訂單 ID 無效，無法下載 PDF。'
      return
    }

    downloadingOrderId.value = orderId
    errorMessage.value = ''

    try {
      const { blob, fileName } = await downloadOrderPdf(orderId)
      triggerBlobDownload(blob, fileName)
    } catch (err) {
      errorMessage.value = err?.message || '下載訂單 PDF 失敗'
    } finally {
      downloadingOrderId.value = null
    }
  }

  const sendConfirmationEmail = async (orderId) => {
    if (!orderId) {
      errorMessage.value = '訂單 ID 無效，無法寄送確認信。'
      return
    }

    if (isSendingConfirmationEmail.value) return

    sendingConfirmationOrderId.value = orderId
    errorMessage.value = ''
    statusMessage.value = ''

    let result = null
    let sendError = null

    try {
      result = await sendOrderConfirmationEmail(orderId)
    } catch (err) {
      sendError = err
    }

    try {
      // 寄確認信會把訂單狀態改為「已寄送訂單確認信」，且後端是先改狀態再寄信（寄信失敗時狀態也可能已變），
      // 所以不論成功或失敗都立刻重整；重整期間按鈕維持停用。
      // 訊息等重整完才顯示：重新載入會清掉 errorMessage，先設會被洗掉。
      await refreshAfterChange()
    } finally {
      sendingConfirmationOrderId.value = null
    }

    if (sendError) {
      errorMessage.value = sendError?.message || '訂單確認信寄送失敗'
      return
    }

    const recipient = result?.recipient || '顧客 Email'
    statusMessage.value = `訂單 #${result?.orderId || orderId} 確認信已寄送至 ${recipient}。`
  }

  return {
    downloadingOrderId,
    sendingConfirmationOrderId,
    isSendingConfirmationEmail,
    downloadOrderPdfFile,
    sendConfirmationEmail,
  }
}
