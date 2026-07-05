import { reactive, watch } from 'vue'

const STORAGE_KEY = 'cc-admin:activity-product-rate-defaults'
const DEFAULT_RATE = 0.2
const DEFAULT_SALE_RATE = 0.24

// Per-activity default cost/sale rates, persisted to localStorage keyed by activity id.
// `loadActivityRateDefaults` is called by the page on mount and on activity change; a watch
// re-saves whenever the rates (or the active activity) change.
export const useActivityRateDefaults = (activityId) => {
  const activityRateDefaults = reactive({
    rate: DEFAULT_RATE,
    saleRate: DEFAULT_SALE_RATE,
  })

  const getNormalizedRateValue = (value, fallback) => {
    const numberValue = Number(value)
    return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : fallback
  }

  const getStoredActivityRateDefaults = () => {
    if (typeof localStorage === 'undefined') return {}

    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
      return {}
    }
  }

  const saveActivityRateDefaults = () => {
    if (typeof localStorage === 'undefined' || !activityId.value) return

    const storedDefaults = getStoredActivityRateDefaults()
    storedDefaults[String(activityId.value)] = {
      rate: getNormalizedRateValue(activityRateDefaults.rate, DEFAULT_RATE),
      saleRate: getNormalizedRateValue(activityRateDefaults.saleRate, DEFAULT_SALE_RATE),
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedDefaults))
  }

  const loadActivityRateDefaults = () => {
    const storedDefaults = getStoredActivityRateDefaults()[String(activityId.value)] || {}

    activityRateDefaults.rate = getNormalizedRateValue(storedDefaults.rate, DEFAULT_RATE)
    activityRateDefaults.saleRate = getNormalizedRateValue(storedDefaults.saleRate, DEFAULT_SALE_RATE)
  }

  watch(
    () => [activityRateDefaults.rate, activityRateDefaults.saleRate, activityId.value],
    () => {
      saveActivityRateDefaults()
    },
  )

  return {
    activityRateDefaults,
    loadActivityRateDefaults,
    saveActivityRateDefaults,
  }
}
