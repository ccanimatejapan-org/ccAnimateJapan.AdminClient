<script setup>
import AppButton from '@/shared/components/AppButton.vue'
import IconButton from '@/shared/components/IconButton.vue'

defineProps({
  product: {
    type: Object,
    default: null,
  },
  isDeleting: {
    type: Boolean,
    default: false,
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
      aria-labelledby="product-delete-dialog-title"
    >
      <div class="dialog-heading">
        <div>
          <h2 id="product-delete-dialog-title">確認刪除商品</h2>
        </div>
        <IconButton variant="soft-close" aria-label="關閉" :disabled="isDeleting" @click="$emit('close')">×</IconButton>
      </div>

      <p class="delete-dialog-copy">
        確定要刪除「{{ product?.name || `#${product?.id || ''}` }}」嗎？此動作會永久刪除商品與其圖片，無法還原。
      </p>

      <div class="dialog-actions">
        <AppButton pill :disabled="isDeleting" @click="$emit('close')">取消</AppButton>
        <AppButton class="delete-dialog-button--muted" pill :disabled="isDeleting" @click="$emit('confirm')">
          {{ isDeleting ? '刪除中...' : '刪除' }}
        </AppButton>
      </div>
    </section>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 30;
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
  border: 1px solid #d8e6de;
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgb(255 255 255 / 96%), rgb(243 249 246 / 98%)),
    #ffffff;
  box-shadow: 0 26px 76px rgb(39 120 103 / 18%);
  padding: 28px;
}

.dialog-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  border-bottom: 1px solid #e3eee8;
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
  background: #f8fcfa;
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


:deep(.form-field input),
:deep(.form-field select),
:deep(.form-field textarea) {
  border-color: #d8e6de;
  background: #f8fcfa;
}

:deep(.form-field input:focus),
:deep(.form-field select:focus),
:deep(.form-field textarea:focus) {
  border-color: #277867;
  box-shadow: 0 0 0 3px rgb(39 120 103 / 15%);
}

:deep(.icon-button) {
  border-color: #d8e6de;
  background: #f8fcfa;
  color: #1f6154;
}

:deep(.icon-button:hover:not(:disabled)) {
  border-color: #277867;
  color: #1f6154;
}

:deep(.app-button--primary) {
  background: #277867;
}

:deep(.app-button--primary:hover:not(:disabled)) {
  background: #1f6154;
}

:deep(.app-button--pill.app-button--ghost) {
  border-color: #d8e6de;
  background: #f8fcfa;
  color: #1f6154;
}

:deep(.app-button--pill.app-button--ghost:hover:not(:disabled)) {
  border-color: #277867;
  background: #f0faf4;
  color: #1f6154;
}

:deep(.rich-html-editor) {
  border-color: #d8e6de;
  background: #f8fcfa;
}

:deep(.rich-html-toolbar) {
  border-bottom-color: #e3eee8;
  background: #f4fbf7;
}

:deep(.rich-html-toolbar button) {
  border-color: #d8e6de;
  background: #ffffff;
  color: #1f6154;
}

:deep(.rich-html-toolbar button:hover) {
  border-color: #277867;
  color: #1f6154;
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
