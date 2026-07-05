const webClientBaseUrl = (
  import.meta.env.VITE_WEB_CLIENT_BASE_URL || 'https://cc-animate-japan-web-client.vercel.app'
).replace(/\/+$/, '')

// 活動列表「複製前台表單連結」使用的 WebClient 公開頁網址。
export const buildActivityFormUrl = (activityId) =>
  `${webClientBaseUrl}/activities/${encodeURIComponent(String(activityId))}/products`
