// 登入狀態重新檢查（純函式，供 composables/useSessionExpiryWatcher 接上 document 與 window）。
// 頁面一直開著、分頁被切走很久（token 在背景過期）再切回來時，不會有任何 API 請求，
// 所以要在「分頁重新可見」與「視窗重新取得焦點」時主動檢查，發現登入失效就通知呼叫端。
// 回傳 stop 函式，用來移除兩個監聽。
export const attachSessionRecheck = ({
  isSessionValid,
  onSessionInvalid,
  documentRef = document,
  windowRef = window,
}) => {
  const recheck = () => {
    if (!isSessionValid()) onSessionInvalid()
  }

  const onVisibilityChange = () => {
    if (documentRef.visibilityState === 'visible') recheck()
  }

  documentRef.addEventListener('visibilitychange', onVisibilityChange)
  windowRef.addEventListener('focus', recheck)

  return () => {
    documentRef.removeEventListener('visibilitychange', onVisibilityChange)
    windowRef.removeEventListener('focus', recheck)
  }
}
