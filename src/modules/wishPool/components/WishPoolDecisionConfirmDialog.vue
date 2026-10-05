<script setup>
import AppButton from '@/shared/components/AppButton.vue'
import IconButton from '@/shared/components/IconButton.vue'
import { getWishPoolDecisionLabel } from '@/modules/wishPool/utils/wishPoolDecisions'

defineProps({
  item: {
    type: Object,
    default: null,
  },
  decision: {
    type: String,
    default: '',
  },
  isSaving: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['close', 'confirm'])
</script>

<template>
  <div class="modal-backdrop">
    <section class="wp-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="wp-confirm-title">
      <div class="wp-confirm-heading">
        <h2 id="wp-confirm-title">更新開團回覆</h2>
        <IconButton variant="soft-close" aria-label="關閉" :disabled="isSaving" @click="$emit('close')">×</IconButton>
      </div>
      <p class="wp-confirm-copy">
        確定將「{{ item?.activityName || '#' + (item?.id || '') }}」設為{{ getWishPoolDecisionLabel(decision) }}？
        這只更新回覆狀態，不會建立正式活動或商品。
      </p>
      <div class="wp-confirm-actions">
        <AppButton pill :disabled="isSaving" @click="$emit('close')">取消</AppButton>
        <button class="wp-confirm-button" type="button" :disabled="isSaving" @click="$emit('confirm')">
          {{ isSaving ? '更新中...' : '確認更新' }}
        </button>
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
  background: rgb(20 40 50 / 46%);
  padding: 24px;
}

.wp-confirm-dialog {
  display: grid;
  width: min(100%, 460px);
  gap: 20px;
  border: 1px solid #c4d5de;
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgb(255 255 255 / 96%), rgb(244 250 255 / 98%)),
    #ffffff;
  box-shadow: 0 26px 76px rgb(47 111 143 / 22%);
  padding: 28px;
}

.wp-confirm-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  border-bottom: 1px solid #d4e2ea;
  padding-bottom: 16px;
}

.wp-confirm-heading h2 {
  margin: 0;
  color: #1b4d66;
  font-size: 1.45rem;
  line-height: 1.25;
}

.wp-confirm-copy {
  margin: 0;
  border-radius: 8px;
  background: #f6fafe;
  color: #2a4f63;
  line-height: 1.65;
  padding: 14px 16px;
}

.wp-confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.wp-confirm-button {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  border-radius: 999px;
  background: #2f6f8f;
  color: #ffffff;
  font-weight: 800;
  letter-spacing: 0;
  padding: 0 18px;
  white-space: nowrap;
}

.wp-confirm-button:hover:not(:disabled) {
  background: #1b4d66;
}

.wp-confirm-button:disabled {
  opacity: 0.7;
}

@media (max-width: 560px) {
  .wp-confirm-dialog {
    padding: 18px;
  }

  .wp-confirm-actions {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
