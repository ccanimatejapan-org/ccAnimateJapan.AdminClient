<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ActivityDeleteConfirmDialog from '@/modules/activity/components/ActivityDeleteConfirmDialog.vue'
import ActivityFormDialog from '@/modules/activity/components/ActivityFormDialog.vue'
import ActivityNoteDialog from '@/shared/components/ActivityNoteDialog.vue'
import ActivityTable from '@/modules/activity/components/ActivityTable.vue'
import ActivityTrashDialog from '@/modules/activity/components/ActivityTrashDialog.vue'
import CustomSelect from '@/shared/components/CustomSelect.vue'
import DateRangePicker from '@/modules/activity/components/DateRangePicker.vue'
import CountBadge from '@/shared/components/CountBadge.vue'
import PageShell from '@/shared/components/PageShell.vue'
import PanelCard from '@/shared/components/PanelCard.vue'
import AppButton from '@/shared/components/AppButton.vue'
import IconButton from '@/shared/components/IconButton.vue'
import MessageBlock from '@/shared/components/MessageBlock.vue'
import { useActivityCrud } from '@/modules/activity/composables/useActivityCrud'
import { useActivityForm } from '@/modules/activity/composables/useActivityForm'
import { useActivityFilters } from '@/modules/activity/composables/useActivityFilters'
import { createActivityTableColumns } from '@/modules/activity/utils/activityTableColumns'
import { buildActivityFormUrl } from '@/modules/activity/utils/activityFormUrl'
import { activityStatusOptions } from '@/modules/activity/utils/activityMapper'
import {
  getActivityListTabs,
  filterActivitiesByActivityListTab,
  DEFAULT_ACTIVITY_LIST_TAB_KEY,
} from '@/modules/activity/utils/activityListTabs'
import { useConfirmDialog } from '@/shared/composables/useConfirmDialog'
import { useNoteDialog } from '@/shared/composables/useNoteDialog'
import { useDialogScrollLock } from '@/shared/composables/useDialogScrollLock'
import { useTableSort } from '@/shared/composables/useTableSort'
import { useTablePagination } from '@/shared/composables/useTablePagination'
import { copyTextToClipboard } from '@/shared/utils/clipboard'
import { sanitizeHtml, stripHtml } from '@/shared/utils/html'

const router = useRouter()
const trashIconPaths = [
  'M9 3h6',
  'M4 7h16',
  'M6 7l1 14h10l1-14',
  'M10 11v6',
  'M14 11v6',
]
const plusIconPaths = [
  'M12 5v14',
  'M5 12h14',
]
const activityTitleIconPaths = [
  'M8 3v4',
  'M16 3v4',
  'M4 9h16',
  'M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z',
]
const editIconPaths = [
  'M12 20h9',
  'M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z',
]
const copyIconPaths = [
  'M8 8h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z',
  'M5 16H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1',
]
const formLinkIconPaths = [
  'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71',
  'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
  'M8 12h8',
]
const productIconPaths = [
  'M5 10h14',
  'M6 10l1.2-5h9.6L18 10',
  'M7 10v10h10V10',
  'M10 20v-6h4v6',
  'M9 5V3h6v2',
  'M8 13h8',
]
const pageSizeOptions = [30, 50, 100]

const {
  isConfirmDialogOpen: isDeleteConfirmDialogOpen,
  pendingConfirmTarget: pendingDeleteActivity,
  requestConfirm,
  resolveConfirm: resolveDeleteConfirm,
} = useConfirmDialog()

const {
  activities,
  deletedActivities,
  activityTypes,
  animateTypes,
  isLoading,
  isLoadingDeletedActivities,
  isLoadingActivityTypes,
  isLoadingAnimateTypes,
  deletingActivityId,
  restoringActivityId,
  statusMessage,
  errorMessage,
  trashErrorMessage,
  isTrashDialogOpen,
  getActivityTypeName,
  getAnimateTypeName,
  loadActivities,
  loadActivityTypes,
  loadAnimateTypes,
  openTrashDialog,
  closeTrashDialog,
  deleteActivity,
  restoreActivity,
} = useActivityCrud({ requestConfirm })

const {
  isNoteDialogOpen,
  selectedNoteHtml,
  selectedNoteTitle,
  openNoteDialog,
  closeNoteDialog,
} = useNoteDialog()

const {
  searchFilters,
  openFilterSelectKey,
  isFilterSelectOpen,
  toggleFilterSelect,
  toggleFilterType,
  clearFilterType,
  isTypeSelected,
  clearSearchFilters,
  getFilterActivityTypeLabel,
  getFilterAnimateTypeLabel,
  filteredActivities,
  hasFiltersApplied,
  filteredActivitiesCount,
  totalActivitiesLabel,
  isFilterRangeOpen,
  toggleFilterRangePicker,
  closeFilterRangePicker,
  getFilterRangeMonthLabel,
  shiftFilterRangeMonth,
  getFilterRangeCalendarDays,
  isFilterRangeDayStart,
  isFilterRangeDayEnd,
  isFilterRangeDayInRange,
  isFilterRangeDaySelected,
  handleFilterRangeSelect,
  filterActivityRangeLabel,
  filterOfficialShippingRangeLabel,
  filterActivityStartLabel,
  filterActivityEndLabel,
  filterOfficialShippingStartLabel,
  filterOfficialShippingEndLabel,
} = useActivityFilters({
  activities,
  activityTypes,
  animateTypes,
  isLoadingActivityTypes,
  isLoadingAnimateTypes,
})

const {
  form,
  formMode,
  isDialogOpen,
  editingActivityId,
  editingActivity,
  isSaving,
  selectedImageFile,
  activityImagePreview,
  onActivityImageChange,
  calendarWeekdays,
  isRangeOpen,
  toggleRangePicker,
  closeRangePicker,
  getRangeMonthLabel,
  shiftRangeMonth,
  getRangeCalendarDays,
  isRangeDayStart,
  isRangeDayEnd,
  isRangeDayInRange,
  isRangeDaySelected,
  getRangeStartLabel,
  getRangeEndLabel,
  getActivityRangeLabel,
  getOfficialShippingRangeLabel,
  handleFormRangeSelect,
  isSelectOpen,
  toggleCustomSelect,
  selectCustomOption,
  getActivityTypeSelectLabel,
  getAnimateTypeSelectLabel,
  getStatusSelectLabel,
  openCreateDialog,
  openEditDialog,
  openCopyDialog,
  closeDialog,
  saveActivity,
} = useActivityForm({
  activities,
  isLoadingActivityTypes,
  isLoadingAnimateTypes,
  statusMessage,
  errorMessage,
  getActivityTypeName,
  getAnimateTypeName,
})

const activityTableColumns = createActivityTableColumns({
  getActivityTypeName,
  getAnimateTypeName,
  stripHtml,
})

const activeActivityListTabKey = ref(DEFAULT_ACTIVITY_LIST_TAB_KEY)
const activityTabButtons = ref([])
const activityTabs = computed(() =>
  getActivityListTabs({
    filteredActivities: filteredActivities.value,
    totalActivities: activities.value,
    activeTabKey: activeActivityListTabKey.value,
  }),
)

const activeActivityListTab = computed(
  () => activityTabs.value.find((tab) => tab.isActive) || activityTabs.value[0],
)

const currentTabFilteredActivities = computed(() =>
  filterActivitiesByActivityListTab(
    filteredActivities.value,
    activeActivityListTab.value?.key,
  ),
)

const {
  sortedItems: sortedCurrentTabActivities,
  isSortActive: isActivitySortActive,
  toggleSort: toggleActivitySort,
  getSortAriaSort: getActivitySortAriaSort,
  getSortButtonLabel: getActivitySortButtonLabel,
  getSortIndicator: getActivitySortIndicator,
} = useTableSort(currentTabFilteredActivities, activityTableColumns, {
  key: 'activityPeriod',
  direction: 'desc',
})

const {
  page,
  pageSize,
  totalPages,
  paginatedItems: paginatedActivities,
  goToPreviousPage,
  goToNextPage,
} = useTablePagination(sortedCurrentTabActivities, { pageSizeOptions })

const paginationSummary = computed(() => {
  if (isLoading.value) return '正在讀取活動資料...'

  if (!sortedCurrentTabActivities.value.length) {
    return activeActivityListTab.value?.emptyText || '目前沒有符合條件的活動'
  }

  const start = (page.value - 1) * pageSize.value + 1
  const end = Math.min(
    start + pageSize.value - 1,
    sortedCurrentTabActivities.value.length,
  )
  return `第 ${start}-${end} 筆，共 ${sortedCurrentTabActivities.value.length} 筆`
})

const selectActivityTab = (tabKey) => {
  const targetTab = activityTabs.value.find((tab) => tab.key === tabKey)

  if (!targetTab || targetTab.isActive) return

  activeActivityListTabKey.value = targetTab.key
  page.value = 1
}

const selectActivityTabByIndex = (index) => {
  const totalTabs = activityTabs.value.length
  if (!totalTabs) return

  const normalizedIndex = (index + totalTabs) % totalTabs
  const targetTab = activityTabs.value[normalizedIndex]

  selectActivityTab(targetTab?.key)

  nextTick(() => {
    activityTabButtons.value[normalizedIndex]?.focus()
  })
}

const handleActivityTabKeydown = (event) => {
  const activeIndex = activityTabs.value.findIndex((tab) => tab.isActive)
  const currentIndex = activeIndex >= 0 ? activeIndex : 0

  if (event.key === 'ArrowRight') {
    event.preventDefault()
    selectActivityTabByIndex(currentIndex + 1)
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault()
    selectActivityTabByIndex(currentIndex - 1)
  } else if (event.key === 'Home') {
    event.preventDefault()
    selectActivityTabByIndex(0)
  } else if (event.key === 'End') {
    event.preventDefault()
    selectActivityTabByIndex(activityTabs.value.length - 1)
  }
}

const selectPageSize = (size) => {
  pageSize.value = Number(size)
  openFilterSelectKey.value = ''
}

const copyActivityFormLink = async (activity) => {
  if (!activity?.id) {
    errorMessage.value = '找不到活動編號，無法複製前台表單連結。'
    return
  }

  errorMessage.value = ''
  statusMessage.value = ''

  try {
    await copyTextToClipboard(buildActivityFormUrl(activity.id))
    statusMessage.value = '已複製前台表單連結。'
  } catch {
    errorMessage.value = '複製前台表單連結失敗，請確認瀏覽器允許剪貼簿權限。'
  }
}

const deleteEditingActivity = async () => {
  if (!editingActivityId.value) return

  const wasDeleted = await deleteActivity(
    editingActivity.value || {
      id: editingActivityId.value,
      name: form.name,
    },
  )

  if (wasDeleted) {
    closeDialog()
  }
}

const openProductManagement = (activity) => {
  router.push({
    name: 'ActivityProducts',
    params: { activityId: activity.id },
  })
}

const isAnyDialogOpen = computed(
  () =>
    isDialogOpen.value ||
    isTrashDialogOpen.value ||
    isNoteDialogOpen.value ||
    isDeleteConfirmDialogOpen.value,
)

useDialogScrollLock(isAnyDialogOpen)

onMounted(() => {
  loadActivities()
  loadActivityTypes()
  loadAnimateTypes()
})

watch(
  searchFilters,
  () => {
    page.value = 1
  },
  { deep: true },
)
</script>

<template>
  <PageShell class="activity-management-page">
    <MessageBlock v-if="statusMessage" tone="success" module="activity">{{ statusMessage }}</MessageBlock>
    <MessageBlock v-if="errorMessage && !isDialogOpen">{{ errorMessage }}</MessageBlock>

    <PanelCard accent>
      <div class="activity-panel-heading">
        <div class="activity-page-title">
          <div class="activity-title-row">
            <span class="management-title-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path
                  v-for="path in activityTitleIconPaths"
                  :key="path"
                  :d="path"
                />
              </svg>
            </span>
            <h1>活動管理</h1>
          </div>
        </div>

        <div class="activity-panel-actions">
          <IconButton
            class="activity-toolbar-icon activity-toolbar-icon--create"
            variant="table"
            aria-label="新增活動"
            title="新增活動"
            @click="openCreateDialog"
          >
            <svg class="table-button-svg" viewBox="0 0 24 24" aria-hidden="true">
              <path
                v-for="path in plusIconPaths"
                :key="path"
                :d="path"
              />
            </svg>
          </IconButton>
          <IconButton
            class="activity-toolbar-icon activity-toolbar-icon--trash"
            variant="table"
            :disabled="isLoadingDeletedActivities"
            aria-label="垃圾桶"
            title="垃圾桶"
            @click="openTrashDialog"
          >
            <svg class="table-button-svg" viewBox="0 0 24 24" aria-hidden="true">
              <path
                v-for="path in trashIconPaths"
                :key="path"
                :d="path"
              />
            </svg>
          </IconButton>
          <CountBadge tone="activity">{{ totalActivitiesLabel }}</CountBadge>
        </div>
      </div>

      <section class="activity-filter-panel" aria-label="活動搜尋條件">
        <div class="activity-filter-grid">
          <label class="activity-filter-field">
            <span>活動名稱</span>
            <input
              v-model.trim="searchFilters.name"
              type="text"
              placeholder="請輸入活動名稱"
            />
          </label>

          <label class="activity-filter-field">
            <span>地點</span>
            <input
              v-model.trim="searchFilters.address"
              type="text"
              placeholder="請輸入地點"
            />
          </label>

          <div class="activity-filter-field">
            <span>活動類型</span>
            <CustomSelect
              :label="getFilterActivityTypeLabel()"
              :open="isFilterSelectOpen('activityTypeIds')"
              :disabled="isLoadingActivityTypes"
              @toggle="toggleFilterSelect('activityTypeIds', isLoadingActivityTypes)"
            >
              <button class="custom-select-option custom-select-option--action" type="button" @click="clearFilterType('activityTypeIds')">
                清除活動類型
              </button>
              <label
                v-for="activityType in activityTypes"
                :key="activityType.id"
                class="custom-select-option custom-select-checkbox-option"
                :class="{ 'is-selected': isTypeSelected('activityTypeIds', activityType.id) }"
              >
                <input
                  :checked="isTypeSelected('activityTypeIds', activityType.id)"
                  type="checkbox"
                  @change="toggleFilterType('activityTypeIds', activityType.id)"
                />
                <span>{{ activityType.name || `#${activityType.id}` }}</span>
              </label>
            </CustomSelect>
          </div>

          <div class="activity-filter-field">
            <span>動漫</span>
            <CustomSelect
              :label="getFilterAnimateTypeLabel()"
              :open="isFilterSelectOpen('animateTypeIds')"
              :disabled="isLoadingAnimateTypes"
              @toggle="toggleFilterSelect('animateTypeIds', isLoadingAnimateTypes)"
            >
              <button class="custom-select-option custom-select-option--action" type="button" @click="clearFilterType('animateTypeIds')">
                清除動漫
              </button>
              <label
                v-for="animateType in animateTypes"
                :key="animateType.id"
                class="custom-select-option custom-select-checkbox-option"
                :class="{ 'is-selected': isTypeSelected('animateTypeIds', animateType.id) }"
              >
                <input
                  :checked="isTypeSelected('animateTypeIds', animateType.id)"
                  type="checkbox"
                  @change="toggleFilterType('animateTypeIds', animateType.id)"
                />
                <span>{{ animateType.name || `#${animateType.id}` }}</span>
              </label>
            </CustomSelect>
          </div>

          <DateRangePicker
            label="活動時間"
            :open="isFilterRangeOpen('activity')"
            :range-label="filterActivityRangeLabel"
            :month-label="getFilterRangeMonthLabel('activity')"
            :weekdays="calendarWeekdays"
            :days="getFilterRangeCalendarDays('activity')"
            :start-label="filterActivityStartLabel"
            :end-label="filterActivityEndLabel"
            :is-day-start="(date) => isFilterRangeDayStart('activity', date)"
            :is-day-end="(date) => isFilterRangeDayEnd('activity', date)"
            :is-day-in-range="(date) => isFilterRangeDayInRange('activity', date)"
            :is-day-selected="(date) => isFilterRangeDaySelected('activity', date)"
            @toggle="toggleFilterRangePicker('activity')"
            @shift="shiftFilterRangeMonth('activity', $event)"
            @select="handleFilterRangeSelect('activity', $event)"
            @close="closeFilterRangePicker()"
          />

          <DateRangePicker
            label="官方出貨期間"
            :open="isFilterRangeOpen('officialShipping')"
            :range-label="filterOfficialShippingRangeLabel"
            :month-label="getFilterRangeMonthLabel('officialShipping')"
            :weekdays="calendarWeekdays"
            :days="getFilterRangeCalendarDays('officialShipping')"
            :start-label="filterOfficialShippingStartLabel"
            :end-label="filterOfficialShippingEndLabel"
            :is-day-start="(date) => isFilterRangeDayStart('officialShipping', date)"
            :is-day-end="(date) => isFilterRangeDayEnd('officialShipping', date)"
            :is-day-in-range="(date) => isFilterRangeDayInRange('officialShipping', date)"
            :is-day-selected="(date) => isFilterRangeDaySelected('officialShipping', date)"
            @toggle="toggleFilterRangePicker('officialShipping')"
            @shift="shiftFilterRangeMonth('officialShipping', $event)"
            @select="handleFilterRangeSelect('officialShipping', $event)"
            @close="closeFilterRangePicker()"
          />
        </div>

        <div class="activity-filter-actions">
          <div class="activity-filter-summary">
            {{ hasFiltersApplied ? `篩選後 ${filteredActivitiesCount} 筆` : '顯示全部活動' }}
          </div>
          <AppButton pill :disabled="!hasFiltersApplied" @click="clearSearchFilters">
            清除條件
          </AppButton>
        </div>
      </section>

      <div class="activity-tabs" role="tablist" aria-label="活動狀態">
        <button
          v-for="tab in activityTabs"
          :key="tab.key"
          :id="tab.tabId"
          ref="activityTabButtons"
          class="activity-tab"
          :class="{ 'is-active': tab.isActive }"
          type="button"
          role="tab"
          :aria-selected="tab.isActive"
          :aria-controls="tab.panelId"
          :tabindex="tab.isActive ? 0 : -1"
          @click="selectActivityTab(tab.key)"
          @keydown="handleActivityTabKeydown"
        >
          <span>{{ tab.label }}</span>
          <span class="activity-tab__count">{{ tab.count }} 筆</span>
        </button>
      </div>

      <section
        v-for="tab in activityTabs"
        v-show="tab.isActive"
        :id="tab.panelId"
        :key="tab.key"
        class="activity-tab-panel"
        role="tabpanel"
        :aria-labelledby="tab.tabId"
        :tabindex="tab.isActive ? 0 : -1"
      >
        <template v-if="tab.isActive">
          <ActivityTable
            :activities="paginatedActivities"
            :columns="activityTableColumns"
            :is-loading="isLoading"
            :empty-text="tab.emptyText"
            :edit-icon-paths="editIconPaths"
            :copy-icon-paths="copyIconPaths"
            :form-link-icon-paths="formLinkIconPaths"
            :product-icon-paths="productIconPaths"
            :get-activity-type-name="getActivityTypeName"
            :get-animate-type-name="getAnimateTypeName"
            :strip-html="stripHtml"
            :sanitize-html="sanitizeHtml"
            :is-sort-active="isActivitySortActive"
            :get-sort-aria-sort="getActivitySortAriaSort"
            :get-sort-button-label="getActivitySortButtonLabel"
            :get-sort-indicator="getActivitySortIndicator"
            @sort="toggleActivitySort"
            @open-note="openNoteDialog"
            @edit="openEditDialog"
            @copy="openCopyDialog"
            @copy-form-link="copyActivityFormLink"
            @manage-products="openProductManagement"
          />

          <div class="activity-pagination" aria-label="活動分頁">
            <div class="activity-pagination-summary">{{ paginationSummary }}</div>

            <div class="activity-pagination-actions">
              <div class="activity-page-size">
                <span>每頁</span>
                <CustomSelect
                  :label="String(pageSize)"
                  :open="isFilterSelectOpen('pageSize')"
                  @toggle="toggleFilterSelect('pageSize')"
                >
                  <button
                    v-for="size in pageSizeOptions"
                    :key="size"
                    class="custom-select-option"
                    type="button"
                    @click="selectPageSize(size)"
                  >
                    {{ size }}
                  </button>
                </CustomSelect>
              </div>

              <AppButton pill :disabled="page <= 1" @click="goToPreviousPage">
                上一頁
              </AppButton>
              <span class="activity-page-indicator">{{ page }} / {{ totalPages }}</span>
              <AppButton pill :disabled="page >= totalPages" @click="goToNextPage">
                下一頁
              </AppButton>
            </div>
          </div>
        </template>
      </section>
    </PanelCard>

    <ActivityFormDialog
      v-if="isDialogOpen"
      :form="form"
      :editing-activity-id="editingActivityId"
      :form-mode="formMode"
      :is-saving="isSaving"
      :deleting-activity-id="deletingActivityId"
      :error-message="errorMessage"
      :activity-types="activityTypes"
      :animate-types="animateTypes"
      :activity-status-options="activityStatusOptions"
      :is-loading-activity-types="isLoadingActivityTypes"
      :is-loading-animate-types="isLoadingAnimateTypes"
      :selected-image-file="selectedImageFile"
      :activity-image-preview="activityImagePreview"
      :calendar-weekdays="calendarWeekdays"
      :is-range-open="isRangeOpen"
      :get-activity-range-label="getActivityRangeLabel"
      :get-official-shipping-range-label="getOfficialShippingRangeLabel"
      :get-range-month-label="getRangeMonthLabel"
      :get-range-calendar-days="getRangeCalendarDays"
      :is-range-day-start="isRangeDayStart"
      :is-range-day-end="isRangeDayEnd"
      :is-range-day-in-range="isRangeDayInRange"
      :is-range-day-selected="isRangeDaySelected"
      :get-range-start-label="getRangeStartLabel"
      :get-range-end-label="getRangeEndLabel"
      :is-select-open="isSelectOpen"
      :get-activity-type-select-label="getActivityTypeSelectLabel"
      :get-animate-type-select-label="getAnimateTypeSelectLabel"
      :get-status-select-label="getStatusSelectLabel"
      @close="closeDialog"
      @submit="saveActivity"
      @delete="deleteEditingActivity"
      @toggle-range="toggleRangePicker"
      @shift-range="shiftRangeMonth"
      @select-range-date="handleFormRangeSelect"
      @close-range="closeRangePicker"
      @toggle-select="toggleCustomSelect"
      @select-option="selectCustomOption"
      @image-change="onActivityImageChange"
    />

    <ActivityTrashDialog
      v-if="isTrashDialogOpen"
      :activities="deletedActivities"
      :is-loading="isLoadingDeletedActivities"
      :error-message="trashErrorMessage"
      :restoring-activity-id="restoringActivityId"
      @close="closeTrashDialog"
      @restore="restoreActivity"
    />

    <ActivityNoteDialog
      v-if="isNoteDialogOpen"
      :title="selectedNoteTitle"
      :html="selectedNoteHtml"
      @close="closeNoteDialog"
    />

    <ActivityDeleteConfirmDialog
      v-if="isDeleteConfirmDialogOpen"
      :activity="pendingDeleteActivity"
      @close="resolveDeleteConfirm(false)"
      @confirm="resolveDeleteConfirm(true)"
    />
  </PageShell>
</template>

<style scoped lang="scss" src="../styles/activity-list.scss"></style>
