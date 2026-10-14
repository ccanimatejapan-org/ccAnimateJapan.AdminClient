// 所有圖片上傳（活動、作品、商品、批次匯入）共用的格式限制，需與後端各 ImageUploadHelper 一致。
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif']
export const ALLOWED_IMAGE_ACCEPT = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_IMAGE_EXTENSIONS].join(',')
export const ALLOWED_IMAGE_LABEL = 'JPG、PNG、WebP 或 AVIF'
