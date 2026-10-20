// 批次匯入商品的純函式：圖片清單整理、預覽結果整理、正式匯入的 payload 與要上傳的圖片。
// 規則與後端 ProductImportImages / ProductImportRules 一致（檔名不分大小寫、每張 5MB、一次最多 500 張 / 200MB）。

import { ALLOWED_IMAGE_ACCEPT, ALLOWED_IMAGE_EXTENSIONS } from '@/shared/constants/imageTypes'

export const IMPORT_IMAGE_EXTENSIONS = ALLOWED_IMAGE_EXTENSIONS
export const IMPORT_IMAGE_ACCEPT = ALLOWED_IMAGE_ACCEPT
export const MAX_IMPORT_IMAGE_FILES = 500
export const MAX_IMPORT_IMAGE_TOTAL_BYTES = 200 * 1024 * 1024
export const MAX_IMPORT_EXCEL_BYTES = 5 * 1024 * 1024

const normalizeName = (name) => String(name || '').trim().toLowerCase()

const getExtension = (name) => {
  const text = String(name || '')
  const dotIndex = text.lastIndexOf('.')
  return dotIndex >= 0 ? text.slice(dotIndex).toLowerCase() : ''
}

export const isImportImageFile = (file) => IMPORT_IMAGE_EXTENSIONS.includes(getExtension(file?.name))

export const isExcelFile = (file) => getExtension(file?.name) === '.xlsx'

export const formatFileSize = (bytes) => {
  const value = Number(bytes) || 0
  if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`
  if (value >= 1024) return `${Math.round(value / 1024)} KB`
  return `${value} B`
}

// 合併新選的圖片：只保留支援的格式；同名（不分大小寫）時以新選的檔案取代舊的。
// 拖曳資料夾時常夾帶 .DS_Store、Thumbs.db 等檔案，直接略過並回報數量。
// 同一批內有同名檔案（例如不同子資料夾）時只會留下最後一張，回報數量讓使用者確認。
export const mergeImageFiles = (currentFiles, incomingFiles) => {
  const byName = new Map(currentFiles.map((file) => [normalizeName(file.name), file]))
  const incomingNames = new Set()
  let skippedCount = 0
  let duplicateCount = 0

  for (const file of incomingFiles) {
    if (!isImportImageFile(file)) {
      skippedCount += 1
      continue
    }

    const key = normalizeName(file.name)
    if (incomingNames.has(key)) duplicateCount += 1
    incomingNames.add(key)
    byName.set(key, file)
  }

  return { files: [...byName.values()], skippedCount, duplicateCount }
}

export const getImageSetError = (files) => {
  if (files.length > MAX_IMPORT_IMAGE_FILES) {
    return `一次最多上傳 ${MAX_IMPORT_IMAGE_FILES} 張圖片，請分批匯入。`
  }

  const totalBytes = files.reduce((sum, file) => sum + (Number(file.size) || 0), 0)
  if (totalBytes > MAX_IMPORT_IMAGE_TOTAL_BYTES) {
    return `圖片總大小不可超過 ${MAX_IMPORT_IMAGE_TOTAL_BYTES / 1024 / 1024}MB，請分批匯入或先壓縮圖片。`
  }

  return ''
}

// 預覽只送圖片清單（不送檔案本身），後端用來比對 Excel 的「圖片檔名」。
export const buildImageManifest = (files) =>
  JSON.stringify(files.map((file) => ({ name: file.name, size: file.size, type: file.type || '' })))

export const createImageLookup = (files) =>
  new Map(files.map((file) => [normalizeName(file.name), file]))

export const findImageFile = (lookup, name) => lookup.get(normalizeName(name)) || null

const toList = (value) => (Array.isArray(value) ? value : [])

export const mapPreviewRow = (row) => ({
  rowNumber: Number(row?.rowNumber) || 0,
  name: row?.name || '',
  productTypeId: row?.productTypeId ?? null,
  productTypeName: row?.productTypeName || '',
  japanCost: row?.japanCost ?? null,
  rate: row?.rate ?? null,
  saleRate: row?.saleRate ?? null,
  price: row?.price ?? null,
  isPriceCalculated: row?.isPriceCalculated === true,
  isOutStock: row?.isOutStock === true,
  info: row?.info || null,
  imageFileNames: toList(row?.imageFileNames),
  missingImageFileNames: toList(row?.missingImageFileNames),
  errors: toList(row?.errors),
  warnings: toList(row?.warnings),
})

export const mapPreviewResponse = (data) => {
  const rows = toList(data?.rows).map(mapPreviewRow)
  return {
    rows,
    totalCount: rows.length,
    errorCount: rows.filter((row) => row.errors.length).length,
    warningCount: rows.filter((row) => !row.errors.length && row.warnings.length).length,
    imageCount: Number(data?.imageCount) || 0,
    unusedImageFileNames: toList(data?.unusedImageFileNames),
  }
}

export const getRowStatus = (row) => {
  if (row.errors.length) return 'error'
  if (row.warnings.length) return 'warning'
  return 'ok'
}

export const buildImportPayload = (rows) => ({
  items: rows.map((row) => ({
    rowNumber: row.rowNumber,
    name: row.name,
    productTypeId: row.productTypeId,
    japanCost: row.japanCost,
    rate: row.rate,
    price: row.price,
    isOutStock: row.isOutStock,
    info: row.info,
    imageFileNames: row.imageFileNames,
  })),
})

// 正式匯入只上傳 Excel 有用到的圖片（每個檔案只送一次）。
export const pickReferencedImageFiles = (rows, files) => {
  const lookup = createImageLookup(files)
  const picked = new Map()

  for (const row of rows) {
    for (const name of row.imageFileNames) {
      const file = findImageFile(lookup, name)
      if (file) picked.set(normalizeName(file.name), file)
    }
  }

  return [...picked.values()]
}

export const IMPORT_OUTCOME_UNKNOWN_TITLE = '無法確認匯入結果'
export const IMPORT_OUTCOME_UNKNOWN_MESSAGE =
  '無法確認匯入結果（連線逾時或中斷），商品可能已經建立。請先到商品列表確認，不要直接重新匯入。'
export const IMPORT_LEAVE_CONFIRM_MESSAGE =
  '商品還在匯入中。現在離開會看不到匯入結果，商品可能已經建立。確定要離開嗎？'

// 沒有收到後端回覆的狀態：0＝斷線或被中止、408＝前端逾時、502/503/504＝閘道逾時。
const OUTCOME_UNKNOWN_STATUSES = [0, 408, 502, 503, 504]

// 後端自己的失敗回覆都帶 envelope 的 status 欄位，代表後端已處理並明確回覆失敗（會做補償）。
const hasBackendReply = (error) => {
  const data = error?.responseData
  return Boolean(data) && typeof data === 'object' && 'status' in data
}

// 匯入失敗時判斷結果：有後端回覆才能確定「沒有任何商品被新增」；逾時或斷線時商品可能已經寫入，
// 這時不能讓使用者直接重送（後端沒有防重複），要先確認商品列表。
export const describeImportFailure = (error) => {
  const status = Number(error?.status) || 0
  if (!hasBackendReply(error) && OUTCOME_UNKNOWN_STATUSES.includes(status)) {
    return { outcomeUnknown: true, message: IMPORT_OUTCOME_UNKNOWN_MESSAGE }
  }

  return { outcomeUnknown: false, message: error?.message || '匯入失敗，沒有任何商品被新增。' }
}
