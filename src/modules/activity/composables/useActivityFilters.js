import { computed, reactive, ref } from 'vue'
import { useActivityRangePicker } from '@/modules/activity/composables/useActivityRangePicker'
import {
  createEmptyActivityFilters,
  hasActiveActivityFilters,
  matchesActivityFilters,
} from '@/modules/activity/utils/activityFilters'

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

// Activity list filters: text/type/date-range search state, the multiselect open-state and
// label helpers, the FILTER date-range picker, and the derived filtered list + summary.
export const useActivityFilters = ({
  activities,
  activityTypes,
  animateTypes,
  isLoadingActivityTypes,
  isLoadingAnimateTypes,
}) => {
  const searchFilters = reactive(createEmptyActivityFilters())
  const openFilterSelectKey = ref('')
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

  const {
    calendarWeekdays,
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
    selectRangeDate: selectFilterRangeDate,
  } = useActivityRangePicker(searchFilters, {
    rangeFieldKeys: filterRangeFieldKeys,
    onToggle: () => {
      openFilterSelectKey.value = ''
    },
  })

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
  }

  const handleFilterRangeSelect = (key, date) => {
    const isRangeCompleted = selectFilterRangeDate(key, date)
    if (isRangeCompleted) {
      closeFilterRangePicker()
    }
  }

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

  return {
    searchFilters,
    openFilterSelectKey,
    calendarWeekdays,
    isFilterSelectOpen,
    toggleFilterSelect,
    toggleFilterType,
    clearFilterType,
    isTypeSelected,
    clearSearchFilters,
    getFilterActivityTypeLabel,
    getFilterAnimateTypeLabel,
    filteredActivities,
    hasFiltersApplied,
    filteredActivitiesCount,
    totalActivitiesLabel,
    isFilterRangeOpen,
    toggleFilterRangePicker,
    closeFilterRangePicker,
    getFilterRangeMonthLabel,
    shiftFilterRangeMonth,
    getFilterRangeCalendarDays,
    isFilterRangeDayStart,
    isFilterRangeDayEnd,
    isFilterRangeDayInRange,
    isFilterRangeDaySelected,
    handleFilterRangeSelect,
    filterActivityRangeLabel,
    filterPrepRangeLabel,
    filterActivityStartLabel,
    filterActivityEndLabel,
    filterPrepStartLabel,
    filterPrepEndLabel,
  }
}
