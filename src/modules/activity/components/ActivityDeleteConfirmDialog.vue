<script setup>
import AppButton from '@/shared/components/AppButton.vue'
import IconButton from '@/shared/components/IconButton.vue'

defineProps({
  activity: {
    type: Object,
    default: null,
  },
})

defineEmits(['close', 'confirm'])
</script>

<template>
  <div class="modal-backdrop">
    <section
      class="delete-confirm-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
    >
      <div class="dialog-heading">
        <div>
          <h2 id="delete-dialog-title">確認刪除活動</h2>
        </div>
        <IconButton variant="soft-close" aria-label="關閉" @click="$emit('close')">×</IconButton>
      </div>

      <p class="delete-dialog-copy">
        確定要刪除「{{ activity?.name || `#${activity?.id || ''}` }}」嗎？
      </p>

      <div class="dialog-actions">
        <AppButton pill @click="$emit('close')">取消</AppButton>
        <AppButton class="delete-dialog-button--muted" pill @click="$emit('confirm')">刪除</AppButton>
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

.delete-confirm-dialog {
  display: grid;
  align-content: start;
  grid-template-rows: auto auto auto;
  width: min(100%, 460px);
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

.delete-dialog-copy {
  margin: 0;
  background: #fffdf9;
  color: #3d3832;
  line-height: 1.65;
  padding: 14px 16px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.delete-dialog-button--muted.app-button--pill {
  border-color: #d6dde3;
  background: #eef1f3;
  color: #4b5563;
}

.delete-dialog-button--muted.app-button--pill:hover:not(:disabled) {
  border-color: #b9c2ca;
  background: #e2e7ea;
  color: #374151;
}

@media (max-width: 560px) {
  .delete-confirm-dialog {
    padding: 18px;
  }

  .dialog-actions {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
