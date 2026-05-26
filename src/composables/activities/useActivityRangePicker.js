import { reactive, ref } from 'vue'

const defaultCalendarWeekdays = ['日', '一', '二', '三', '四', '五', '六']

const defaultRangeFieldKeys = {
  activity: {
    start: 'activityStartDate',
    end: 'activityEndDate',
  },
  prep: {
    start: 'prepStartDate',
    end: 'prepEndDate',
  },
}

const pad = (value) => String(value).padStart(2, '0')

const toDate = (value) => {
  if (!value) return null

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const toDisplayDate = (value) => {
  const date = toDate(value)
  if (!date) return ''

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const toDisplayDateTime = (value) => {
  const date = toDate(value)
  if (!date) return ''

  return `${toDisplayDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const getDatePart = (value) => {
  if (!value) return ''

  const datePart = String(value).split('T')[0]
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart

  return toDisplayDate(value)
}

const getTodayMonthKey = () => {
  const today = new Date()
  return `${today.getFullYear()}-${pad(today.getMonth() + 1)}`
}

const toDateRangeValue = (date, isEnd = false) => `${date}T${isEnd ? '23:59' : '00:00'}`

export const useActivityRangePicker = (
  form,
  {
    calendarWeekdays = defaultCalendarWeekdays,
    rangeFieldKeys = defaultRangeFieldKeys,
    onToggle,
  } = {},
) => {
  const openRangeKey = ref('')
  const rangeCalendarMonth = reactive({
    activity: '',
    prep: '',
  })

  const getRangeFields = (key) => rangeFieldKeys[key] || null

  const getRangeValues = (key) => {
    const fields = getRangeFields(key)
    return fields
      ? {
          start: getDatePart(form[fields.start]),
          end: getDatePart(form[fields.end]),
        }
      : { start: '', end: '' }
  }

  const getRangeDateTimes = (key) => {
    const fields = getRangeFields(key)
    return fields
      ? {
          start: toDisplayDateTime(form[fields.start]),
          end: toDisplayDateTime(form[fields.end]),
        }
      : { start: '', end: '' }
  }

  const formatRangeLabel = (key) => {
    const values = getRangeDateTimes(key)
    if (!values.start && !values.end) return '請選擇開始與結束時間'
    if (!values.start) return `未選開始 ~ ${values.end}`
    if (!values.end) return `${values.start} ~ 未選結束`
    return `${values.start} ~ ${values.end}`
  }

  const getActivityRangeLabel = () => formatRangeLabel('activity')
  const getPrepRangeLabel = () => formatRangeLabel('prep')

  const isRangeOpen = (key) => openRangeKey.value === key

  const setRangeCalendarMonth = (key) => {
    const values = getRangeValues(key)
    rangeCalendarMonth[key] = (values.start || values.end || `${getTodayMonthKey()}-01`).slice(0, 7)
  }

  const toggleRangePicker = (key) => {
    onToggle?.(key)

    if (isRangeOpen(key)) {
      openRangeKey.value = ''
      return
    }

    setRangeCalendarMonth(key)
    openRangeKey.value = key
  }

  const closeRangePicker = () => {
    openRangeKey.value = ''
  }

  const getRangeMonthLabel = (key) => {
    const monthKey = rangeCalendarMonth[key] || getTodayMonthKey()
    const [year, month] = monthKey.split('-')
    return `${year}年${Number(month)}月`
  }

  const shiftRangeMonth = (key, direction) => {
    const monthKey = rangeCalendarMonth[key] || getTodayMonthKey()
    const [year, month] = monthKey.split('-').map(Number)
    const date = new Date(year, month - 1 + direction, 1)
    rangeCalendarMonth[key] = `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
  }

  const getRangeCalendarDays = (key) => {
    const monthKey = rangeCalendarMonth[key] || getTodayMonthKey()
    const [year, month] = monthKey.split('-').map(Number)
    const firstDay = new Date(year, month - 1, 1)
    const daysInMonth = new Date(year, month, 0).getDate()
    const leadingDays = firstDay.getDay()
    const totalCells = Math.ceil((leadingDays + daysInMonth) / 7) * 7

    return Array.from({ length: totalCells }, (_, index) => {
      const dayNumber = index - leadingDays + 1
      if (dayNumber < 1 || dayNumber > daysInMonth) {
        return {
          key: `${monthKey}-empty-${index}`,
          date: '',
          day: '',
        }
      }

      const date = `${year}-${pad(month)}-${pad(dayNumber)}`
      return {
        key: date,
        date,
        day: dayNumber,
      }
    })
  }

  const isRangeDayStart = (key, date) => date && getRangeValues(key).start === date
  const isRangeDayEnd = (key, date) => date && getRangeValues(key).end === date
  const isRangeDaySelected = (key, date) => isRangeDayStart(key, date) || isRangeDayEnd(key, date)

  const isRangeDayInRange = (key, date) => {
    if (!date) return false

    const values = getRangeValues(key)
    return Boolean(values.start && values.end && date > values.start && date < values.end)
  }

  const getRangeStartLabel = (key) => getRangeDateTimes(key).start || '未選擇'
  const getRangeEndLabel = (key) => getRangeDateTimes(key).end || '未選擇'

  const selectRangeDate = (key, date) => {
    if (!date) return false

    const fields = getRangeFields(key)
    const values = getRangeValues(key)
    if (!fields) return false

    if (!values.start || values.end) {
      form[fields.start] = toDateRangeValue(date)
      form[fields.end] = ''
      return false
    }

    if (date < values.start) {
      form[fields.start] = toDateRangeValue(date)
      form[fields.end] = toDateRangeValue(values.start, true)
      return true
    }

    form[fields.end] = toDateRangeValue(date, true)
    return true
  }

  return {
    calendarWeekdays,
    openRangeKey,
    rangeCalendarMonth,
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
  }
}
