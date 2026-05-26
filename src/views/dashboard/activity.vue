<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  copyActivity as copyActivityApi,
  createActivity as createActivityApi,
  deleteActivity as deleteActivityApi,
  listActivities as listActivitiesApi,
  listActivityTypes as listActivityTypesApi,
  listAnimateTypes as listAnimateTypesApi,
  listDeletedActivities as listDeletedActivitiesApi,
  restoreActivity as restoreActivityApi,
  updateActivity as updateActivityApi,
} from '@/api/activities'
import ActivityDeleteConfirmDialog from '@/components/activities/ActivityDeleteConfirmDialog.vue'
import ActivityFormDialog from '@/components/activities/ActivityFormDialog.vue'
import ActivityNoteDialog from '@/components/activities/ActivityNoteDialog.vue'
import ActivityTable from '@/components/activities/ActivityTable.vue'
import ActivityTrashDialog from '@/components/activities/ActivityTrashDialog.vue'
import CustomSelect from '@/components/activities/CustomSelect.vue'
import DateRangePicker from '@/components/activities/DateRangePicker.vue'
import CountBadge from '@/components/layout/CountBadge.vue'
import PageShell from '@/components/layout/PageShell.vue'
import PanelCard from '@/components/layout/PanelCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import IconButton from '@/components/ui/IconButton.vue'
import MessageBlock from '@/components/ui/MessageBlock.vue'
import { useActivityRangePicker } from '@/composables/activities/useActivityRangePicker'
import { useImageUpload } from '@/composables/common/useImageUpload'
import { useTableSort } from '@/composables/common/useTableSort'
import { getAdminToken } from '@/stores/authSession'
import {
  ActivityEnum,
  activityStatusOptions,
  dateTimeToIso,
  mapActivityFromApi,
  normalizeActivityStatus,
  toActivityStatusText,
  toInputDateTime,
} from '@/utils/activities/activityMapper'
import {
  createEmptyActivityFilters,
  hasActiveActivityFilters,
  matchesActivityFilters,
} from '@/utils/activities/activityFilters'
import { sanitizeHtml, stripHtml } from '@/utils/html'

const router = useRouter()
const trashIconPaths = [
  'M9 3h6',
  'M4 7h16',
  'M6 7l1 14h10l1-14',
  'M10 11v6',
  'M14 11v6',
]
const plusIconPaths = [
  'M12 5v14',
  'M5 12h14',
]
const activityTitleIconPaths = [
  'M8 3v4',
  'M16 3v4',
  'M4 9h16',
  'M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z',
]
const editIconPaths = [
  'M12 20h9',
  'M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z',
]
const copyIconPaths = [
  'M8 8h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z',
  'M5 16H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1',
]
const productIconPaths = [
  'M5 10h14',
  'M6 10l1.2-5h9.6L18 10',
  'M7 10v10h10V10',
  'M10 20v-6h4v6',
  'M9 5V3h6v2',
  'M8 13h8',
]

const isDialogOpen = ref(false)
const isTrashDialogOpen = ref(false)
const editingActivityId = ref(null)
const editingActivity = ref(null)
const activities = ref([])
const deletedActivities = ref([])
const activityTypes = ref([])
const animateTypes = ref([])
const isLoading = ref(false)
const isLoadingDeletedActivities = ref(false)
const isLoadingActivityTypes = ref(false)
const isLoadingAnimateTypes = ref(false)
const isSaving = ref(false)
const copyingActivityId = ref(null)
const deletingActivityId = ref(null)
const restoringActivityId = ref(null)
const statusMessage = ref('')
const errorMessage = ref('')
const trashErrorMessage = ref('')
const openSelectKey = ref('')
const openFilterSelectKey = ref('')
const isNoteDialogOpen = ref(false)
const selectedNoteActivity = ref(null)
const isDeleteConfirmDialogOpen = ref(false)
const pendingDeleteActivity = ref(null)
const deleteConfirmResolver = ref(null)
const isAnyDialogOpen = computed(
  () =>
    isDialogOpen.value ||
    isTrashDialogOpen.value ||
    isNoteDialogOpen.value ||
    isDeleteConfirmDialogOpen.value,
)

const emptyForm = {
  activityStartDate: '',
  activityEndDate: '',
  prepStartDate: '',
  prepEndDate: '',
  name: '',
  imageUrl: '',
  address: '',
  activityTypeId: '',
  animateTypeId: '',
  info: '',
  status: ActivityEnum.NotStarted,
  isPreOrder: false,
}

const form = reactive({ ...emptyForm })
const searchFilters = reactive(createEmptyActivityFilters())
const filterRangeFieldKeys = {
  activity: {
    start: 'activityDateStart',
    end: 'activityDateEnd',
  },
  prep: {
    start: 'prepDateStart',
    end: 'prepDateEnd',
  },
}
const pageSizeOptions = [10, 20, 50]
const pagination = reactive({
  page: 1,
  pageSize: pageSizeOptions[0],
})

const {
  calendarWeekdays,
  openRangeKey,
  isRangeOpen,
  toggleRangePicker,
  closeRangePicker,
  getRangeMonthLabel,
  shiftRangeMonth,
  getRangeCalendarDays,
  isRangeDayStart,
  isRangeDayEnd,
  isRangeDayInRange,
  isRangeDaySelected,
  getRangeStartLabel,
  getRangeEndLabel,
  getActivityRangeLabel,
  getPrepRangeLabel,
  selectRangeDate,
} = useActivityRangePicker(form, {
  onToggle: () => {
    openSelectKey.value = ''
  },
})

const {
  openRangeKey: openFilterRangeKey,
  isRangeOpen: isFilterRangeOpen,
  toggleRangePicker: toggleFilterRangePicker,
  closeRangePicker: closeFilterRangePicker,
  getRangeMonthLabel: getFilterRangeMonthLabel,
  shiftRangeMonth: shiftFilterRangeMonth,
  getRangeCalendarDays: getFilterRangeCalendarDays,
  isRangeDayStart: isFilterRangeDayStart,
  isRangeDayEnd: isFilterRangeDayEnd,
  isRangeDayInRange: isFilterRangeDayInRange,
  isRangeDaySelected: isFilterRangeDaySelected,
  getRangeStartLabel: getFilterRangeStartLabel,
  getRangeEndLabel: getFilterRangeEndLabel,
  getActivityRangeLabel: getFilterActivityRangeLabel,
  getPrepRangeLabel: getFilterPrepRangeLabel,
  selectRangeDate: selectFilterRangeDate,
} = useActivityRangePicker(searchFilters, {
  rangeFieldKeys: filterRangeFieldKeys,
  onToggle: () => {
    openFilterSelectKey.value = ''
  },
})

const {
  selectedImageFile,
  imagePreview: activityImagePreview,
  clearImagePreview,
  resetImageUpload,
  onImageChange: onActivityImageChange,
} = useImageUpload({
  existingImageUrl: () => form.imageUrl,
  invalidTypeMessage: '活動圖片僅支援圖片檔。',
  maxBytesMessage: '活動圖片不可超過 5MB。',
  onError: (message) => {
    errorMessage.value = message
  },
})
const selectedNoteHtml = computed(() => sanitizeHtml(selectedNoteActivity.value?.info || ''))
const selectedNoteTitle = computed(() => selectedNoteActivity.value?.name || '活動備註')

const setDialogScrollLock = (isLocked) => {
  if (typeof document === 'undefined') return

  document.body.classList.toggle('dialog-scroll-locked', isLocked)
}

const getActivityTypeName = (activityTypeId) => {
  if (!activityTypeId) return '-'

  const matchedType = activityTypes.value.find((type) => Number(type.id) === Number(activityTypeId))
  return matchedType?.name || `#${activityTypeId}`
}

const getAnimateTypeName = (animateTypeId) => {
  if (!animateTypeId) return '-'

  const matchedType = animateTypes.value.find((type) => Number(type.id) === Number(animateTypeId))
  return matchedType?.name || `#${animateTypeId}`
}

const isTypeSelected = (key, id) => searchFilters[key].includes(id)

const getSelectedTypeLabel = (key, options, placeholder) => {
  const selectedIds = searchFilters[key].map(Number)
  if (!selectedIds.length) return placeholder

  const selectedNames = options
    .filter((option) => selectedIds.includes(Number(option.id)))
    .map((option) => option.name || `#${option.id}`)

  if (selectedNames.length <= 2) {
    return selectedNames.join('、')
  }

  return `已選 ${selectedNames.length} 項`
}

const getFilterActivityTypeLabel = () => {
  if (isLoadingActivityTypes.value) return '讀取活動類型中...'
  return getSelectedTypeLabel('activityTypeIds', activityTypes.value, '請選擇活動類型')
}

const getFilterAnimateTypeLabel = () => {
  if (isLoadingAnimateTypes.value) return '讀取動漫中...'
  return getSelectedTypeLabel('animateTypeIds', animateTypes.value, '請選擇動漫')
}

const isFilterSelectOpen = (key) => openFilterSelectKey.value === key

const toggleFilterSelect = (key, disabled = false) => {
  if (disabled) return

  openFilterRangeKey.value = ''
  openFilterSelectKey.value = isFilterSelectOpen(key) ? '' : key
}

const toggleFilterType = (key, id) => {
  const nextValues = new Set(searchFilters[key])
  if (nextValues.has(id)) {
    nextValues.delete(id)
  } else {
    nextValues.add(id)
  }

  searchFilters[key] = Array.from(nextValues)
}

const clearFilterType = (key) => {
  searchFilters[key] = []
}

const clearSearchFilters = () => {
  Object.assign(searchFilters, createEmptyActivityFilters())
  openFilterSelectKey.value = ''
  openFilterRangeKey.value = ''
  pagination.page = 1
}

const activityTableColumns = [
  {
    key: 'activityPeriod',
    label: '活動期間',
    sortable: true,
    getValue: (activity) => `${activity.activityStartDate || ''} ${activity.activityEndDate || ''}`,
  },
  {
    key: 'name',
    label: '活動名稱',
    sortable: true,
    getValue: (activity) => activity.name || '',
  },
  {
    key: 'image',
    label: '活動圖片',
    sortable: true,
    getValue: (activity) => activity.image || '',
  },
  {
    key: 'address',
    label: '活動地址',
    sortable: true,
    getValue: (activity) => activity.address || '',
  },
  {
    key: 'status',
    label: '活動狀態',
    sortable: true,
    getValue: (activity) => activity.statusText || '',
  },
  {
    key: 'preOrder',
    label: '活動模式',
    sortable: true,
    getValue: (activity) => activity.preOrderText || '',
  },
  {
    key: 'activityType',
    label: '活動類型',
    sortable: true,
    getValue: (activity) => getActivityTypeName(activity.activityTypeId),
  },
  {
    key: 'animateType',
    label: '動漫',
    sortable: true,
    getValue: (activity) => getAnimateTypeName(activity.animateTypeId),
  },
  {
    key: 'prepPeriod',
    label: '準備期間',
    sortable: true,
    getValue: (activity) => `${activity.prepStartDate || ''} ${activity.prepEndDate || ''}`,
  },
  {
    key: 'info',
    label: '備註',
    sortable: true,
    getValue: (activity) => stripHtml(activity.info),
  },
  {
    key: 'actions',
    label: '操作',
    sortable: false,
  },
]

const filteredActivities = computed(() =>
  activities.value.filter((activity) => matchesActivityFilters(activity, searchFilters)),
)

const hasFiltersApplied = computed(() => hasActiveActivityFilters(searchFilters))
const filteredActivitiesCount = computed(() => filteredActivities.value.length)
const totalActivitiesLabel = computed(() =>
  hasFiltersApplied.value
    ? `${filteredActivitiesCount.value} / ${activities.value.length} 筆`
    : `${activities.value.length} 筆`,
)

const {
  sortedItems: sortedActivities,
  isSortActive: isActivitySortActive,
  toggleSort: toggleActivitySort,
  getSortAriaSort: getActivitySortAriaSort,
  getSortButtonLabel: getActivitySortButtonLabel,
  getSortIndicator: getActivitySortIndicator,
} = useTableSort(filteredActivities, activityTableColumns, {
  key: 'activityPeriod',
  direction: 'asc',
})

const totalPages = computed(() => Math.max(1, Math.ceil(sortedActivities.value.length / pagination.pageSize)))
const paginatedActivities = computed(() => {
  const startIndex = (pagination.page - 1) * pagination.pageSize
  return sortedActivities.value.slice(startIndex, startIndex + pagination.pageSize)
})
const paginationSummary = computed(() => {
  if (!sortedActivities.value.length) return '目前沒有符合條件的活動'

  const start = (pagination.page - 1) * pagination.pageSize + 1
  const end = Math.min(start + pagination.pageSize - 1, sortedActivities.value.length)
  return `第 ${start}-${end} 筆，共 ${sortedActivities.value.length} 筆`
})

const padDatePart = (value) => String(value).padStart(2, '0')

const toFilterDisplayDate = (value) => {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`
}

const getFilterRangeLabel = (startValue, endValue) => {
  const startLabel = toFilterDisplayDate(startValue)
  const endLabel = toFilterDisplayDate(endValue)

  if (!startLabel && !endLabel) return '請選擇開始與結束時間'
  if (!startLabel) return `未選開始 ~ ${endLabel}`
  if (!endLabel) return `${startLabel} ~ 未選結束`
  return `${startLabel} ~ ${endLabel}`
}

const filterActivityRangeLabel = computed(() =>
  getFilterRangeLabel(searchFilters.activityDateStart, searchFilters.activityDateEnd),
)

const filterPrepRangeLabel = computed(() =>
  getFilterRangeLabel(searchFilters.prepDateStart, searchFilters.prepDateEnd),
)

const filterActivityStartLabel = computed(() => toFilterDisplayDate(searchFilters.activityDateStart) || '未選擇')
const filterActivityEndLabel = computed(() => toFilterDisplayDate(searchFilters.activityDateEnd) || '未選擇')
const filterPrepStartLabel = computed(() => toFilterDisplayDate(searchFilters.prepDateStart) || '未選擇')
const filterPrepEndLabel = computed(() => toFilterDisplayDate(searchFilters.prepDateEnd) || '未選擇')

const goToPage = (page) => {
  pagination.page = Math.min(Math.max(page, 1), totalPages.value)
}

const goToPreviousPage = () => goToPage(pagination.page - 1)

const goToNextPage = () => goToPage(pagination.page + 1)

const handleFormRangeSelect = (key, date) => {
  const isRangeCompleted = selectRangeDate(key, date)
  if (isRangeCompleted) {
    closeRangePicker()
  }
}

const handleFilterRangeSelect = (key, date) => {
  const isRangeCompleted = selectFilterRangeDate(key, date)
  if (isRangeCompleted) {
    closeFilterRangePicker()
  }
}

const getActivityTypeSelectLabel = () => {
  if (isLoadingActivityTypes.value) return '讀取活動類型中...'
  return form.activityTypeId ? getActivityTypeName(form.activityTypeId) : '請選擇活動類型'
}

const getAnimateTypeSelectLabel = () => {
  if (isLoadingAnimateTypes.value) return '讀取動漫中...'
  return form.animateTypeId ? getAnimateTypeName(form.animateTypeId) : '請選擇動漫'
}

const getStatusSelectLabel = () => toActivityStatusText(form.status)

const isSelectOpen = (key) => openSelectKey.value === key

const toggleCustomSelect = (key, disabled = false) => {
  if (disabled) return
  openRangeKey.value = ''
  openSelectKey.value = isSelectOpen(key) ? '' : key
}

const selectCustomOption = (key, value) => {
  form[key] = value
  openSelectKey.value = ''
}

const resetForm = () => {
  resetImageUpload()
  Object.assign(form, emptyForm)
  editingActivityId.value = null
  editingActivity.value = null
  openSelectKey.value = ''
  openRangeKey.value = ''
}

const loadActivities = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const responseActivities = await listActivitiesApi()
    activities.value = responseActivities.map(mapActivityFromApi)
  } catch (err) {
    errorMessage.value = err.message || '讀取活動資料失敗。'
  } finally {
    isLoading.value = false
  }
}

const loadDeletedActivities = async () => {
  isLoadingDeletedActivities.value = true
  trashErrorMessage.value = ''

  try {
    const responseActivities = await listDeletedActivitiesApi()
    deletedActivities.value = responseActivities.map(mapActivityFromApi)
  } catch (err) {
    trashErrorMessage.value = err.message || '讀取已刪除活動失敗。'
  } finally {
    isLoadingDeletedActivities.value = false
  }
}

const loadActivityTypes = async () => {
  isLoadingActivityTypes.value = true

  try {
    activityTypes.value = await listActivityTypesApi()
  } catch (err) {
    errorMessage.value = err.message || '讀取活動類型失敗。'
  } finally {
    isLoadingActivityTypes.value = false
  }
}

const loadAnimateTypes = async () => {
  isLoadingAnimateTypes.value = true

  try {
    animateTypes.value = await listAnimateTypesApi()
  } catch (err) {
    errorMessage.value = err.message || '讀取動漫失敗。'
  } finally {
    isLoadingAnimateTypes.value = false
  }
}

const openCreateDialog = () => {
  resetForm()
  statusMessage.value = ''
  errorMessage.value = ''
  isDialogOpen.value = true
}

const openEditDialog = (activity) => {
  const raw = activity.raw || {}
  resetForm()
  editingActivityId.value = activity.id
  editingActivity.value = activity
  Object.assign(form, {
    activityStartDate: toInputDateTime(raw.activeStartTime),
    activityEndDate: toInputDateTime(raw.activeEndTime),
    prepStartDate: toInputDateTime(raw.prepareStartTime),
    prepEndDate: toInputDateTime(raw.prepareEndTime),
    name: raw.name || '',
    imageUrl: raw.imageUrl || '',
    address: raw.address || '',
    activityTypeId: raw.activityTypeId || '',
    animateTypeId: raw.animateTypeId || '',
    info: raw.info || '',
    status: normalizeActivityStatus(raw.status),
    isPreOrder: raw.isPreOrder === true,
  })
  statusMessage.value = ''
  errorMessage.value = ''
  isDialogOpen.value = true
}

const openTrashDialog = () => {
  if (!getAdminToken()) {
    errorMessage.value = '登入狀態已失效，請重新登入後再查看垃圾桶。'
    return
  }

  statusMessage.value = ''
  errorMessage.value = ''
  trashErrorMessage.value = ''
  isTrashDialogOpen.value = true
  loadDeletedActivities()
}

const closeDialog = () => {
  isDialogOpen.value = false
  resetImageUpload()
  editingActivityId.value = null
  editingActivity.value = null
  openSelectKey.value = ''
  openRangeKey.value = ''
}

const openNoteDialog = (activity) => {
  if (!stripHtml(activity.info)) return
  selectedNoteActivity.value = activity
  isNoteDialogOpen.value = true
}

const closeNoteDialog = () => {
  isNoteDialogOpen.value = false
  selectedNoteActivity.value = null
}

const closeTrashDialog = () => {
  isTrashDialogOpen.value = false
  trashErrorMessage.value = ''
  restoringActivityId.value = null
}

const requestDeleteConfirm = (activity) =>
  new Promise((resolve) => {
    if (deleteConfirmResolver.value) {
      deleteConfirmResolver.value(false)
    }

    pendingDeleteActivity.value = activity
    deleteConfirmResolver.value = resolve
    isDeleteConfirmDialogOpen.value = true
  })

const resolveDeleteConfirm = (result) => {
  if (deleteConfirmResolver.value) {
    deleteConfirmResolver.value(result)
  }

  deleteConfirmResolver.value = null
  pendingDeleteActivity.value = null
  isDeleteConfirmDialogOpen.value = false
}

const appendIfValue = (formData, key, value) => {
  if (value !== undefined && value !== null && value !== '') {
    formData.append(key, value)
  }
}

const isBlankValue = (value) => value === undefined || value === null || String(value).trim() === ''

const formatRequiredFieldsMessage = (fields) => `請填寫：${fields.join('、')}。`

const validateActivityForm = () => {
  const missingFields = []

  if (isBlankValue(form.activityStartDate) || isBlankValue(form.activityEndDate)) {
    missingFields.push('活動時間')
  }

  if (isBlankValue(form.prepStartDate) || isBlankValue(form.prepEndDate)) {
    missingFields.push('準備時間')
  }

  if (isBlankValue(form.name)) missingFields.push('活動名稱')
  if (!selectedImageFile.value && isBlankValue(form.imageUrl)) missingFields.push('活動圖片')
  if (isBlankValue(form.address)) missingFields.push('活動地址')
  if (isBlankValue(form.activityTypeId)) missingFields.push('活動類型')
  if (isBlankValue(form.animateTypeId)) missingFields.push('動漫')

  const hasValidStatus = activityStatusOptions.some(
    (statusOption) => Number(statusOption.value) === Number(form.status),
  )
  if (!hasValidStatus) missingFields.push('活動狀態')

  if (missingFields.length) {
    errorMessage.value = formatRequiredFieldsMessage(missingFields)
    return false
  }

  return true
}

const buildActivityFormData = (activityId = null) => {
  const formData = new FormData()

  appendIfValue(formData, 'id', activityId)
  appendIfValue(formData, 'name', form.name.trim())
  appendIfValue(formData, 'activeStartTime', dateTimeToIso(form.activityStartDate))
  appendIfValue(formData, 'activeEndTime', dateTimeToIso(form.activityEndDate))
  appendIfValue(formData, 'prepareStartTime', dateTimeToIso(form.prepStartDate))
  appendIfValue(formData, 'prepareEndTime', dateTimeToIso(form.prepEndDate))
  appendIfValue(formData, 'address', form.address.trim())
  appendIfValue(formData, 'activityTypeId', form.activityTypeId)
  appendIfValue(formData, 'animateTypeId', form.animateTypeId)
  appendIfValue(formData, 'info', sanitizeHtml(form.info).trim())
  appendIfValue(formData, 'status', form.status)
  formData.append('isPreOrder', form.isPreOrder ? 'true' : 'false')
  if (selectedImageFile.value) {
    formData.append('imageFile', selectedImageFile.value)
  } else {
    appendIfValue(formData, 'imageUrl', form.imageUrl)
  }

  return formData
}

const saveActivity = async () => {
  if (!validateActivityForm()) {
    return
  }

  if (!getAdminToken()) {
    errorMessage.value = '找不到登入管理員資訊，請重新登入後再儲存活動。'
    return
  }

  isSaving.value = true
  errorMessage.value = ''
  statusMessage.value = ''

  try {
    const formData = buildActivityFormData(editingActivityId.value)
    const response = editingActivityId.value
      ? await updateActivityApi(formData)
      : await createActivityApi(formData)
    const savedActivity = mapActivityFromApi(response?.data)

    if (editingActivityId.value) {
      activities.value = activities.value.map((activity) =>
        activity.id === editingActivityId.value ? savedActivity : activity,
      )
      statusMessage.value = '編輯活動成功。'
    } else {
      activities.value.unshift(savedActivity)
      statusMessage.value = '新增活動成功。'
    }

    closeDialog()
  } catch (err) {
    errorMessage.value = err.message || '儲存活動失敗。'
  } finally {
    isSaving.value = false
  }
}

const copyActivity = async (activity) => {
  if (copyingActivityId.value !== null) {
    return
  }

  if (!getAdminToken()) {
    errorMessage.value = '登入狀態已失效，請重新登入後再複製活動。'
    return
  }

  copyingActivityId.value = activity.id
  errorMessage.value = ''
  statusMessage.value = ''

  try {
    const response = await copyActivityApi(activity.id)
    const copiedActivity = mapActivityFromApi(response?.data)
    activities.value.unshift(copiedActivity)
    statusMessage.value = '複製活動成功。'
  } catch (err) {
    errorMessage.value = err.message || '複製活動失敗。'
  } finally {
    copyingActivityId.value = null
  }
}

const deleteActivity = async (activity) => {
  if (!getAdminToken()) {
    errorMessage.value = '登入狀態已失效，請重新登入後再刪除活動。'
    return false
  }

  const shouldDelete = await requestDeleteConfirm(activity)
  if (!shouldDelete) {
    return false
  }

  deletingActivityId.value = activity.id
  errorMessage.value = ''
  statusMessage.value = ''

  try {
    await deleteActivityApi(activity.id)
    activities.value = activities.value.filter((item) => item.id !== activity.id)
    statusMessage.value = '刪除活動成功。'
    return true
  } catch (err) {
    errorMessage.value = err.message || '刪除活動失敗。'
    return false
  } finally {
    deletingActivityId.value = null
  }
}

const deleteEditingActivity = async () => {
  if (!editingActivityId.value) return

  const wasDeleted = await deleteActivity(
    editingActivity.value || {
      id: editingActivityId.value,
      name: form.name,
    },
  )

  if (wasDeleted) {
    closeDialog()
  }
}

const restoreActivity = async (activity) => {
  if (!getAdminToken()) {
    trashErrorMessage.value = '登入狀態已失效，請重新登入後再還原活動。'
    return
  }

  restoringActivityId.value = activity.id
  trashErrorMessage.value = ''
  statusMessage.value = ''

  try {
    const response = await restoreActivityApi(activity.id)
    const restoredActivity = mapActivityFromApi(response?.data)

    deletedActivities.value = deletedActivities.value.filter((item) => item.id !== activity.id)
    if (!activities.value.some((item) => item.id === restoredActivity.id)) {
      activities.value.unshift(restoredActivity)
    }
    statusMessage.value = '還原活動成功。'
  } catch (err) {
    trashErrorMessage.value = err.message || '還原活動失敗。'
  } finally {
    restoringActivityId.value = null
  }
}

const openProductManagement = (activity) => {
  router.push({
    name: 'ActivityProducts',
    params: { activityId: activity.id },
  })
}

onMounted(() => {
  loadActivities()
  loadActivityTypes()
  loadAnimateTypes()
})

watch(
  searchFilters,
  () => {
    pagination.page = 1
  },
  { deep: true },
)

watch(
  () => pagination.pageSize,
  () => {
    pagination.page = 1
  },
)

watch(totalPages, (nextTotalPages) => {
  if (pagination.page > nextTotalPages) {
    pagination.page = nextTotalPages
  }
})

watch(isAnyDialogOpen, setDialogScrollLock, { immediate: true })
onBeforeUnmount(() => {
  clearImagePreview()
  resolveDeleteConfirm(false)
  setDialogScrollLock(false)
})
</script>

<template>
  <PageShell class="activity-management-page">
    <MessageBlock v-if="statusMessage" tone="success">{{ statusMessage }}</MessageBlock>
    <MessageBlock v-if="errorMessage && !isDialogOpen">{{ errorMessage }}</MessageBlock>

    <PanelCard accent>
      <div class="activity-panel-heading">
        <div class="activity-page-title">
          <div class="activity-title-row">
            <span class="management-title-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path
                  v-for="path in activityTitleIconPaths"
                  :key="path"
                  :d="path"
                />
              </svg>
            </span>
            <h1>活動管理</h1>
          </div>
        </div>

        <div class="activity-panel-actions">
          <IconButton
            class="activity-toolbar-icon activity-toolbar-icon--create"
            variant="table"
            aria-label="新增活動"
            title="新增活動"
            @click="openCreateDialog"
          >
            <svg class="table-button-svg" viewBox="0 0 24 24" aria-hidden="true">
              <path
                v-for="path in plusIconPaths"
                :key="path"
                :d="path"
              />
            </svg>
          </IconButton>
          <IconButton
            class="activity-toolbar-icon activity-toolbar-icon--trash"
            variant="table"
            :disabled="isLoadingDeletedActivities"
            aria-label="垃圾桶"
            title="垃圾桶"
            @click="openTrashDialog"
          >
            <svg class="table-button-svg" viewBox="0 0 24 24" aria-hidden="true">
              <path
                v-for="path in trashIconPaths"
                :key="path"
                :d="path"
              />
            </svg>
          </IconButton>
          <CountBadge accent>{{ totalActivitiesLabel }}</CountBadge>
        </div>
      </div>

      <section class="activity-filter-panel" aria-label="活動搜尋條件">
        <div class="activity-filter-grid">
          <label class="activity-filter-field">
            <span>活動名稱</span>
            <input
              v-model.trim="searchFilters.name"
              type="text"
              placeholder="請輸入活動名稱"
            />
          </label>

          <label class="activity-filter-field">
            <span>地點</span>
            <input
              v-model.trim="searchFilters.address"
              type="text"
              placeholder="請輸入地點"
            />
          </label>

          <div class="activity-filter-field">
            <span>活動類型</span>
            <CustomSelect
              :label="getFilterActivityTypeLabel()"
              :open="isFilterSelectOpen('activityTypeIds')"
              :disabled="isLoadingActivityTypes"
              @toggle="toggleFilterSelect('activityTypeIds', isLoadingActivityTypes)"
            >
              <button class="custom-select-option custom-select-option--action" type="button" @click="clearFilterType('activityTypeIds')">
                清除活動類型
              </button>
              <label
                v-for="activityType in activityTypes"
                :key="activityType.id"
                class="custom-select-option custom-select-checkbox-option"
                :class="{ 'is-selected': isTypeSelected('activityTypeIds', activityType.id) }"
              >
                <input
                  :checked="isTypeSelected('activityTypeIds', activityType.id)"
                  type="checkbox"
                  @change="toggleFilterType('activityTypeIds', activityType.id)"
                />
                <span>{{ activityType.name || `#${activityType.id}` }}</span>
              </label>
            </CustomSelect>
          </div>

          <div class="activity-filter-field">
            <span>動漫</span>
            <CustomSelect
              :label="getFilterAnimateTypeLabel()"
              :open="isFilterSelectOpen('animateTypeIds')"
              :disabled="isLoadingAnimateTypes"
              @toggle="toggleFilterSelect('animateTypeIds', isLoadingAnimateTypes)"
            >
              <button class="custom-select-option custom-select-option--action" type="button" @click="clearFilterType('animateTypeIds')">
                清除動漫
              </button>
              <label
                v-for="animateType in animateTypes"
                :key="animateType.id"
                class="custom-select-option custom-select-checkbox-option"
                :class="{ 'is-selected': isTypeSelected('animateTypeIds', animateType.id) }"
              >
                <input
                  :checked="isTypeSelected('animateTypeIds', animateType.id)"
                  type="checkbox"
                  @change="toggleFilterType('animateTypeIds', animateType.id)"
                />
                <span>{{ animateType.name || `#${animateType.id}` }}</span>
              </label>
            </CustomSelect>
          </div>

          <DateRangePicker
            label="活動時間"
            :open="isFilterRangeOpen('activity')"
            :range-label="filterActivityRangeLabel"
            :month-label="getFilterRangeMonthLabel('activity')"
            :weekdays="calendarWeekdays"
            :days="getFilterRangeCalendarDays('activity')"
            :start-label="filterActivityStartLabel"
            :end-label="filterActivityEndLabel"
            :is-day-start="(date) => isFilterRangeDayStart('activity', date)"
            :is-day-end="(date) => isFilterRangeDayEnd('activity', date)"
            :is-day-in-range="(date) => isFilterRangeDayInRange('activity', date)"
            :is-day-selected="(date) => isFilterRangeDaySelected('activity', date)"
            @toggle="toggleFilterRangePicker('activity')"
            @shift="shiftFilterRangeMonth('activity', $event)"
            @select="handleFilterRangeSelect('activity', $event)"
            @close="closeFilterRangePicker()"
          />

          <DateRangePicker
            label="準備時間"
            :open="isFilterRangeOpen('prep')"
            :range-label="filterPrepRangeLabel"
            :month-label="getFilterRangeMonthLabel('prep')"
            :weekdays="calendarWeekdays"
            :days="getFilterRangeCalendarDays('prep')"
            :start-label="filterPrepStartLabel"
            :end-label="filterPrepEndLabel"
            :is-day-start="(date) => isFilterRangeDayStart('prep', date)"
            :is-day-end="(date) => isFilterRangeDayEnd('prep', date)"
            :is-day-in-range="(date) => isFilterRangeDayInRange('prep', date)"
            :is-day-selected="(date) => isFilterRangeDaySelected('prep', date)"
            @toggle="toggleFilterRangePicker('prep')"
            @shift="shiftFilterRangeMonth('prep', $event)"
            @select="handleFilterRangeSelect('prep', $event)"
            @close="closeFilterRangePicker()"
          />
        </div>

        <div class="activity-filter-actions">
          <div class="activity-filter-summary">
            {{ hasFiltersApplied ? `篩選後 ${filteredActivitiesCount} 筆` : '顯示全部活動' }}
          </div>
          <AppButton pill :disabled="!hasFiltersApplied" @click="clearSearchFilters">
            清除條件
          </AppButton>
        </div>
      </section>

      <ActivityTable
        :activities="paginatedActivities"
        :columns="activityTableColumns"
        :is-loading="isLoading"
        :copying-activity-id="copyingActivityId"
        :edit-icon-paths="editIconPaths"
        :copy-icon-paths="copyIconPaths"
        :product-icon-paths="productIconPaths"
        :get-activity-type-name="getActivityTypeName"
        :get-animate-type-name="getAnimateTypeName"
        :strip-html="stripHtml"
        :sanitize-html="sanitizeHtml"
        :is-sort-active="isActivitySortActive"
        :get-sort-aria-sort="getActivitySortAriaSort"
        :get-sort-button-label="getActivitySortButtonLabel"
        :get-sort-indicator="getActivitySortIndicator"
        @sort="toggleActivitySort"
        @open-note="openNoteDialog"
        @edit="openEditDialog"
        @copy="copyActivity"
        @manage-products="openProductManagement"
      />

      <div class="activity-pagination" aria-label="活動分頁">
        <div class="activity-pagination-summary">{{ paginationSummary }}</div>

        <div class="activity-pagination-actions">
          <label class="activity-page-size">
            <span>每頁</span>
            <select v-model.number="pagination.pageSize">
              <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
            </select>
          </label>

          <AppButton pill :disabled="pagination.page <= 1" @click="goToPreviousPage">
            上一頁
          </AppButton>
          <span class="activity-page-indicator">{{ pagination.page }} / {{ totalPages }}</span>
          <AppButton pill :disabled="pagination.page >= totalPages" @click="goToNextPage">
            下一頁
          </AppButton>
        </div>
      </div>
    </PanelCard>

    <ActivityFormDialog
      v-if="isDialogOpen"
      :form="form"
      :editing-activity-id="editingActivityId"
      :is-saving="isSaving"
      :deleting-activity-id="deletingActivityId"
      :error-message="errorMessage"
      :activity-types="activityTypes"
      :animate-types="animateTypes"
      :activity-status-options="activityStatusOptions"
      :is-loading-activity-types="isLoadingActivityTypes"
      :is-loading-animate-types="isLoadingAnimateTypes"
      :selected-image-file="selectedImageFile"
      :activity-image-preview="activityImagePreview"
      :calendar-weekdays="calendarWeekdays"
      :is-range-open="isRangeOpen"
      :get-activity-range-label="getActivityRangeLabel"
      :get-prep-range-label="getPrepRangeLabel"
      :get-range-month-label="getRangeMonthLabel"
      :get-range-calendar-days="getRangeCalendarDays"
      :is-range-day-start="isRangeDayStart"
      :is-range-day-end="isRangeDayEnd"
      :is-range-day-in-range="isRangeDayInRange"
      :is-range-day-selected="isRangeDaySelected"
      :get-range-start-label="getRangeStartLabel"
      :get-range-end-label="getRangeEndLabel"
      :is-select-open="isSelectOpen"
      :get-activity-type-select-label="getActivityTypeSelectLabel"
      :get-animate-type-select-label="getAnimateTypeSelectLabel"
      :get-status-select-label="getStatusSelectLabel"
      @close="closeDialog"
      @submit="saveActivity"
      @delete="deleteEditingActivity"
      @toggle-range="toggleRangePicker"
      @shift-range="shiftRangeMonth"
      @select-range-date="handleFormRangeSelect"
      @close-range="closeRangePicker"
      @toggle-select="toggleCustomSelect"
      @select-option="selectCustomOption"
      @image-change="onActivityImageChange"
    />

    <ActivityTrashDialog
      v-if="isTrashDialogOpen"
      :activities="deletedActivities"
      :is-loading="isLoadingDeletedActivities"
      :error-message="trashErrorMessage"
      :restoring-activity-id="restoringActivityId"
      @close="closeTrashDialog"
      @restore="restoreActivity"
    />

    <ActivityNoteDialog
      v-if="isNoteDialogOpen"
      :title="selectedNoteTitle"
      :html="selectedNoteHtml"
      @close="closeNoteDialog"
    />

    <ActivityDeleteConfirmDialog
      v-if="isDeleteConfirmDialogOpen"
      :activity="pendingDeleteActivity"
      @close="resolveDeleteConfirm(false)"
      @confirm="resolveDeleteConfirm(true)"
    />
  </PageShell>
</template>

<style scoped>
.activity-management-page {
  gap: 18px;
}

.activity-panel-heading {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 18px;
  border-bottom: 1px solid #f0e5dc;
  padding-bottom: 20px;
}

.activity-page-title {
  min-width: 0;
}

.activity-title-row {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
}

.management-title-icon {
  display: grid;
  width: 46px;
  height: 46px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 14px;
  background: color-mix(in srgb, #b84d55 13%, #ffffff);
  color: #b84d55;
}

.management-title-icon svg {
  width: 26px;
  height: 26px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.9;
}

.activity-page-title h1 {
  margin: 0;
  color: #13201c;
  font-size: 1.8rem;
  line-height: 1.2;
}

.activity-panel-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.activity-toolbar-icon.activity-toolbar-icon--create {
  border-color: #b84d55;
  background: #b84d55;
  color: #ffffff;
}

.activity-toolbar-icon.activity-toolbar-icon--create:hover:not(:disabled) {
  border-color: #9d3e46;
  background: #9d3e46;
  color: #ffffff;
}

.activity-toolbar-icon.activity-toolbar-icon--trash {
  border-color: #d6dde3;
  background: #eef1f3;
  color: #4b5563;
}

.activity-toolbar-icon.activity-toolbar-icon--trash:hover:not(:disabled) {
  border-color: #b9c2ca;
  background: #e2e7ea;
  color: #374151;
}

.activity-filter-panel {
  display: grid;
  gap: 16px;
  margin-bottom: 20px;
  border: 1px solid #eaded2;
  border-radius: 14px;
  background: #fffdf9;
  padding: 18px;
}

.activity-filter-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.activity-filter-grid > :nth-child(2) {
  order: 4;
}

.activity-filter-grid > :nth-child(3) {
  order: 2;
}

.activity-filter-grid > :nth-child(4) {
  order: 3;
}

.activity-filter-grid > :nth-child(5) {
  order: 5;
}

.activity-filter-grid > :nth-child(6) {
  order: 6;
}

.activity-filter-grid > :deep(.date-range-field) {
  --date-range-label-color: #4e443d;
  --date-range-label-size: 0.92rem;
  --date-range-label-weight: 700;
  grid-column: auto;
}

.activity-filter-field {
  display: grid;
  gap: 8px;
  color: #4e443d;
  font-size: 0.92rem;
  font-weight: 700;
}

.activity-filter-field--full {
  grid-column: 1 / -1;
}

.activity-filter-field input,
.activity-page-size select {
  width: 100%;
  min-height: 44px;
  border: 1px solid #e2d2c7;
  border-radius: 10px;
  background: #fffaf4;
  color: #2a2825;
  padding: 0 12px;
}

.activity-filter-field input:focus,
.activity-page-size select:focus {
  border-color: #b84d55;
  box-shadow: 0 0 0 3px rgb(184 77 85 / 15%);
  outline: none;
}

.custom-select-checkbox-option {
  display: flex;
  min-height: 42px;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.custom-select-checkbox-option.is-selected {
  background: #f0faf4;
  color: #1f6154;
}

.custom-select-checkbox-option input {
  width: 16px;
  min-width: 16px;
  height: 16px;
  min-height: 16px;
  margin: 0;
  accent-color: #1f6154;
  cursor: pointer;
}

.custom-select-option--action {
  color: #8f3f47;
  font-weight: 800;
}

.custom-select-checkbox-option span {
  min-width: 0;
}

.activity-filter-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.activity-filter-summary {
  color: #5b514a;
  font-size: 0.92rem;
  font-weight: 700;
}

.activity-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-top: 18px;
}

.activity-pagination-summary {
  color: #5b514a;
  font-size: 0.92rem;
  font-weight: 700;
}

.activity-pagination-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.activity-page-size {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #4e443d;
  font-size: 0.92rem;
  font-weight: 700;
}

.activity-page-size select {
  width: 84px;
}

.activity-page-indicator {
  min-width: 64px;
  color: #384942;
  font-size: 0.92rem;
  font-weight: 800;
  text-align: center;
}

.table-button-svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.9;
}

@media (max-width: 560px) {
  .activity-page-title h1 {
    font-size: 1.45rem;
  }

  .activity-panel-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .activity-panel-actions {
    width: 100%;
    align-items: stretch;
    flex-direction: column;
  }

  .activity-filter-grid {
    grid-template-columns: 1fr;
  }

  .activity-filter-grid > * {
    order: initial;
  }

  .activity-filter-actions,
  .activity-pagination,
  .activity-pagination-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .activity-page-size {
    justify-content: space-between;
  }
}
</style>
