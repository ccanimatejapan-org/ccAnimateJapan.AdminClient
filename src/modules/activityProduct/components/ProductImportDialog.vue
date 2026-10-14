<script setup>
import { computed, ref } from 'vue'
import AppButton from '@/shared/components/AppButton.vue'
import IconButton from '@/shared/components/IconButton.vue'
import MessageBlock from '@/shared/components/MessageBlock.vue'
import { IMPORT_STEPS, readDroppedFiles, useProductImport } from '@/modules/activityProduct/composables/useProductImport'
import {
  IMPORT_IMAGE_ACCEPT,
  MAX_IMPORT_IMAGE_FILES,
  MAX_IMPORT_IMAGE_TOTAL_BYTES,
  formatFileSize,
  getRowStatus,
} from '@/modules/activityProduct/utils/productImport'

const props = defineProps({
  activityId: {
    type: [Number, String],
    required: true,
  },
  activityName: {
    type: String,
    default: '',
  },
  activityRateDefaults: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['close', 'imported'])

const {
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
  downloadTemplate,
} = useProductImport({
  activityId: computed(() => props.activityId),
  activityRateDefaults: props.activityRateDefaults,
})

const steps = [
  { value: IMPORT_STEPS.select, label: '選擇檔案' },
  { value: IMPORT_STEPS.preview, label: '預覽與檢查' },
  { value: IMPORT_STEPS.result, label: '匯入結果' },
]

const excelInput = ref(null)
const imageInput = ref(null)
const folderInput = ref(null)
const dragTarget = ref('')

const isBusy = computed(() => isPreviewing.value || isImporting.value)
const maxTotalImageMb = MAX_IMPORT_IMAGE_TOTAL_BYTES / 1024 / 1024

const confirmHint = computed(() => {
  if (!preview.value) return ''
  return hasErrors.value
    ? `還有 ${preview.value.errorCount} 筆錯誤，全部修正後才能匯入`
    : '全部檢查通過'
})

// 「列」顯示資料的流水號（從 1 開始），篩選「只看錯誤」時仍保留原本的編號。
const displayIndexByRowNumber = computed(() =>
  new Map((preview.value?.rows || []).map((row, index) => [row.rowNumber, index + 1])),
)
const getDisplayIndex = (row) => displayIndexByRowNumber.value.get(row.rowNumber) ?? '-'

const confirmLabel = computed(() =>
  canImport.value && preview.value ? `確認匯入 ${preview.value.totalCount} 個商品` : '確認匯入',
)

const progressText = computed(() => {
  if (progress.phase === 'upload') {
    return `上傳圖片中 ${formatFileSize(progress.loaded)} / ${formatFileSize(progress.total)}`
  }
  if (progress.phase === 'save') return '寫入商品資料中…'
  return ''
})

const statusLabels = { ok: '正確', warning: '提醒', error: '錯誤' }

const formatNumber = (value) => (value === null || value === undefined ? '-' : Number(value).toLocaleString())

// 模板中的 ref 會自動解包，這裡收到的是 <input> 元素本身。
const pickFiles = (input) => input?.click()

const takeFiles = (event) => {
  const files = [...(event.target.files || [])]
  event.target.value = ''
  return files
}

const onExcelInput = async (event) => {
  const [file] = takeFiles(event)
  if (!file) return
  if (step.value === IMPORT_STEPS.preview) await replaceExcelAndPreview(file)
  else setExcelFile(file)
}

// 選擇頁的資料夾按鈕：已選過圖片時改為「重新選擇」，選好新資料夾後取代原本的圖片；
// 在檔案視窗按取消不會觸發 change，原本的圖片會保留。
let replaceImagesOnPick = false
const pickImageFolder = () => {
  replaceImagesOnPick = imageFiles.value.length > 0
  pickFiles(folderInput.value)
}

const onImageInput = async (event) => {
  const files = takeFiles(event)
  const shouldReplace = replaceImagesOnPick
  replaceImagesOnPick = false
  if (!files.length) return
  if (shouldReplace) clearImageFiles()
  if (step.value === IMPORT_STEPS.preview) await addImagesAndPreview(files)
  else addImageFiles(files)
}

const onDrop = async (target, event) => {
  dragTarget.value = ''
  const files = await readDroppedFiles(event.dataTransfer)
  if (target === 'excel') {
    const excel = files.find((file) => file.name.toLowerCase().endsWith('.xlsx')) || files[0]
    setExcelFile(excel)
    return
  }

  // 圖片區也接受一起拖進來的 Excel，省一步。
  const excel = files.find((file) => file.name.toLowerCase().endsWith('.xlsx'))
  if (excel) setExcelFile(excel)
  addImageFiles(files.filter((file) => file !== excel))
}

const close = () => {
  if (isImporting.value) return
  emit('close')
}

const confirmImport = async () => {
  if (await runImport()) emit('imported', result.value)
}
</script>

<template>
  <!-- 拖曳到投放區以外時擋下瀏覽器預設行為，避免直接開啟檔案而離開頁面。 -->
  <div class="modal-backdrop" @dragover.prevent @drop.prevent>
    <section class="import-dialog" role="dialog" aria-modal="true" aria-labelledby="product-import-title">
      <div class="dialog-heading">
        <div>
          <h2 id="product-import-title">批次匯入商品</h2>
          <p class="dialog-subtitle">匯入到「{{ activityName || '目前活動' }}」，全部檢查通過後才會寫入</p>
        </div>
        <IconButton variant="soft-close" aria-label="關閉" :disabled="isImporting" @click="close">×</IconButton>
      </div>

      <ol class="import-steps" aria-label="匯入步驟">
        <li
          v-for="item in steps"
          :key="item.value"
          class="import-step"
          :class="{ 'is-current': step === item.value, 'is-done': step > item.value }"
          :aria-current="step === item.value ? 'step' : undefined"
        >
          <span class="import-step-number">{{ item.value }}</span>
          {{ item.label }}
        </li>
      </ol>

      <input ref="excelInput" class="sr-only" type="file" accept=".xlsx" @change="onExcelInput" />
      <input ref="imageInput" class="sr-only" type="file" :accept="IMPORT_IMAGE_ACCEPT" multiple @change="onImageInput" />
      <input ref="folderInput" class="sr-only" type="file" webkitdirectory @change="onImageInput" />

      <div class="import-body">
        <div v-if="step === IMPORT_STEPS.select" class="select-step">
          <div class="import-note">
            <p>商品名稱、商品類型、日幣成本、成本匯率、售價匯率、售價、庫存狀態、圖片檔名皆為必填，只有商品說明可留空。</p>
            <p>下載的範本會預先帶入此頁設定的匯率（{{ activityRateDefaults.rate }} / {{ activityRateDefaults.saleRate }}），可在 Excel 逐列修改。</p>
            <p>在範本的 <code>圖片檔名</code> 欄填入檔名，多張用 <code>;</code> 隔開，例如 <code>A001-1.jpg;A001-2.jpg</code>。</p>
            <p>第一張為主圖，每個商品最多 5 張。</p>
            <p>圖片一次最多 {{ MAX_IMPORT_IMAGE_FILES }} 張、總共 {{ maxTotalImageMb }}MB。</p>
            <button class="link-button" type="button" :disabled="isDownloadingTemplate" @click="downloadTemplate">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11" /><path d="m7 10 5 5 5-5" /><path d="M5 16v4h14v-4" /></svg>
              {{ isDownloadingTemplate ? '下載中…' : '下載匯入範本 (.xlsx)' }}
            </button>
          </div>

          <div class="drop-zones">
            <div
              class="drop-zone"
              :class="{ 'is-filled': excelFile, 'is-dragging': dragTarget === 'excel' }"
              @dragover.prevent="dragTarget = 'excel'"
              @dragleave="dragTarget = ''"
              @drop.prevent="onDrop('excel', $event)"
            >
              <span class="drop-zone-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" /><path d="M14 3v5h5" /><path d="m9 12 6 6" /><path d="m15 12-6 6" /></svg>
              </span>
              <template v-if="excelFile">
                <strong class="drop-zone-title">{{ excelFile.name }}</strong>
                <span class="drop-zone-sub">{{ formatFileSize(excelFile.size) }}</span>
              </template>
              <template v-else>
                <strong class="drop-zone-title">拖曳 Excel 到這裡 <span class="tag tag--required">必填</span></strong>
                <span class="drop-zone-sub">.xlsx，一次最多 500 筆商品</span>
              </template>
              <AppButton pill @click="pickFiles(excelInput)">{{ excelFile ? '重新選擇' : '選擇 Excel' }}</AppButton>
            </div>

            <div
              class="drop-zone"
              :class="{ 'is-filled': imageFiles.length, 'is-dragging': dragTarget === 'images' }"
              @dragover.prevent="dragTarget = 'images'"
              @dragleave="dragTarget = ''"
              @drop.prevent="onDrop('images', $event)"
            >
              <span class="drop-zone-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="m21 16-5-5-8 8" /></svg>
              </span>
              <template v-if="imageFiles.length">
                <strong class="drop-zone-title">已選 {{ imageFiles.length }} 張圖片</strong>
                <span class="drop-zone-sub">共 {{ formatFileSize(imageTotalBytes) }}</span>
              </template>
              <template v-else>
                <strong class="drop-zone-title">拖曳資料夾 <span class="tag tag--required">必填</span></strong>
                <span class="drop-zone-sub">jpg、png、webp、avif，每張 5MB 以內</span>
              </template>
              <div class="drop-zone-actions">
                <AppButton pill @click="pickImageFolder">{{ imageFiles.length ? '重新選擇' : '選擇資料夾' }}</AppButton>
              </div>
            </div>
          </div>

        </div>

        <div v-else-if="step === IMPORT_STEPS.preview && preview" class="preview-step">
          <div class="preview-summary">
            <span class="chip">共 {{ preview.totalCount }} 筆</span>
            <span class="chip chip--ok">可匯入 {{ preview.totalCount - preview.errorCount }}</span>
            <span v-if="preview.errorCount" class="chip chip--error">錯誤 {{ preview.errorCount }}</span>
            <span v-if="preview.warningCount" class="chip chip--warning">提醒 {{ preview.warningCount }}</span>
            <span class="chip">圖片 {{ preview.imageCount }} 張</span>
          </div>

          <div class="preview-toolbar">
            <label class="only-errors">
              <input v-model="onlyErrors" type="checkbox" :disabled="!preview.errorCount" />
              只看錯誤
            </label>
            <div class="preview-toolbar-actions">
              <AppButton pill :disabled="isBusy" @click="pickFiles(excelInput)">
                <svg class="button-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" /><path d="M14 3v5h5" /><path d="M12 18v-6" /><path d="m9 15 3-3 3 3" /></svg>
                重新上傳 Excel
              </AppButton>
              <AppButton pill :disabled="isBusy" @click="pickFiles(imageInput)">
                <svg class="button-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M12 9v6" /><path d="M9 12h6" /></svg>
                補上圖片
              </AppButton>
            </div>
          </div>

          <div class="preview-table-wrap">
            <table class="preview-table">
              <thead>
                <tr>
                  <th class="status-col">狀態</th>
                  <th class="index-col">列</th>
                  <th>商品名稱</th>
                  <th>商品類型</th>
                  <th>日幣成本</th>
                  <th>售價</th>
                  <th>庫存狀態</th>
                  <th>圖片</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in visibleRows" :key="row.rowNumber" :class="`is-${getRowStatus(row)}`">
                  <td class="status-col">
                    <span
                      class="row-status"
                      :class="`row-status--${getRowStatus(row)}`"
                      role="img"
                      :aria-label="statusLabels[getRowStatus(row)]"
                      :title="statusLabels[getRowStatus(row)]"
                    >
                      <svg v-if="getRowStatus(row) === 'ok'" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" /></svg>
                      <svg v-else-if="getRowStatus(row) === 'error'" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12" /><path d="M18 6 6 18" /></svg>
                      <svg v-else viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 2.5 20h19Z" /><path d="M12 10v4" /><path d="M12 17h.01" /></svg>
                    </span>
                  </td>
                  <td class="index-col" :title="`Excel 第 ${row.rowNumber} 列`">{{ getDisplayIndex(row) }}</td>
                  <td class="name-cell">
                    <span class="product-name">{{ row.name || '（空白）' }}</span>
                    <ul v-if="row.errors.length || row.warnings.length" class="row-messages">
                      <li v-for="message in row.errors" :key="`e-${message}`" class="is-error">{{ message }}</li>
                      <li v-for="message in row.warnings" :key="`w-${message}`" class="is-warning">{{ message }}</li>
                    </ul>
                  </td>
                  <td><span v-if="row.productTypeName" class="type-badge">{{ row.productTypeName }}</span><span v-else>-</span></td>
                  <td class="money-cell">¥ {{ formatNumber(row.japanCost) }}</td>
                  <td class="money-cell">
                    NT$ {{ formatNumber(row.price) }}
                    <small v-if="row.isPriceCalculated" class="calculated">自動計算</small>
                  </td>
                  <td>
                    <span class="type-badge" :class="{ 'is-out': row.isOutStock }">{{ row.isOutStock ? '缺貨' : '尚有庫存' }}</span>
                  </td>
                  <td>
                    <div v-if="row.imageFileNames.length" class="thumbs">
                      <template v-for="(fileName, index) in row.imageFileNames" :key="fileName">
                        <span v-if="row.missingImageFileNames.includes(fileName)" class="thumb thumb--missing" :title="`找不到 ${fileName}`">缺</span>
                        <span v-else class="thumb" :class="{ 'thumb--main': index === 0 }" :title="fileName">
                          <img v-if="getThumbnailUrl(fileName)" :src="getThumbnailUrl(fileName)" :alt="fileName" loading="lazy" />
                        </span>
                      </template>
                    </div>
                    <span v-else class="muted">-</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p v-if="preview.unusedImageFileNames.length" class="unused-images">
            有 {{ preview.unusedImageFileNames.length }} 張圖片沒有對應到任何商品，不會上傳：
            {{ preview.unusedImageFileNames.slice(0, 5).join('、') }}<template v-if="preview.unusedImageFileNames.length > 5">…</template>
          </p>
        </div>

        <div v-else-if="step === IMPORT_STEPS.result" class="result-step" aria-live="polite">
          <template v-if="isImporting">
            <strong class="result-title">{{ progressText }}</strong>
            <div class="progress-track" role="progressbar" aria-label="匯入進度" :aria-valuenow="progress.percent" aria-valuemin="0" aria-valuemax="100">
              <div class="progress-fill" :style="{ width: `${progress.phase === 'save' ? 100 : progress.percent}%` }" :class="{ 'is-saving': progress.phase === 'save' }"></div>
            </div>
            <span class="muted">請勿關閉視窗</span>
          </template>
          <template v-else-if="result">
            <span class="result-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="m5 12 5 5 9-10" /></svg>
            </span>
            <strong class="result-title">已匯入 {{ result.createdCount }} 個商品、{{ result.imageCount }} 張圖片</strong>
            <span v-if="result.noImageCount" class="muted">其中 {{ result.noImageCount }} 個商品沒有圖片，可在商品列表點「編輯」補上。</span>
          </template>
          <template v-else>
            <strong class="result-title">匯入失敗，沒有任何商品被新增</strong>
          </template>
        </div>
      </div>

      <MessageBlock v-if="errorMessage" role="alert">{{ errorMessage }}</MessageBlock>
      <MessageBlock v-else-if="noticeMessage" tone="success" module="product">{{ noticeMessage }}</MessageBlock>

      <div class="dialog-actions" :class="{ 'dialog-actions--preview': step !== IMPORT_STEPS.result }">
        <template v-if="step === IMPORT_STEPS.select">
          <span class="actions-spacer"></span>
          <AppButton pill @click="close">取消</AppButton>
          <button
            class="round-action round-action--primary"
            type="button"
            :aria-label="isPreviewing ? '檢查中…' : '下一步：檢查資料'"
            :title="isPreviewing ? '檢查中…' : '下一步：檢查資料'"
            :aria-busy="isPreviewing"
            :disabled="!canPreview"
            @click="runPreview"
          >
            <span v-if="isPreviewing" class="round-action-spinner" aria-hidden="true"></span>
            <svg v-else viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
          </button>
        </template>

        <template v-else-if="step === IMPORT_STEPS.preview">
          <button
            class="round-action"
            type="button"
            aria-label="上一步"
            title="上一步"
            :disabled="isBusy"
            @click="backToSelect"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5" /><path d="m11 18-6-6 6-6" /></svg>
          </button>
          <span class="actions-spacer"></span>
          <span class="confirm-hint" :class="{ 'is-error': hasErrors }">{{ isPreviewing ? '重新檢查中…' : confirmHint }}</span>
          <button
            class="round-action round-action--primary"
            type="button"
            :aria-label="confirmLabel"
            :title="confirmLabel"
            :disabled="!canImport"
            @click="confirmImport"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5 9-10" /></svg>
          </button>
        </template>

        <template v-else>
          <AppButton v-if="!isImporting && !result" pill @click="backToPreview">回到預覽</AppButton>
          <span class="actions-spacer"></span>
          <AppButton variant="primary" pill elevated :disabled="isImporting" @click="close">
            {{ result ? '完成' : '關閉' }}
          </AppButton>
        </template>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss" src="../styles/product-import-dialog.scss"></style>
