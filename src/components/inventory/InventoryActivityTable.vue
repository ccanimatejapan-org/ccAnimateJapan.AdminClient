<script setup>
import MessageBlock from '@/components/ui/MessageBlock.vue'

const props = defineProps({
  activities: {
    type: Array,
    required: true,
  },
  selectedActivityId: {
    type: [Number, String],
    default: '',
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['select'])

const fallbackActivityImage = '/cc-admin-mark.svg'

const isSelected = (activity) => Number(activity.id) === Number(props.selectedActivityId)

const handleActivityImageError = (event) => {
  if (event.target.src.endsWith(fallbackActivityImage)) return

  event.target.src = fallbackActivityImage
}
</script>

<template>
  <aside class="inventory-activity-panel">
    <div class="inventory-panel-title">
      <h2>活動</h2>
      <span>{{ activities.length }}</span>
    </div>

    <MessageBlock v-if="isLoading" tone="empty">正在載入活動...</MessageBlock>
    <MessageBlock v-else-if="!activities.length" tone="empty">目前沒有活動。</MessageBlock>

    <div v-else class="inventory-activity-list">
      <button
        v-for="activity in activities"
        :key="activity.id"
        type="button"
        class="inventory-activity-item"
        :class="{ 'inventory-activity-item--active': isSelected(activity) }"
        @click="$emit('select', activity.id)"
      >
        <img
          class="inventory-activity-image"
          :src="activity.image || fallbackActivityImage"
          :alt="activity.name"
          @error="handleActivityImageError"
        />
        <span class="inventory-activity-name">{{ activity.name || `活動 #${activity.id}` }}</span>
        <span
          class="inventory-kind-badge"
          :class="{ 'inventory-kind-badge--preorder': activity.isPreOrder }"
        >
          {{ activity.preOrderText }}
        </span>
        <span class="inventory-activity-time">
          {{ activity.activityStartDate || '-' }} - {{ activity.activityEndDate || '-' }}
        </span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.inventory-activity-panel {
  position: relative;
  min-width: 0;
  overflow: hidden;
  border: 1px solid #d8e6de;
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgb(255 255 255 / 96%), rgb(243 249 246 / 98%)),
    #ffffff;
  box-shadow: 0 18px 44px rgb(39 120 103 / 10%);
  padding: 22px;
}

.inventory-activity-panel::before {
  position: absolute;
  inset: 0 0 auto;
  height: 5px;
  background: #277867;
  content: '';
}

.inventory-panel-title {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.inventory-panel-title h2 {
  margin: 0;
  color: #13201c;
  font-size: 1.15rem;
  line-height: 1.25;
}

.inventory-panel-title span {
  display: inline-flex;
  min-width: 34px;
  min-height: 28px;
  align-items: center;
  justify-content: center;
  border: 1px solid #bfd8cb;
  border-radius: 999px;
  background: #f0faf4;
  color: #22614c;
  font-size: 0.82rem;
  font-weight: 900;
  padding: 4px 10px;
}

.inventory-activity-list {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 10px;
}

.inventory-activity-item {
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  border: 1px solid #d8e6de;
  border-radius: 14px;
  background: #ffffff;
  color: inherit;
  cursor: pointer;
  font: inherit;
  padding: 10px;
  text-align: left;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
}

.inventory-activity-item:hover,
.inventory-activity-item--active {
  border-color: #277867;
  box-shadow: 0 10px 24px rgb(39 120 103 / 12%);
  transform: translateY(-1px);
}

.inventory-activity-item--active {
  background: #f0faf4;
}

.inventory-activity-image {
  grid-row: span 3;
  width: 58px;
  height: 58px;
  border: 1px solid #d8e6de;
  border-radius: 12px;
  background: #e8eee9;
  object-fit: cover;
}

.inventory-activity-name {
  min-width: 0;
  overflow: hidden;
  color: #13201c;
  font-size: 0.95rem;
  font-weight: 850;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.inventory-kind-badge {
  display: inline-flex;
  min-height: 26px;
  align-items: center;
  justify-content: center;
  border: 1px solid #f3c98b;
  border-radius: 999px;
  background: #fff7e8;
  color: #9a5b12;
  font-size: 0.78rem;
  font-weight: 850;
  padding: 3px 9px;
}

.inventory-kind-badge--preorder {
  border-color: #b9c7f2;
  background: #f3f6ff;
  color: #334c9f;
}

.inventory-activity-time {
  grid-column: 2 / 4;
  color: #5e786f;
  font-size: 0.8rem;
  font-weight: 650;
  line-height: 1.45;
}

@media (max-width: 720px) {
  .inventory-activity-panel {
    padding: 18px;
  }
}
</style>
