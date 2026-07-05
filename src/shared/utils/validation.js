export const isBlankValue = (value) => value === undefined || value === null || String(value).trim() === ''

export const hasPositiveNumberValue = (value) => {
  if (isBlankValue(value)) return false

  const numberValue = Number(value)
  return Number.isFinite(numberValue) && numberValue > 0
}

export const formatRequiredFieldsMessage = (fields) => `請填寫：${fields.join('、')}。`
