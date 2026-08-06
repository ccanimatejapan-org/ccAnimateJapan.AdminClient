import { ActivityEnum } from '@/modules/activity/utils/activityMapper'

// 只有「活動開始」可下單；legacy 1/2 與其他狀態僅在有訂單時列出，且唯讀。
export const ORDERABLE_ACTIVITY_STATUSES = [ActivityEnum.Started]

export const READONLY_ACTIVITY_STATUS_LABELS = {
  [ActivityEnum.NotStarted]: '尚未開始',
  [ActivityEnum.Preparing]: '準備中',
  [ActivityEnum.PreparationEnded]: '準備結束',
  [ActivityEnum.Ended]: '已結束',
}

export const isActivityReadOnly = (activity) =>
  activity != null && !ORDERABLE_ACTIVITY_STATUSES.includes(Number(activity?.status))

export const getActivityStatusBadge = (activity) =>
  READONLY_ACTIVITY_STATUS_LABELS[Number(activity?.status)] || ''

export const getActivityKindText = (activity) => (activity?.isPreOrder ? '預購' : '現貨')
