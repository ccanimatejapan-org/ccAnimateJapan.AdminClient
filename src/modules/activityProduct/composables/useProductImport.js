import { computed, onBeforeUnmount, reactive, ref, unref } from 'vue'
import {
  downloadProductImportTemplate,
  importActivityProducts,
  previewProductImport,
} from '@/modules/activityProduct/api/activityProductApi'
import { triggerBlobDownload } from '@/shared/utils/download'
import {
  MAX_IMPORT_EXCEL_BYTES,
  buildImageManifest,
  buildImportPayload,
  createImageLookup,
  findImageFile,
  getImageSetError,
  isExcelFile,
  mapPreviewResponse,
  mergeImageFiles,
  pickReferencedImageFiles,
} from '@/modules/activityProduct/utils/productImport'

export const IMPORT_STEPS = Object.freeze({ select: 1, preview: 2, result: 3 })

// 拖曳時可能是整個資料夾：用 webkitGetAsEntry 逐層讀出所有檔案。
const readEntryFiles = (entry) =>
  new Promise((resolve) => {
    if (!entry) {
      resolve([])
      return
    }

    if (entry.isFile) {
      entry.file((file) => resolve([file]), () => resolve([]))
      return
    }

    const reader = entry.createReader()
    const collected = []
    const readBatch = () => {
      reader.readEntries(async (entries) => {
        if (!entries.length) {
          resolve(collected)
          return
        }

        for (const child of entries) {
          collected.push(...(await readEntryFiles(child)))
        }
        readBatch()
      }, () => resolve(collected))
    }
    readBatch()
  })

export const readDroppedFiles = async (dataTransfer) => {
  const items = [...(dataTransfer?.items || [])]
  const entries = items.map((item) => item.webkitGetAsEntry?.()).filter(Boolean)
  if (!entries.length) return [...(dataTransfer?.files || [])]

  const groups = await Promise.all(entries.map(readEntryFiles))
  return groups.flat()
}

// 批次匯入視窗的狀態：選檔 → 預覽（只送 Excel 與圖片清單）→ 正式匯入（送資料與用到的圖片）。
export const useProductImport = ({ activityId, activityRateDefaults }) => {
  const step = ref(IMPORT_STEPS.select)
  const excelFile = ref(null)
  const imageFiles = ref([])
  const preview = ref(null)
  const result = ref(null)
  const errorMessage = ref('')
  const noticeMessage = ref('')
  const onlyErrors = ref(false)
  const isPreviewing = ref(false)
  const isImporting = ref(false)
  const isDownloadingTemplate = ref(false)
  const progress = reactive({ phase: '', percent: 0, loaded: 0, total: 0 })
  const thumbnailUrls = new Map()

  const imageLookup = computed(() => createImageLookup(imageFiles.value))
  const imageTotalBytes = computed(() => imageFiles.value.reduce((sum, file) => sum + file.size, 0))
  const hasErrors = computed(() => (preview.value?.errorCount || 0) > 0)
  const canPreview = computed(() => Boolean(excelFile.value) && !isPreviewing.value)
  const canImport = computed(
    () => step.value === IMPORT_STEPS.preview && Boolean(preview.value?.rows.length) && !hasErrors.value && !isPreviewing.value,
  )
  const visibleRows = computed(() => {
    const rows = preview.value?.rows || []
    return onlyErrors.value ? rows.filter((row) => row.errors.length) : rows
  })

  const revokeThumbnails = () => {
    for (const url of thumbnailUrls.values()) URL.revokeObjectURL(url)
    thumbnailUrls.clear()
  }

  // 只替預覽表格實際顯示的圖片建立縮圖網址，換檔或關閉時釋放。
  const getThumbnailUrl = (fileName) => {
    const file = findImageFile(imageLookup.value, fileName)
    if (!file || typeof URL === 'undefined') return ''

    if (!thumbnailUrls.has(file)) thumbnailUrls.set(file, URL.createObjectURL(file))
    return thumbnailUrls.get(file)
  }

  const resetMessages = () => {
    errorMessage.value = ''
    noticeMessage.value = ''
  }

  const setExcelFile = (file) => {
    if (!file) return false
    resetMessages()

    if (!isExcelFile(file)) {
      errorMessage.value = '請選擇 .xlsx 格式的 Excel 檔。'
      return false
    }

    if (file.size > MAX_IMPORT_EXCEL_BYTES) {
      errorMessage.value = 'Excel 檔案大小不可超過 5MB。'
      return false
    }

    excelFile.value = file
    return true
  }

  const addImageFiles = (files) => {
    resetMessages()
    const { files: merged, skippedCount, duplicateCount } = mergeImageFiles(imageFiles.value, [...files])
    const setError = getImageSetError(merged)
    if (setError) {
      errorMessage.value = setError
      return false
    }

    revokeThumbnails()
    imageFiles.value = merged
    const notices = []
    if (skippedCount) notices.push(`已略過 ${skippedCount} 個不是 jpg、png、webp、gif 的檔案。`)
    if (duplicateCount) notices.push(`有 ${duplicateCount} 張圖片與其他圖片同名，只保留最後一張，請確認檔名不重複。`)
    noticeMessage.value = notices.join('')
    return true
  }

  const clearImageFiles = () => {
    revokeThumbnails()
    imageFiles.value = []
  }

  const runPreview = async () => {
    if (!excelFile.value) {
      errorMessage.value = '請先選擇 Excel 檔。'
      return false
    }

    isPreviewing.value = true
    errorMessage.value = ''
    try {
      const data = await previewProductImport(unref(activityId), {
        file: excelFile.value,
        defaultRate: activityRateDefaults.rate,
        defaultSaleRate: activityRateDefaults.saleRate,
        imageManifest: buildImageManifest(imageFiles.value),
      })
      preview.value = mapPreviewResponse(data)
      noticeMessage.value = ''
      onlyErrors.value = false
      step.value = IMPORT_STEPS.preview
      return true
    } catch (err) {
      errorMessage.value = err.message || '檢查資料失敗。'
      return false
    } finally {
      isPreviewing.value = false
    }
  }

  // 預覽階段重新選檔後立即重新檢查，避免畫面停留在過期的結果。
  const replaceExcelAndPreview = async (file) => {
    if (setExcelFile(file)) await runPreview()
  }

  const addImagesAndPreview = async (files) => {
    if (addImageFiles(files) && step.value === IMPORT_STEPS.preview) await runPreview()
  }

  const runImport = async () => {
    if (!canImport.value) return false

    const rows = preview.value.rows
    const images = pickReferencedImageFiles(rows, imageFiles.value)
    step.value = IMPORT_STEPS.result
    isImporting.value = true
    errorMessage.value = ''
    result.value = null
    Object.assign(progress, {
      phase: images.length ? 'upload' : 'save',
      percent: 0,
      loaded: 0,
      total: images.reduce((sum, file) => sum + file.size, 0),
    })

    try {
      const data = await importActivityProducts(
        unref(activityId),
        { payload: buildImportPayload(rows), images },
        {
          onUploadProgress: (event) => {
            const total = event.total || progress.total || 1
            progress.loaded = event.loaded
            progress.percent = Math.min(100, Math.round((event.loaded / total) * 100))
            if (event.loaded >= total) progress.phase = 'save'
          },
        },
      )
      result.value = {
        createdCount: Number(data?.createdCount) || rows.length,
        imageCount: Number(data?.imageCount) || 0,
        noImageCount: rows.filter((row) => !row.imageFileNames.length).length,
      }
      progress.phase = 'done'
      progress.percent = 100
      return true
    } catch (err) {
      progress.phase = 'failed'
      errorMessage.value = err.message || '匯入失敗，沒有任何商品被新增。'
      return false
    } finally {
      isImporting.value = false
    }
  }

  const backToSelect = () => {
    resetMessages()
    step.value = IMPORT_STEPS.select
  }

  const backToPreview = () => {
    resetMessages()
    step.value = IMPORT_STEPS.preview
  }

  const reset = () => {
    revokeThumbnails()
    step.value = IMPORT_STEPS.select
    excelFile.value = null
    imageFiles.value = []
    preview.value = null
    result.value = null
    onlyErrors.value = false
    resetMessages()
    Object.assign(progress, { phase: '', percent: 0, loaded: 0, total: 0 })
  }

  const downloadTemplate = async () => {
    isDownloadingTemplate.value = true
    errorMessage.value = ''
    try {
      const { blob, fileName } = await downloadProductImportTemplate(unref(activityId), {
        rate: activityRateDefaults.rate,
        saleRate: activityRateDefaults.saleRate,
      })
      triggerBlobDownload(blob, fileName)
    } catch (err) {
      errorMessage.value = err.message || '下載匯入範本失敗。'
    } finally {
      isDownloadingTemplate.value = false
    }
  }

  onBeforeUnmount(revokeThumbnails)

  return {
    step,
    excelFile,
    imageFiles,
    imageTotalBytes,
    preview,
    visibleRows,
    result,
    errorMessage,
    noticeMessage,
    onlyErrors,
    progress,
    hasErrors,
    canPreview,
    canImport,
    isPreviewing,
    isImporting,
    isDownloadingTemplate,
    getThumbnailUrl,
    setExcelFile,
    addImageFiles,
    clearImageFiles,
    runPreview,
    replaceExcelAndPreview,
    addImagesAndPreview,
    runImport,
    backToSelect,
    backToPreview,
    reset,
    downloadTemplate,
  }
}
