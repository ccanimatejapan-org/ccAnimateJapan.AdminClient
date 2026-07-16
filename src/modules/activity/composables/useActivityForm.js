import { onBeforeUnmount, reactive, ref, watch } from 'vue'
import { createActivity as createActivityApi, updateActivity as updateActivityApi } from '@/modules/activity/api/activityApi'
import { useActivityRangePicker } from '@/modules/activity/composables/useActivityRangePicker'
import { useImageUpload } from '@/shared/composables/useImageUpload'
import {
  ActivityEnum,
  GroupBuyStatus,
  ShippingMode,
  ShippingShareRule,
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
  // 運費 / 開團設定（V1）
  shippingMode: ShippingMode.NoShipping,
  groupBuyThreshold: 0,
  perItemShipping: 0,
  shippingCost: 0,
  freeShippingThreshold: 0,
  allowCustomerShippingTopUp: false,
  shippingShareRule: ShippingShareRule.ByQuantity,
  groupBuyStatus: GroupBuyStatus.NotRequired,
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
  // 使用者是否手動選過分攤規則；為真時切換運費模式不再覆蓋其選擇
  const shareRuleTouched = ref(false)

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

    // 手動選過分攤規則後記住，之後切運費模式不再覆蓋
    if (key === 'shippingShareRule') {
      shareRuleTouched.value = true
    }
    // 切換運費模式時，若尚未手動選過分攤規則，給該模式較合理的建議值
    if (key === 'shippingMode' && !shareRuleTouched.value) {
      if (value === ShippingMode.PerItemPrepaid) form.shippingShareRule = ShippingShareRule.ByQuantity
      else if (value === ShippingMode.FreeOverAmount) form.shippingShareRule = ShippingShareRule.ByAmount
    }
  }

  // 現貨/預購切換時同步開團狀態初值：現貨一律「不需開團」；預購從「不需開團」進來時預設「募集中」，
  // 不覆蓋已載入或手動設定的「已成團」/「流團」。
  watch(
    () => form.isPreOrder,
    (isPreOrder) => {
      if (!isPreOrder) {
        form.groupBuyStatus = GroupBuyStatus.NotRequired
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
    Object.assign(form, emptyForm)
    editingActivityId.value = null
    editingActivity.value = null
    openSelectKey.value = ''
    openRangeKey.value = ''
    shareRuleTouched.value = false
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
      // 運費/開團欄位由 mapper 回填（Step 1 為 mock 值，Step 2 為後端真實值）
      shippingMode: activity.shippingMode ?? ShippingMode.NoShipping,
      groupBuyThreshold: activity.groupBuyThreshold ?? 0,
      perItemShipping: activity.perItemShipping ?? 0,
      shippingCost: activity.shippingCost ?? 0,
      freeShippingThreshold: activity.freeShippingThreshold ?? 0,
      allowCustomerShippingTopUp: activity.allowCustomerShippingTopUp === true,
      shippingShareRule: activity.shippingShareRule ?? ShippingShareRule.ByQuantity,
      groupBuyStatus: activity.groupBuyStatus ?? GroupBuyStatus.NotRequired,
    })
    // 既有活動的分攤規則視為已設定過，切換模式時不覆蓋
    shareRuleTouched.value = true
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

    // 分模式必填：A/C 預購需成團(開團)數量 > 0；B 需免運門檻 > 0
    if (form.shippingMode === ShippingMode.PerItemPrepaid && form.isPreOrder && !(Number(form.groupBuyThreshold) > 0)) {
      missingFields.push('成團數量')
    }
    if (form.shippingMode === ShippingMode.NoShipping && form.isPreOrder && !(Number(form.groupBuyThreshold) > 0)) {
      missingFields.push('開團數量')
    }
    if (form.shippingMode === ShippingMode.FreeOverAmount && !(Number(form.freeShippingThreshold) > 0)) {
      missingFields.push('免運門檻')
    }

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

    // 運費 / 開團設定：7 個設定欄一律送（appendIfValue 會送 0；bool 以字串送）
    appendIfValue(formData, 'shippingMode', form.shippingMode)
    appendIfValue(formData, 'groupBuyThreshold', form.groupBuyThreshold)
    appendIfValue(formData, 'perItemShipping', form.perItemShipping)
    appendIfValue(formData, 'shippingCost', form.shippingCost)
    appendIfValue(formData, 'freeShippingThreshold', form.freeShippingThreshold)
    formData.append('allowCustomerShippingTopUp', form.allowCustomerShippingTopUp ? 'true' : 'false')
    appendIfValue(formData, 'shippingShareRule', form.shippingShareRule)
    // 開團狀態僅在「編輯 + 預購」時送（現貨後端強制 NotRequired；建立時後端衍生）
    if (activityId && form.isPreOrder) {
      appendIfValue(formData, 'groupBuyStatus', form.groupBuyStatus)
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
