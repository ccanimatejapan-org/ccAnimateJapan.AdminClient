// Copies text to the clipboard, preferring the async Clipboard API and falling back
// to a hidden <textarea> + execCommand for non-secure contexts / older browsers.
export const copyTextToClipboard = async (text) => {
  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard?.writeText &&
    (typeof window === 'undefined' || window.isSecureContext)
  ) {
    await navigator.clipboard.writeText(text)
    return
  }

  if (typeof document === 'undefined') {
    throw new Error('Clipboard is unavailable')
  }

  const textArea = document.createElement('textarea')
  textArea.value = text
  textArea.setAttribute('readonly', '')
  textArea.style.position = 'fixed'
  textArea.style.opacity = '0'
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()

  const wasCopied = document.execCommand('copy')
  document.body.removeChild(textArea)

  if (!wasCopied) {
    throw new Error('Clipboard copy failed')
  }
}
