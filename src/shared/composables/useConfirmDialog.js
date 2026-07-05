import { onBeforeUnmount, ref } from 'vue'

// Generic promise-based confirm dialog. `requestConfirm(target)` opens the dialog and
// resolves to true/false once `resolveConfirm` is called from the dialog's confirm/cancel.
// Any pending request is auto-resolved to false on unmount or when superseded.
export const useConfirmDialog = () => {
  const isConfirmDialogOpen = ref(false)
  const pendingConfirmTarget = ref(null)
  const confirmResolver = ref(null)

  const requestConfirm = (target) =>
    new Promise((resolve) => {
      if (confirmResolver.value) {
        confirmResolver.value(false)
      }

      pendingConfirmTarget.value = target
      confirmResolver.value = resolve
      isConfirmDialogOpen.value = true
    })

  const resolveConfirm = (result) => {
    if (confirmResolver.value) {
      confirmResolver.value(result)
    }

    confirmResolver.value = null
    pendingConfirmTarget.value = null
    isConfirmDialogOpen.value = false
  }

  onBeforeUnmount(() => {
    resolveConfirm(false)
  })

  return {
    isConfirmDialogOpen,
    pendingConfirmTarget,
    confirmResolver,
    requestConfirm,
    resolveConfirm,
  }
}
