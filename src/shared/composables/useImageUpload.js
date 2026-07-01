import { computed, ref, unref } from 'vue'

const defaultMaxBytes = 5 * 1024 * 1024

const resolveOptionValue = (value) => (typeof value === 'function' ? value() : unref(value))

export const useImageUpload = ({
  existingImageUrl = '',
  maxBytes = defaultMaxBytes,
  typePrefix = 'image/',
  invalidTypeMessage = '僅支援圖片檔。',
  maxBytesMessage = '圖片不可超過 5MB。',
  onError,
} = {}) => {
  const selectedImageFile = ref(null)
  const imagePreviewUrl = ref('')

  const imagePreview = computed(() => imagePreviewUrl.value || resolveOptionValue(existingImageUrl) || '')

  const setError = (message) => {
    onError?.(message)
  }

  const clearImagePreview = () => {
    if (imagePreviewUrl.value && typeof URL !== 'undefined') {
      URL.revokeObjectURL(imagePreviewUrl.value)
    }

    imagePreviewUrl.value = ''
  }

  const resetImageUpload = () => {
    selectedImageFile.value = null
    clearImagePreview()
  }

  const onImageChange = (event) => {
    const [file] = event.target.files || []
    resetImageUpload()
    setError('')

    if (!file) return

    if (!file.type.startsWith(typePrefix)) {
      setError(invalidTypeMessage)
      event.target.value = ''
      return
    }

    if (file.size > maxBytes) {
      setError(maxBytesMessage)
      event.target.value = ''
      return
    }

    selectedImageFile.value = file
    imagePreviewUrl.value = URL.createObjectURL(file)
  }

  return {
    selectedImageFile,
    imagePreviewUrl,
    imagePreview,
    clearImagePreview,
    resetImageUpload,
    onImageChange,
  }
}
