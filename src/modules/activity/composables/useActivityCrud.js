import { ref } from 'vue'
import {
  copyActivity as copyActivityApi,
  deleteActivity as deleteActivityApi,
  listActivities as listActivitiesApi,
  listActivityTypes as listActivityTypesApi,
  listDeletedActivities as listDeletedActivitiesApi,
  restoreActivity as restoreActivityApi,
} from '@/modules/activity/api/activityApi'
import { listAnimateTypes as listAnimateTypesApi } from '@/modules/animateType/api/animateTypeApi'
import { mapActivityFromApi } from '@/modules/activity/utils/activityMapper'
import { getAdminToken } from '@/shared/stores/authSession'

// Owns the activity list / types / animate-types / trash data and their loading +
// id-scoped action flags and status/error messages. `requestConfirm` (from the shared
// useConfirmDialog) gates deletes with the promise-based confirm dialog.
export const useActivityCrud = ({ requestConfirm }) => {
  const activities = ref([])
  const deletedActivities = ref([])
  const activityTypes = ref([])
  const animateTypes = ref([])
  const isLoading = ref(false)
  const isLoadingDeletedActivities = ref(false)
  const isLoadingActivityTypes = ref(false)
  const isLoadingAnimateTypes = ref(false)
  const copyingActivityId = ref(null)
  const deletingActivityId = ref(null)
  const restoringActivityId = ref(null)
  const statusMessage = ref('')
  const errorMessage = ref('')
  const trashErrorMessage = ref('')
  const isTrashDialogOpen = ref(false)

  const getActivityTypeName = (activityTypeId) => {
    if (!activityTypeId) return '-'

    const matchedType = activityTypes.value.find((type) => Number(type.id) === Number(activityTypeId))
    return matchedType?.name || `#${activityTypeId}`
  }

  const getAnimateTypeName = (animateTypeId) => {
    if (!animateTypeId) return '-'

    const matchedType = animateTypes.value.find((type) => Number(type.id) === Number(animateTypeId))
    return matchedType?.name || `#${animateTypeId}`
  }

  const loadActivities = async () => {
    isLoading.value = true
    errorMessage.value = ''

    try {
      const responseActivities = await listActivitiesApi()
      activities.value = responseActivities.map(mapActivityFromApi)
    } catch (err) {
      errorMessage.value = err.message || '讀取活動資料失敗。'
    } finally {
      isLoading.value = false
    }
  }

  const loadDeletedActivities = async () => {
    isLoadingDeletedActivities.value = true
    trashErrorMessage.value = ''

    try {
      const responseActivities = await listDeletedActivitiesApi()
      deletedActivities.value = responseActivities.map(mapActivityFromApi)
    } catch (err) {
      trashErrorMessage.value = err.message || '讀取已刪除活動失敗。'
    } finally {
      isLoadingDeletedActivities.value = false
    }
  }

  const loadActivityTypes = async () => {
    isLoadingActivityTypes.value = true

    try {
      activityTypes.value = await listActivityTypesApi()
    } catch (err) {
      errorMessage.value = err.message || '讀取活動類型失敗。'
    } finally {
      isLoadingActivityTypes.value = false
    }
  }

  const loadAnimateTypes = async () => {
    isLoadingAnimateTypes.value = true

    try {
      animateTypes.value = await listAnimateTypesApi()
    } catch (err) {
      errorMessage.value = err.message || '讀取動漫失敗。'
    } finally {
      isLoadingAnimateTypes.value = false
    }
  }

  const openTrashDialog = () => {
    if (!getAdminToken()) {
      errorMessage.value = '登入狀態已失效，請重新登入後再查看垃圾桶。'
      return
    }

    statusMessage.value = ''
    errorMessage.value = ''
    trashErrorMessage.value = ''
    isTrashDialogOpen.value = true
    loadDeletedActivities()
  }

  const closeTrashDialog = () => {
    isTrashDialogOpen.value = false
    trashErrorMessage.value = ''
    restoringActivityId.value = null
  }

  const copyActivity = async (activity) => {
    if (copyingActivityId.value !== null) {
      return
    }

    if (!getAdminToken()) {
      errorMessage.value = '登入狀態已失效，請重新登入後再複製活動。'
      return
    }

    copyingActivityId.value = activity.id
    errorMessage.value = ''
    statusMessage.value = ''

    try {
      const response = await copyActivityApi(activity.id)
      const copiedActivity = mapActivityFromApi(response?.data)
      activities.value.unshift(copiedActivity)
      statusMessage.value = '複製活動成功。'
    } catch (err) {
      errorMessage.value = err.message || '複製活動失敗。'
    } finally {
      copyingActivityId.value = null
    }
  }

  const deleteActivity = async (activity) => {
    if (!getAdminToken()) {
      errorMessage.value = '登入狀態已失效，請重新登入後再刪除活動。'
      return false
    }

    const shouldDelete = await requestConfirm(activity)
    if (!shouldDelete) {
      return false
    }

    deletingActivityId.value = activity.id
    errorMessage.value = ''
    statusMessage.value = ''

    try {
      await deleteActivityApi(activity.id)
      activities.value = activities.value.filter((item) => item.id !== activity.id)
      statusMessage.value = '刪除活動成功。'
      return true
    } catch (err) {
      errorMessage.value = err.message || '刪除活動失敗。'
      return false
    } finally {
      deletingActivityId.value = null
    }
  }

  const restoreActivity = async (activity) => {
    if (!getAdminToken()) {
      trashErrorMessage.value = '登入狀態已失效，請重新登入後再還原活動。'
      return
    }

    restoringActivityId.value = activity.id
    trashErrorMessage.value = ''
    statusMessage.value = ''

    try {
      const response = await restoreActivityApi(activity.id)
      const restoredActivity = mapActivityFromApi(response?.data)

      deletedActivities.value = deletedActivities.value.filter((item) => item.id !== activity.id)
      if (!activities.value.some((item) => item.id === restoredActivity.id)) {
        activities.value.unshift(restoredActivity)
      }
      statusMessage.value = '還原活動成功。'
    } catch (err) {
      trashErrorMessage.value = err.message || '還原活動失敗。'
    } finally {
      restoringActivityId.value = null
    }
  }

  return {
    activities,
    deletedActivities,
    activityTypes,
    animateTypes,
    isLoading,
    isLoadingDeletedActivities,
    isLoadingActivityTypes,
    isLoadingAnimateTypes,
    copyingActivityId,
    deletingActivityId,
    restoringActivityId,
    statusMessage,
    errorMessage,
    trashErrorMessage,
    isTrashDialogOpen,
    getActivityTypeName,
    getAnimateTypeName,
    loadActivities,
    loadDeletedActivities,
    loadActivityTypes,
    loadAnimateTypes,
    openTrashDialog,
    closeTrashDialog,
    copyActivity,
    deleteActivity,
    restoreActivity,
  }
}
