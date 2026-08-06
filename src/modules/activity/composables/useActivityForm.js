import { onBeforeUnmount, reactive, ref, watch } from 'vue'
import {
  copyActivity as copyActivityApi,
  createActivity as createActivityApi,
  updateActivity as updateActivityApi,
} from '@/modules/activity/api/activityApi'
import { useActivityRangePicker } from '@/modules/activity/composables/useActivityRangePicker'
import { useImageUpload } from '@/shared/composables/useImageUpload'
import {
  GroupBuyStatus,
  ShippingMode,
  deriveShareRule,
  mapActivityFromApi,
  toActivityStatusText,
} from '@/modules/activity/utils/activityMapper'
import {
  ACTIVITY_FORM_MODES,
  buildActivityFormDataFromEntries,
  buildActivityFormPayloadEntries,
  createEmptyActivityForm,
  formatActivityFormValidationMessage,
  getGroupBuyStatusForActivityKind,
  mapActivityToActivityFormValues,
  normalizeActivityFormValuesForMode,
  validateActivityFormValues,
} from '@/modules/activity/utils/activityFormRules'
import { getAdminToken } from '@/shared/stores/authSession'

// 活動新增／編輯／複製共用表單：管理 reactive form、圖片上傳與日期範圍選擇，
// 並負責驗證、建立 multipart payload 及儲存後更新共用活動清單。
// 類型名稱查詢、載入狀態及成功／錯誤訊息由頁面與 useActivityCrud 注入。
export const useActivityForm = ({
  activities,
  isLoadingActivityTypes,
  isLoadingAnimateTypes,
  statusMessage,
  errorMessage,
  getActivityTypeName,
  getAnimateTypeName,
}) => {
  const form = reactive(createEmptyActivityForm())
  const isDialogOpen = ref(false)
  const formMode = ref(ACTIVITY_FORM_MODES.create)
  const editingActivityId = ref(null)
  const editingActivity = ref(null)
  const copySourceActivityId = ref(null)
  const copySourceActivity = ref(null)
  const isSaving = ref(false)
  const openSelectKey = ref('')

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
    getOfficialShippingRangeLabel,
    selectRangeDate,
  } = useActivityRangePicker(form, {
    onToggle: () => {
      openSelectKey.value = ''
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

  const isCopyMode = () => formMode.value === ACTIVITY_FORM_MODES.copy
  const isCopyForcedSelectKey = (key) => isCopyMode() && ['status', 'groupBuyStatus'].includes(key)

  const toggleCustomSelect = (key, disabled = false) => {
    if (disabled || isCopyForcedSelectKey(key)) return
    openRangeKey.value = ''
    openSelectKey.value = isSelectOpen(key) ? '' : key
  }

  const selectCustomOption = (key, value) => {
    if (isCopyForcedSelectKey(key)) return

    form[key] = value
    openSelectKey.value = ''

    if (key === 'shippingMode') {
      form.shippingShareRule = deriveShareRule(value)
    }
  }

  watch(
    () => form.isPreOrder,
    (isPreOrder) => {
      if (!isPreOrder) {
        form.officialShippingStartDate = ''
        form.officialShippingEndDate = ''
        form.groupBuyStatus = GroupBuyStatus.NotRequired
        form.shippingMode = ShippingMode.NoShipping
        form.shippingShareRule = deriveShareRule(ShippingMode.NoShipping)
        form.allowCustomerShippingTopUp = false
      } else if (isCopyMode()) {
        form.groupBuyStatus = getGroupBuyStatusForActivityKind(true)
      } else if (form.groupBuyStatus === GroupBuyStatus.NotRequired) {
        form.groupBuyStatus = GroupBuyStatus.Recruiting
      }
    },
  )

  const handleFormRangeSelect = (key, date) => {
    const isRangeCompleted = selectRangeDate(key, date)
    if (isRangeCompleted) {
      closeRangePicker()
    }
  }

  const resetForm = () => {
    resetImageUpload()
    Object.assign(form, createEmptyActivityForm())
    formMode.value = ACTIVITY_FORM_MODES.create
    editingActivityId.value = null
    editingActivity.value = null
    copySourceActivityId.value = null
    copySourceActivity.value = null
    openSelectKey.value = ''
    openRangeKey.value = ''
  }

  const openCreateDialog = () => {
    resetForm()
    formMode.value = ACTIVITY_FORM_MODES.create
    statusMessage.value = ''
    errorMessage.value = ''
    isDialogOpen.value = true
  }

  const openEditDialog = (activity) => {
    resetForm()
    formMode.value = ACTIVITY_FORM_MODES.edit
    editingActivityId.value = activity.id
    editingActivity.value = activity
    Object.assign(form, mapActivityToActivityFormValues(activity, { mode: ACTIVITY_FORM_MODES.edit }))
    statusMessage.value = ''
    errorMessage.value = ''
    isDialogOpen.value = true
  }

  const openCopyDialog = (activity) => {
    resetForm()
    formMode.value = ACTIVITY_FORM_MODES.copy
    copySourceActivityId.value = activity.id
    copySourceActivity.value = activity
    Object.assign(form, mapActivityToActivityFormValues(activity, { mode: ACTIVITY_FORM_MODES.copy }))
    statusMessage.value = ''
    errorMessage.value = ''
    isDialogOpen.value = true
  }

  const closeDialog = () => {
    isDialogOpen.value = false
    resetImageUpload()
    formMode.value = ACTIVITY_FORM_MODES.create
    editingActivityId.value = null
    editingActivity.value = null
    copySourceActivityId.value = null
    copySourceActivity.value = null
    openSelectKey.value = ''
    openRangeKey.value = ''
  }

  const validateActivityForm = () => {
    const validation = validateActivityFormValues({
      form: normalizeActivityFormValuesForMode(form, formMode.value),
      hasSelectedImageFile: Boolean(selectedImageFile.value),
    })

    if (!validation.isValid) {
      errorMessage.value = formatActivityFormValidationMessage(validation)
      return false
    }

    return true
  }

  const buildActivityFormData = () =>
    buildActivityFormDataFromEntries(
      buildActivityFormPayloadEntries(form, {
        mode: formMode.value,
        activityId: editingActivityId.value,
        selectedImageFile: selectedImageFile.value,
      }),
    )

  const saveActivity = async () => {
    if (!validateActivityForm()) {
      return
    }

    if (!getAdminToken()) {
      errorMessage.value = '找不到登入管理員資訊，請重新登入後再儲存活動。'
      return
    }

    if (isCopyMode() && !copySourceActivityId.value) {
      errorMessage.value = '找不到來源活動，無法複製活動。'
      return
    }

    isSaving.value = true
    errorMessage.value = ''
    statusMessage.value = ''

    try {
      const formData = buildActivityFormData()
      const response =
        formMode.value === ACTIVITY_FORM_MODES.copy
          ? await copyActivityApi(copySourceActivityId.value, formData)
          : editingActivityId.value
            ? await updateActivityApi(formData)
            : await createActivityApi(formData)
      const savedActivity = mapActivityFromApi(response?.data)

      if (formMode.value === ACTIVITY_FORM_MODES.edit) {
        activities.value = activities.value.map((activity) =>
          activity.id === editingActivityId.value ? savedActivity : activity,
        )
        statusMessage.value = '編輯活動成功。'
      } else if (formMode.value === ACTIVITY_FORM_MODES.copy) {
        activities.value.unshift(savedActivity)
        statusMessage.value = '複製活動成功。'
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

  onBeforeUnmount(() => {
    clearImagePreview()
  })

  return {
    form,
    formMode,
    isDialogOpen,
    editingActivityId,
    editingActivity,
    copySourceActivityId,
    copySourceActivity,
    isSaving,
    selectedImageFile,
    activityImagePreview,
    clearImagePreview,
    onActivityImageChange,
    calendarWeekdays,
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
    getOfficialShippingRangeLabel,
    handleFormRangeSelect,
    isSelectOpen,
    toggleCustomSelect,
    selectCustomOption,
    getActivityTypeSelectLabel,
    getAnimateTypeSelectLabel,
    getStatusSelectLabel,
    openCreateDialog,
    openEditDialog,
    openCopyDialog,
    closeDialog,
    saveActivity,
  }
}
