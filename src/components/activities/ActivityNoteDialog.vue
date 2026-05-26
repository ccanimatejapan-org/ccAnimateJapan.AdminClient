<script setup>
import IconButton from '@/components/ui/IconButton.vue'

defineProps({
  title: {
    type: String,
    required: true,
  },
  html: {
    type: String,
    default: '',
  },
})

defineEmits(['close'])
</script>

<template>
  <div class="modal-backdrop">
    <section class="note-dialog" role="dialog" aria-modal="true" aria-labelledby="note-dialog-title">
      <div class="dialog-heading">
        <div>
          <h2 id="note-dialog-title">{{ title }}</h2>
        </div>
        <IconButton variant="soft-close" aria-label="關閉" @click="$emit('close')">×</IconButton>
      </div>

      <div class="note-dialog-content" v-html="html"></div>
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

.note-dialog {
  display: grid;
  align-content: start;
  grid-template-rows: auto minmax(0, 1fr);
  width: min(100%, 680px);
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

.note-dialog-content {
  min-height: 0;
  max-height: none;
  overflow: auto;
  border: 1px solid #eaded2;
  border-radius: 14px;
  background: #fffdf9;
  color: #384942;
  font-size: 0.95rem;
  font-weight: 500;
  line-height: 1.75;
  padding: 18px;
}

.note-dialog-content :deep(p),
.note-dialog-content :deep(div) {
  margin: 0 0 10px;
}

.note-dialog-content :deep(ul),
.note-dialog-content :deep(ol) {
  margin: 8px 0;
  padding-left: 24px;
}

.note-dialog-content :deep(strong) {
  font-weight: 850;
}

.note-dialog-content :deep(u) {
  text-decoration: underline;
}

@media (max-width: 560px) {
  .note-dialog {
    padding: 18px;
  }
}
</style>
