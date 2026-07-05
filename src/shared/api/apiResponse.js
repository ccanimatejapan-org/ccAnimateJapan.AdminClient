// 統一的 API 回應處理。
// 後端 envelope 格式：{ status, data, message }。
// 沿用 AdminClient 既有的「數字版」成功判斷（status 可能是數字或數字字串）：
// 沒有 status 或 Number(status) < 400 視為成功，否則丟出 ApiError。
export class ApiError extends Error {
  constructor(message, status, responseData = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.responseData = responseData
  }
}

export const unwrapApiResponse = (body, httpStatus) => {
  const responseStatus = body?.status ? Number(body.status) : httpStatus
  const isSuccess = !responseStatus || responseStatus < 400

  if (!isSuccess) {
    const message = body?.message || `Request failed (${responseStatus || httpStatus})`
    throw new ApiError(message, responseStatus || httpStatus, body)
  }

  return body
}
