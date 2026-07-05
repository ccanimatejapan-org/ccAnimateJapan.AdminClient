import { computed, ref } from 'vue'
import { downloadOrderPdf, sendOrderConfirmationEmail } from '@/modules/order/api/orderApi'
import { triggerBlobDownload } from '@/shared/utils/download'

export const useOrderRowActions = ({ errorMessage, statusMessage }) => {
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

    try {
      const result = await sendOrderConfirmationEmail(orderId)
      const recipient = result?.recipient || '顧客 Email'
      statusMessage.value = `訂單 #${result?.orderId || orderId} 確認信已寄送至 ${recipient}。`
    } catch (err) {
      errorMessage.value = err?.message || '訂單確認信寄送失敗'
    } finally {
      sendingConfirmationOrderId.value = null
    }
  }

  return {
    downloadingOrderId,
    sendingConfirmationOrderId,
    isSendingConfirmationEmail,
    downloadOrderPdfFile,
    sendConfirmationEmail,
  }
}
