import { ActivityEnum } from '@/modules/activity/utils/activityMapper'

export const ACTIVITY_LIST_TAB_KEYS = Object.freeze({
  upcomingOrInProgress: 'upcomingOrInProgress',
  ended: 'ended',
})

export const DEFAULT_ACTIVITY_LIST_TAB_KEY =
  ACTIVITY_LIST_TAB_KEYS.upcomingOrInProgress

const TAB_ID_PREFIX = 'activity-list-tab'
const PANEL_ID_PREFIX = 'activity-list-panel'
const toStatusNumber = (activity) => Number(activity?.status)
const createTabId = (key) => `${TAB_ID_PREFIX}-${key}`
const createPanelId = (key) => `${PANEL_ID_PREFIX}-${key}`

const activityListTabs = Object.freeze([
  {
    key: ACTIVITY_LIST_TAB_KEYS.upcomingOrInProgress,
    label: '尚未開始或進行中',
    statusSet: Object.freeze([
      ActivityEnum.NotStarted,
      ActivityEnum.Preparing,
      ActivityEnum.PreparationEnded,
      ActivityEnum.Started,
    ]),
    emptyText: '目前沒有尚未開始或進行中的活動',
    tabId: createTabId(ACTIVITY_LIST_TAB_KEYS.upcomingOrInProgress),
    panelId: createPanelId(ACTIVITY_LIST_TAB_KEYS.upcomingOrInProgress),
  },
  {
    key: ACTIVITY_LIST_TAB_KEYS.ended,
    label: '已結束',
    statusSet: Object.freeze([ActivityEnum.Ended]),
    emptyText: '目前沒有已結束活動',
    tabId: createTabId(ACTIVITY_LIST_TAB_KEYS.ended),
    panelId: createPanelId(ACTIVITY_LIST_TAB_KEYS.ended),
  },
])

const findTab = (tabKey) =>
  activityListTabs.find((tab) => tab.key === tabKey) || activityListTabs[0]

const getActivityListTabCount = (activities = [], tabKey) => {
  const statusSet = new Set(findTab(tabKey).statusSet)

  return (activities || []).filter((activity) =>
    statusSet.has(toStatusNumber(activity)),
  ).length
}

const getActivityListTabEmptyText = ({
  tabKey = DEFAULT_ACTIVITY_LIST_TAB_KEY,
  filteredCount = 0,
  totalCount = 0,
}) => {
  if (filteredCount > 0) return ''
  if (totalCount > 0) return '沒有符合條件的活動'

  return findTab(tabKey).emptyText
}

export const getActivityListTabs = ({
  filteredActivities = [],
  totalActivities = [],
  activeTabKey = DEFAULT_ACTIVITY_LIST_TAB_KEY,
} = {}) => {
  const safeTab = findTab(activeTabKey)

  return activityListTabs.map((tab) => {
    const filteredCount = getActivityListTabCount(filteredActivities, tab.key)
    const totalCount = getActivityListTabCount(totalActivities, tab.key)

    return {
      ...tab,
      count: filteredCount,
      isActive: tab.key === safeTab.key,
      emptyText: getActivityListTabEmptyText({
        tabKey: tab.key,
        filteredCount,
        totalCount,
      }),
    }
  })
}

export const filterActivitiesByActivityListTab = (activities = [], tabKey) => {
  const statusSet = new Set(findTab(tabKey).statusSet)

  return (activities || []).filter((activity) =>
    statusSet.has(toStatusNumber(activity)),
  )
}