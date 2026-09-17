<script setup>
import AppButton from '@/shared/components/AppButton.vue'
import IconButton from '@/shared/components/IconButton.vue'
import { getCustomerDisplayName } from '@/modules/customer/utils/customerFilters'

const props = defineProps({
  customer: { type: Object, default: null },
  isDelete: { type: Boolean, default: true },
  isSaving: { type: Boolean, default: false },
})

defineEmits(['close', 'confirm'])

const title = props.isDelete ? '停用顧客' : '恢復顧客'
</script>

<template>
  <div class="modal-backdrop">
    <section class="customer-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="customer-confirm-title">
      <div class="customer-confirm-heading">
        <h2 id="customer-confirm-title">{{ title }}</h2>
        <IconButton variant="soft-close" aria-label="關閉" :disabled="isSaving" @click="$emit('close')">×</IconButton>
      </div>
      <p class="customer-confirm-copy">
        <template v-if="isDelete">確定停用「{{ getCustomerDisplayName(customer) }}」？停用後不會刪除歷史訂單，只是從使用中名單隱藏。</template>
        <template v-else>確定恢復「{{ getCustomerDisplayName(customer) }}」為使用中顧客？</template>
      </p>
      <div class="customer-confirm-actions">
        <AppButton pill :disabled="isSaving" @click="$emit('close')">取消</AppButton>
        <button
          class="customer-confirm-button"
          :class="{ 'is-danger': isDelete }"
          type="button"
          :disabled="isSaving"
          @click="$emit('confirm')"
        >
          {{ isSaving ? '處理中...' : (isDelete ? '確認停用' : '確認恢復') }}
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
  background: rgb(36 22 14 / 46%);
  padding: 24px;
}
.customer-confirm-dialog {
  display: grid;
  width: min(100%, 460px);
  gap: 20px;
  border: 1px solid #d2b496;
  border-radius: 18px;
  background: linear-gradient(135deg, rgb(255 255 255 / 96%), rgb(255 248 220 / 98%)), #ffffff;
  box-shadow: 0 26px 76px rgb(92 56 32 / 22%);
  padding: 28px;
}
.customer-confirm-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  border-bottom: 1px solid #e4d2bc;
  padding-bottom: 16px;
}
.customer-confirm-heading h2 {
  margin: 0;
  color: #3d2618;
  font-size: 1.45rem;
  line-height: 1.25;
}
.customer-confirm-copy {
  margin: 0;
  border-radius: 8px;
  background: #f4e9dc;
  color: #5a4030;
  line-height: 1.65;
  padding: 14px 16px;
}
.customer-confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
.customer-confirm-button {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 999px;
  background: #5c3820;
  color: #f4eadc;
  font-weight: 800;
  padding: 0 18px;
}
.customer-confirm-button.is-danger {
  background: #b84d55;
  color: #ffffff;
}
.customer-confirm-button:disabled {
  opacity: 0.7;
}
@media (max-width: 560px) {
  .customer-confirm-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
