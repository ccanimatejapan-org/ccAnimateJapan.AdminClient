import { mapProductFromApi } from '@/modules/activityProduct/utils/productMapper'

// 庫存管理清單（GET /api/product-stock-transactions/inventory-products）的一筆商品。
// activityName / isPreOrder / activityStatus 是這支端點額外帶的活動資訊；
// activityStatus 缺值（舊版後端）時為 null，庫存可見規則會當作活動未結束。
export const mapInventoryProductFromApi = (product) => ({
  ...mapProductFromApi(product),
  activityName: product.activityName || '',
  isPreOrder: product.isPreOrder === true,
  activityStatus: product.activityStatus ?? null,
})
