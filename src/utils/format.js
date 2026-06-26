export const formatCurrency = (value) =>
  new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))

export const formatNumber = (value) =>
  new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 0 }).format(Number(value || 0))

export const formatPercent = (value, digits = 1) =>
  `${(Number(value || 0) * 100).toFixed(digits)}%`
