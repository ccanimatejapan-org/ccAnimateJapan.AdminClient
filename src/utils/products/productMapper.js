export const toNumber = (value, fallback = 0) => {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : fallback
}

export const normalizeProductImages = (images) =>
  (Array.isArray(images) ? images : [])
    .map((image) => ({
      id: toNumber(image.id),
      productId: toNumber(image.productId),
      productImageUrl: image.productImageUrl || '',
    }))
    .filter((image) => image.id > 0 && image.productImageUrl)

export const mapProductTypeFromApi = (productType) => ({
  id: toNumber(productType.id),
  name: productType.name || '',
  isDelete: productType.isDelete === true,
  raw: productType,
})

export const mapProductFromApi = (product, fallbackActivityId = 0) => ({
  id: product.id,
  createdAt: product.createdAt,
  updateAt: product.updateAt,
  name: product.name || '',
  japanCost: toNumber(product.japanCost),
  rate: toNumber(product.rate),
  price: toNumber(product.price),
  amount: toNumber(product.amount),
  isOutStock: product.isOutStock === true,
  productTypeId: toNumber(product.productTypeId),
  activityId: toNumber(product.activityId, fallbackActivityId),
  info: product.info || '',
  images: normalizeProductImages(product.images),
  raw: product,
})
