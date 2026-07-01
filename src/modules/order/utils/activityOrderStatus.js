import { ActivityEnum } from '@/modules/activity/utils/activityMapper'

// 只有「準備中 / 進行中」可下單；其餘狀態（準備結束、已結束…）僅在有訂單時列出，且唯讀
export const ORDERABLE_ACTIVITY_STATUSES = [ActivityEnum.Preparing, ActivityEnum.Started]

export const READONLY_ACTIVITY_STATUS_LABELS = {
  [ActivityEnum.NotStarted]: '尚未開始',
  [ActivityEnum.PreparationEnded]: '準備結束',
  [ActivityEnum.Ended]: '已結束',
}

export const isActivityReadOnly = (activity) =>
  activity != null && !ORDERABLE_ACTIVITY_STATUSES.includes(Number(activity?.status))

export const getActivityStatusBadge = (activity) =>
  READONLY_ACTIVITY_STATUS_LABELS[Number(activity?.status)] || ''

export const getActivityKindText = (activity) => (activity?.isPreOrder ? '預購' : '現貨')
