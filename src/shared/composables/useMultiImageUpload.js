import { computed, onBeforeUnmount, ref } from 'vue'

const DEFAULT_MAX_BYTES = 5 * 1024 * 1024
const DEFAULT_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

const toNumber = (value, fallback = 0) => {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : fallback
}

// Multi-image upload state shared with ProductImagePicker (parallels the single-image
// useImageUpload). Tracks existing/removed/selected images, derives the combined preview
// items + remaining slots, validates type/size/limit on change, and owns the preview
// object-URL lifecycle (revoking on removal/reset/unmount). `appendTo` writes the selected
// files and removed ids onto a FormData payload.
export const useMultiImageUpload = ({
  limit = 5,
  maxBytes = DEFAULT_MAX_BYTES,
  allowedTypes = DEFAULT_ALLOWED_TYPES,
  imageFilesField = 'imageFiles',
  removeImageIdsField = 'removeImageIds',
  getExistingImageName = () => '',
  invalidTypeMessage = '商品圖片僅支援 JPG、PNG、WebP 或 GIF。',
  maxBytesMessage = '單張商品圖片不可超過 5MB。',
  limitReachedMessage = (max) => `商品圖片最多 ${max} 張。`,
  partialAcceptMessage = (max, accepted) => `商品圖片最多 ${max} 張，已加入前 ${accepted} 張。`,
  onError,
} = {}) => {
  const allowedTypeSet = new Set(allowedTypes)
  const existingImages = ref([])
  const removedImageIds = ref([])
  const selectedFiles = ref([])
  const previewUrls = ref([])

  const setError = (message) => {
    onError?.(message)
  }

  const activeExistingImages = computed(() =>
    existingImages.value.filter((image) => !removedImageIds.value.includes(toNumber(image.id))),
  )

  const imageItems = computed(() => [
    ...activeExistingImages.value.map((image) => ({
      key: `existing-${image.id}`,
      kind: 'existing',
      id: image.id,
      url: image.productImageUrl,
      name: getExistingImageName() || '商品圖片',
    })),
    ...selectedFiles.value.map((file, index) => ({
      key: `new-${index}-${file.name}-${file.size}-${file.lastModified}`,
      kind: 'new',
      index,
      url: previewUrls.value[index],
      name: file.name,
    })),
  ])

  const remainingSlots = computed(() => Math.max(0, limit - imageItems.value.length))

  const revokePreviewUrl = (url) => {
    if (url && typeof URL !== 'undefined') {
      URL.revokeObjectURL(url)
    }
  }

  const clearSelected = () => {
    previewUrls.value.forEach(revokePreviewUrl)
    selectedFiles.value = []
    previewUrls.value = []
  }

  const reset = () => {
    clearSelected()
    existingImages.value = []
    removedImageIds.value = []
  }

  const handleChange = (event) => {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    setError('')

    if (!files.length) return

    const invalidTypeFile = files.find((file) => !allowedTypeSet.has(file.type))
    if (invalidTypeFile) {
      setError(invalidTypeMessage)
      return
    }

    const oversizedFile = files.find((file) => file.size > maxBytes)
    if (oversizedFile) {
      setError(maxBytesMessage)
      return
    }

    if (remainingSlots.value <= 0) {
      setError(limitReachedMessage(limit))
      return
    }

    const acceptedFiles = files.slice(0, remainingSlots.value)
    if (files.length > acceptedFiles.length) {
      setError(partialAcceptMessage(limit, acceptedFiles.length))
    }

    selectedFiles.value = [...selectedFiles.value, ...acceptedFiles]
    previewUrls.value = [
      ...previewUrls.value,
      ...acceptedFiles.map((file) => URL.createObjectURL(file)),
    ]
  }

  const removeExisting = (imageId) => {
    const normalizedImageId = toNumber(imageId)
    if (normalizedImageId <= 0 || removedImageIds.value.includes(normalizedImageId)) return

    removedImageIds.value = [...removedImageIds.value, normalizedImageId]
  }

  const removeNew = (index) => {
    const normalizedIndex = toNumber(index, -1)
    if (normalizedIndex < 0) return

    revokePreviewUrl(previewUrls.value[normalizedIndex])
    selectedFiles.value = selectedFiles.value.filter((_, fileIndex) => fileIndex !== normalizedIndex)
    previewUrls.value = previewUrls.value.filter((_, fileIndex) => fileIndex !== normalizedIndex)
  }

  const appendTo = (formData) => {
    selectedFiles.value.forEach((file) => {
      formData.append(imageFilesField, file)
    })
    removedImageIds.value.forEach((imageId) => {
      formData.append(removeImageIdsField, imageId)
    })
  }

  onBeforeUnmount(() => {
    reset()
  })

  return {
    limit,
    existingImages,
    removedImageIds,
    selectedFiles,
    previewUrls,
    imageItems,
    remainingSlots,
    handleChange,
    removeExisting,
    removeNew,
    clearSelected,
    reset,
    appendTo,
  }
}
