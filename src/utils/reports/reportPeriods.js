const startOfDay = (date) => {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

const addDays = (date, amount) => {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

// date input values arrive as "YYYY-MM-DD"; parse them as LOCAL dates (not UTC).
const parseLocalDate = (value) => {
  if (!value) return null
  const [year, month, day] = String(value).split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

export const PERIOD_PRESETS = [
  { key: 'today', label: '今日' },
  { key: '7d', label: '近 7 天' },
  { key: 'month', label: '本月' },
  { key: '30d', label: '近 30 天' },
  { key: 'quarter', label: '本季' },
  { key: 'custom', label: '自訂' },
]

// Returns { key, label, start: Date(local), end: Date(local, exclusive), granularity }.
export const buildPeriod = (key, customStart, customEnd) => {
  const now = new Date()
  const todayStart = startOfDay(now)

  let start
  let end
  let granularity = 'day'

  switch (key) {
    case 'today':
      start = todayStart
      end = addDays(todayStart, 1)
      break
    case '7d':
      start = addDays(todayStart, -6)
      end = addDays(todayStart, 1)
      break
    case '30d':
      start = addDays(todayStart, -29)
      end = addDays(todayStart, 1)
      break
    case 'quarter': {
      const quarter = Math.floor(now.getMonth() / 3)
      start = new Date(now.getFullYear(), quarter * 3, 1)
      end = new Date(now.getFullYear(), quarter * 3 + 3, 1)
      granularity = 'week'
      break
    }
    case 'custom': {
      const parsedStart = parseLocalDate(customStart)
      const parsedEnd = parseLocalDate(customEnd)
      start = parsedStart || todayStart
      end = parsedEnd ? addDays(parsedEnd, 1) : addDays(todayStart, 1)
      const spanDays = Math.round((end - start) / 86400000)
      granularity = spanDays > 92 ? 'month' : spanDays > 31 ? 'week' : 'day'
      break
    }
    case 'month':
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      break
  }

  const label = PERIOD_PRESETS.find((preset) => preset.key === key)?.label || '本月'
  return { key, label, start, end, granularity }
}

export const getDefaultPeriod = () => buildPeriod('month')
