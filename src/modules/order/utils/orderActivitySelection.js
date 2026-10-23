// 活動列表（左側）載入後，決定要選取哪一個活動。
// - 一般載入（開頁、切換分頁）：選第一個活動，沒有活動則為空字串。
// - 重整（訂單狀態變更後重新取得活動列表）：preserveSelection 為 true 時，目前選取的活動還在列表中就保持不動，
//   不在了（例如訂單狀態變更後活動移到別的分頁）才退回第一個。
//   保持時回傳「原值」而不是列表裡的 id，避免型別不同（數字 / 字串）而被重新指派、觸發多餘的重新載入。
export const resolveSelectedActivityId = (activities, currentId, { preserveSelection = false } = {}) => {
  const list = activities || []

  if (preserveSelection && currentId !== '' && currentId != null) {
    const stillListed = list.some((activity) => Number(activity.activityId) === Number(currentId))
    if (stillListed) return currentId
  }

  return list[0]?.activityId || ''
}
