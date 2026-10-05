<script setup>
import { onMounted, ref } from 'vue'
import CustomSelect from '@/shared/components/CustomSelect.vue'
import MessageBlock from '@/shared/components/MessageBlock.vue'
import AppButton from '@/shared/components/AppButton.vue'
import WishPoolDecisionConfirmDialog from '@/modules/wishPool/components/WishPoolDecisionConfirmDialog.vue'
import WishPoolTable from '@/modules/wishPool/components/WishPoolTable.vue'
import { useWishPools } from '@/modules/wishPool/composables/useWishPools'
import { useConfirmDialog } from '@/shared/composables/useConfirmDialog'
import { formatDateTime } from '@/shared/utils/format'
import { getWishPoolTabCount } from '@/modules/wishPool/utils/wishPoolDecisions'

const errorMessage = ref('')
const statusMessage = ref('')

const {
  isConfirmDialogOpen,
  pendingConfirmTarget,
  requestConfirm,
  resolveConfirm,
} = useConfirmDialog()

const {
  items,
  counts,
  page: currentPage,
  pageSize,
  totalPages,
  keywordInput,
  isLoading,
  updatingId,
  openSelectKey,
  activeTabKey,
  paginationSummary,
  pageSizeOptions,
  tabs,
  loadWishPools,
  search,
  selectTab,
  selectPageSize,
  goToPage,
  updateDecision,
} = useWishPools({ errorMessage, statusMessage })

const requestDecisionUpdate = async (item, decision) => {
  const confirmed = await requestConfirm({ item, decision })
  if (!confirmed) return
  await updateDecision(item, decision)
}

const starIconPaths = [
  'M12 3l2.2 6.4H21l-5.4 3.9 2.1 6.4L12 16.2 6.3 19.7l2.1-6.4L3 9.4h6.8L12 3Z',
]

onMounted(loadWishPools)
</script>

<template>
  <div class="wish-pool-management-page">
    <div class="wish-pool-hero">
      <div class="wish-pool-hero__title">
        <span class="wish-pool-hero__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path v-for="p in starIconPaths" :key="p" :d="p" />
          </svg>
        </span>
        <div>
          <p class="section-eyebrow">營運</p>
          <h1>許願池管理</h1>
        </div>
      </div>
    </div>

    <MessageBlock v-if="errorMessage" tone="error">{{ errorMessage }}</MessageBlock>
    <MessageBlock v-if="statusMessage" tone="success">{{ statusMessage }}</MessageBlock>

    <section class="wish-pool-panel">
      <div class="wish-pool-panel-heading">
        <div class="wish-pool-panel-heading__left">
          <h2>許願列表</h2>
          <span class="total-pill">{{ counts.all || 0 }} 筆</span>
        </div>
      </div>

      <form class="wish-pool-filter-panel" @submit.prevent="search">
        <div class="wish-pool-filter-bar">
          <label>
            <span>搜尋活動或作品</span>
            <input
              v-model="keywordInput"
              type="search"
              maxlength="200"
              placeholder="活動名稱或作品名稱"
            />
          </label>
          <button class="wp-search-button" type="submit">查詢</button>
        </div>
      </form>

      <div class="wish-pool-tabs" role="tablist" aria-label="開團回覆">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="wish-pool-tab"
          :class="{ 'wish-pool-tab--active': tab.key === activeTabKey }"
          type="button"
          role="tab"
          :aria-selected="tab.key === activeTabKey"
          @click="selectTab(tab.key)"
        >
          <span>{{ tab.label }}</span>
          <span class="wish-pool-tab__count">{{ getWishPoolTabCount(counts, tab.countKey) }}</span>
        </button>
      </div>

      <WishPoolTable
        :items="items"
        :is-loading="isLoading"
        :updating-id="updatingId"
        :format-date-time="formatDateTime"
        @update-decision="requestDecisionUpdate"
      />

      <div class="wish-pool-pager">
        <span class="wish-pool-pager__summary">{{ paginationSummary }}</span>
        <div class="wish-pool-pager__actions">
          <div class="wish-pool-page-size">
            <span>每頁</span>
            <CustomSelect
              :label="String(pageSize)"
              :open="openSelectKey === 'pageSize'"
              @toggle="openSelectKey = openSelectKey === 'pageSize' ? '' : 'pageSize'"
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
          <AppButton pill :disabled="currentPage <= 1 || isLoading" @click="goToPage(currentPage - 1)">上一頁</AppButton>
          <span class="wish-pool-page-indicator">{{ currentPage }} / {{ Math.max(1, totalPages) }}</span>
          <AppButton pill :disabled="currentPage >= totalPages || isLoading" @click="goToPage(currentPage + 1)">下一頁</AppButton>
        </div>
      </div>
    </section>

    <WishPoolDecisionConfirmDialog
      v-if="isConfirmDialogOpen"
      :item="pendingConfirmTarget?.item"
      :decision="pendingConfirmTarget?.decision"
      :is-saving="Boolean(updatingId)"
      @close="resolveConfirm(false)"
      @confirm="resolveConfirm(true)"
    />
  </div>
</template>

<style scoped lang="scss" src="../styles/wish-pool-list.scss"></style>
