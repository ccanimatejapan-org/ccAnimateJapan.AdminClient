// Activity table column definitions. Type-name lookups and stripHtml are injected so the
// factory stays pure/testable while reusing the page's live activityTypes/animateTypes maps.
export const createActivityTableColumns = ({ getActivityTypeName, getAnimateTypeName, stripHtml }) => [
  {
    key: 'activityPeriod',
    label: '活動期間',
    sortable: true,
    getValue: (activity) => `${activity.activityStartDate || ''} ${activity.activityEndDate || ''}`,
  },
  {
    key: 'name',
    label: '活動名稱',
    sortable: true,
    getValue: (activity) => activity.name || '',
  },
  {
    key: 'image',
    label: '活動圖片',
    sortable: true,
    getValue: (activity) => activity.image || '',
  },
  {
    key: 'address',
    label: '活動地址',
    sortable: true,
    getValue: (activity) => activity.address || '',
  },
  {
    key: 'status',
    label: '活動狀態',
    sortable: true,
    getValue: (activity) => activity.statusText || '',
  },
  {
    key: 'preOrder',
    label: '活動模式',
    sortable: true,
    getValue: (activity) => activity.preOrderText || '',
  },
  {
    key: 'activityType',
    label: '活動類型',
    sortable: true,
    getValue: (activity) => getActivityTypeName(activity.activityTypeId),
  },
  {
    key: 'animateType',
    label: '動漫',
    sortable: true,
    getValue: (activity) => getAnimateTypeName(activity.animateTypeId),
  },
  {
    key: 'prepPeriod',
    label: '準備期間',
    sortable: true,
    getValue: (activity) => `${activity.prepStartDate || ''} ${activity.prepEndDate || ''}`,
  },
  {
    key: 'info',
    label: '備註',
    sortable: true,
    getValue: (activity) => stripHtml(activity.info),
  },
  {
    key: 'actions',
    label: '操作',
    sortable: false,
  },
]
