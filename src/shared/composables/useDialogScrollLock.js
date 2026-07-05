import { onBeforeUnmount, watch } from 'vue'

// Toggles a `dialog-scroll-locked` class on <body> while any dialog is open,
// and guarantees the lock is released on unmount.
export const useDialogScrollLock = (isAnyDialogOpen) => {
  const setDialogScrollLock = (isLocked) => {
    if (typeof document === 'undefined') return

    document.body.classList.toggle('dialog-scroll-locked', isLocked)
  }

  watch(isAnyDialogOpen, setDialogScrollLock, { immediate: true })

  onBeforeUnmount(() => {
    setDialogScrollLock(false)
  })

  return {
    setDialogScrollLock,
  }
}
