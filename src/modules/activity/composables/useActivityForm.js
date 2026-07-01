import { onBeforeUnmount, reactive, ref } from 'vue'
import { createActivity as createActivityApi, updateActivity as updateActivityApi } from '@/modules/activity/api/activityApi'
import { useActivityRangePicker } from '@/modules/activity/composables/useActivityRangePicker'
import { useImageUpload } from '@/shared/composables/useImageUpload'
import {
  ActivityEnum,
  activityStatusOptions,
  dateTimeToIso,
  mapActivityFromApi,
  normalizeActivityStatus,
  toActivityStatusText,
  toInputDateTime,
} from '@/modules/activity/utils/activityMapper'
import { appendIfValue } from '@/shared/utils/formData'
import { sanitizeHtml } from '@/shared/utils/html'
import { formatRequiredFieldsMessage, isBlankValue } from '@/shared/utils/validation'
import { getAdminToken } from '@/shared/stores/authSession'

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

// Activity create/edit form: holds the reactive form, composes image upload + the form
// date-range picker, validates, builds the multipart payload, and saves (updating the
// shared activities list in place). Type-name lookups, loading flags and status/error
// messages are injected from the page / useActivityCrud.
export const useActivityForm = ({
  activities,
  isLoadingActivityTypes,
  isLoadingAnimateTypes,
  statusMessage,
  errorMessage,
  getActivityTypeName,
  getAnimateTypeName,
}) => {
  const form = reactive({ ...emptyForm })
  const isDialogOpen = ref(false)
  const editingActivityId = ref(null)
  const editingActivity = ref(null)
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
    getPrepRangeLabel,
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

  const toggleCustomSelect = (key, disabled = false) => {
    if (disabled) return
    openRangeKey.value = ''
    openSelectKey.value = isSelectOpen(key) ? '' : key
  }

  const selectCustomOption = (key, value) => {
    form[key] = value
    openSelectKey.value = ''
  }

  const handleFormRangeSelect = (key, date) => {
    const isRangeCompleted = selectRangeDate(key, date)
    if (isRangeCompleted) {
      closeRangePicker()
    }
  }

  const resetForm = () => {
    resetImageUpload()
    Object.assign(form, emptyForm)
    editingActivityId.value = null
    editingActivity.value = null
    openSelectKey.value = ''
    openRangeKey.value = ''
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

  const closeDialog = () => {
    isDialogOpen.value = false
    resetImageUpload()
    editingActivityId.value = null
    editingActivity.value = null
    openSelectKey.value = ''
    openRangeKey.value = ''
  }

  const validateActivityForm = () => {
    const missingFields = []

    if (isBlankValue(form.activityStartDate) || isBlankValue(form.activityEndDate)) {
      missingFields.push('活動時間')
    }

    if (!form.isPreOrder && (isBlankValue(form.prepStartDate) || isBlankValue(form.prepEndDate))) {
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
    if (!form.isPreOrder) {
      appendIfValue(formData, 'prepareStartTime', dateTimeToIso(form.prepStartDate))
      appendIfValue(formData, 'prepareEndTime', dateTimeToIso(form.prepEndDate))
    }
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

  onBeforeUnmount(() => {
    clearImagePreview()
  })

  return {
    form,
    isDialogOpen,
    editingActivityId,
    editingActivity,
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
    getPrepRangeLabel,
    handleFormRangeSelect,
    isSelectOpen,
    toggleCustomSelect,
    selectCustomOption,
    getActivityTypeSelectLabel,
    getAnimateTypeSelectLabel,
    getStatusSelectLabel,
    openCreateDialog,
    openEditDialog,
    closeDialog,
    saveActivity,
  }
}
