const collator = new Intl.Collator(['zh-Hant', 'en'], {
  numeric: true,
  sensitivity: 'base',
})

const normalizeSortValue = (value) => {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'boolean') return value ? 1 : 0
  return value
}

const compareSortValues = (left, right) => {
  const normalizedLeft = normalizeSortValue(left)
  const normalizedRight = normalizeSortValue(right)

  if (typeof normalizedLeft === 'number' && typeof normalizedRight === 'number') {
    return normalizedLeft - normalizedRight
  }

  return collator.compare(String(normalizedLeft), String(normalizedRight))
}

export const sortTableItems = (items, sortState, getSortValue) => {
  const directionMultiplier = sortState?.direction === 'desc' ? -1 : 1

  return items
    .map((item, index) => ({ item, index }))
    .sort((left, right) => {
      const compared =
        compareSortValues(
          getSortValue(left.item, left.index),
          getSortValue(right.item, right.index),
        ) * directionMultiplier

      return compared || left.index - right.index
    })
    .map(({ item }) => item)
}
