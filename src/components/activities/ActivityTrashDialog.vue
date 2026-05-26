<script setup>
import IconButton from '@/components/ui/IconButton.vue'
import MessageBlock from '@/components/ui/MessageBlock.vue'

defineProps({
  activities: {
    type: Array,
    required: true,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: '',
  },
  restoringActivityId: {
    type: [Number, String],
    default: null,
  },
})

defineEmits(['close', 'restore'])
</script>

<template>
  <div class="modal-backdrop">
    <section
      class="trash-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trash-dialog-title"
    >
      <div class="dialog-heading">
        <div>
          <h2 id="trash-dialog-title">垃圾桶</h2>
        </div>
        <IconButton variant="soft-close" aria-label="關閉" @click="$emit('close')">×</IconButton>
      </div>

      <MessageBlock v-if="errorMessage">{{ errorMessage }}</MessageBlock>

      <div class="trash-list">
        <MessageBlock v-if="isLoading" tone="empty">正在讀取已刪除活動...</MessageBlock>
        <MessageBlock v-else-if="!activities.length" tone="empty">目前沒有已刪除活動。</MessageBlock>
        <template v-else>
          <article v-for="activity in activities" :key="activity.id" class="trash-activity-row">
            <img class="trash-activity-thumb" :src="activity.image" :alt="activity.name || '活動圖片'" />
            <div class="trash-activity-info">
              <h3>{{ activity.name || '-' }}</h3>
              <div class="trash-time-grid">
                <span>開始</span>
                <strong>{{ activity.activityStartDate || '-' }}</strong>
                <span>結束</span>
                <strong>{{ activity.activityEndDate || '-' }}</strong>
              </div>
            </div>
            <button
              class="table-action-button"
              type="button"
              :disabled="restoringActivityId === activity.id"
              @click="$emit('restore', activity)"
            >
              {{ restoringActivityId === activity.id ? '還原中...' : '還原' }}
            </button>
          </article>
        </template>
      </div>
    </section>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: grid;
  place-items: center;
  background: rgb(19 32 28 / 46%);
  padding: 24px;
}

.trash-dialog {
  display: grid;
  align-content: start;
  grid-template-rows: auto auto minmax(0, 1fr);
  width: min(100%, 720px);
  height: 80vh;
  max-height: 80vh;
  overflow: hidden;
  gap: 20px;
  border: 1px solid #eaded2;
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgb(255 255 255 / 96%), rgb(255 250 244 / 98%)),
    #ffffff;
  box-shadow: 0 26px 76px rgb(114 74 56 / 22%);
  padding: 28px;
}

.dialog-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  border-bottom: 1px solid #f0e5dc;
  padding-bottom: 16px;
}

.dialog-heading h2 {
  margin: 0;
  color: #13201c;
  font-size: 1.45rem;
  line-height: 1.25;
}

.trash-list {
  display: grid;
  align-content: start;
  min-height: 0;
  overflow: auto;
  padding-right: 4px;
  scrollbar-gutter: stable;
  gap: 12px;
}

.trash-activity-row {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  border: 1px solid #eaded2;
  border-radius: 16px;
  background: #fffdf9;
  box-shadow: 0 12px 28px rgb(114 74 56 / 8%);
  padding: 12px;
}

.trash-activity-thumb {
  display: block;
  width: 96px;
  height: 64px;
  border-radius: 6px;
  background: #e8eee9;
  object-fit: cover;
}

.trash-activity-info {
  display: grid;
  min-width: 0;
  gap: 8px;
}

.trash-activity-info h3 {
  margin: 0;
  overflow: hidden;
  color: #13201c;
  font-size: 1rem;
  font-weight: 850;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.trash-time-grid {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  column-gap: 8px;
  row-gap: 4px;
  color: #59665f;
  font-size: 0.86rem;
}

.trash-time-grid span {
  font-weight: 800;
}

.trash-time-grid strong {
  min-width: 0;
  color: #25352f;
  font-weight: 750;
}

.table-action-button {
  min-height: 34px;
  border: 1px solid #e8d8c8;
  border-radius: 999px;
  background: #fffdf9;
  color: #1f6154;
  font-size: 0.86rem;
  font-weight: 850;
  padding: 0 12px;
  white-space: nowrap;
}

.table-action-button:hover {
  border-color: #277867;
  box-shadow: 0 8px 18px rgb(39 120 103 / 10%);
}

.table-action-button:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

@media (max-width: 560px) {
  .trash-dialog {
    padding: 18px;
  }

  .trash-list {
    padding-right: 2px;
  }

  .trash-activity-row {
    grid-template-columns: 80px minmax(0, 1fr);
  }

  .trash-activity-thumb {
    width: 80px;
    height: 56px;
  }

  .trash-activity-row .table-action-button {
    grid-column: 1 / -1;
    width: 100%;
  }
}
</style>
