<script setup>
import { computed } from 'vue'
import AppButton from '@/shared/components/AppButton.vue'
import IconButton from '@/shared/components/IconButton.vue'
import { getOrderStatusLabel } from '@/modules/order/utils/orderStatuses'

const props = defineProps({
  activityName: {
    type: String,
    default: '',
  },
  orderStatus: {
    type: Number,
    default: 0,
  },
  sourceOrderStatus: {
    type: Number,
    default: null,
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['close', 'confirm'])

const statusLabel = computed(() => getOrderStatusLabel(props.orderStatus))
const sourceLabel = computed(() =>
  props.sourceOrderStatus !== null && props.sourceOrderStatus !== undefined
    ? getOrderStatusLabel(props.sourceOrderStatus)
    : null,
)
</script>

<template>
  <div class="modal-backdrop">
    <section class="bulk-status-dialog" role="dialog" aria-modal="true">
      <div class="dialog-heading">
        <div>
          <h2>批次更新訂單狀態</h2>
        </div>
        <IconButton variant="soft-close" aria-label="關閉" @click="$emit('close')">×</IconButton>
      </div>

      <p class="bulk-dialog-copy">
        將活動「{{ activityName || '（未命名活動）' }}」下
        <template v-if="sourceLabel">目前狀態為 <strong>「{{ sourceLabel }}」</strong> 的訂單</template>
        <template v-else>所有訂單（不含已取消）</template>
        的訂單狀態改為
        <strong>「{{ statusLabel }}」</strong>？此操作無法自動還原。
      </p>

      <div class="dialog-actions">
        <AppButton pill :disabled="isSubmitting" @click="$emit('close')">取消</AppButton>
        <AppButton variant="primary" pill :disabled="isSubmitting" @click="$emit('confirm')">
          {{ isSubmitting ? '更新中...' : `確認改為「${statusLabel}」` }}
        </AppButton>
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

.bulk-status-dialog {
  display: grid;
  align-content: start;
  grid-template-rows: auto auto auto;
  width: min(100%, 480px);
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

.bulk-dialog-copy {
  margin: 0;
  border-radius: 10px;
  background: #fffdf9;
  color: #3d3832;
  line-height: 1.65;
  padding: 14px 16px;
}

.bulk-dialog-copy strong {
  color: #8a5b24;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 560px) {
  .bulk-status-dialog {
    padding: 18px;
  }

  .dialog-actions {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
