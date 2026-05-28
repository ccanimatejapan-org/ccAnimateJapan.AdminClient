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
  tone: {
    type: String,
    default: 'activity',
  },
})

defineEmits(['close'])
</script>

<template>
  <div class="modal-backdrop">
    <section :class="`note-dialog--${tone}`" class="note-dialog" role="dialog" aria-modal="true" aria-labelledby="note-dialog-title">
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
  --note-border: #eaded2;
  --note-background: rgb(255 250 244 / 98%);
  --note-shadow: rgb(114 74 56 / 22%);
  display: grid;
  align-content: start;
  grid-template-rows: auto minmax(0, 1fr);
  width: min(100%, 680px);
  height: 80vh;
  max-height: 80vh;
  overflow: hidden;
  gap: 20px;
  border: 1px solid var(--note-border);
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgb(255 255 255 / 96%), var(--note-background)),
    #ffffff;
  box-shadow: 0 26px 76px var(--note-shadow);
  padding: 28px;
}

.note-dialog--product,
.note-dialog--inventory {
  --note-border: #d8e6de;
  --note-background: rgb(243 249 246 / 98%);
  --note-shadow: rgb(39 120 103 / 18%);
}

.dialog-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  border-bottom: 1px solid var(--note-border);
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
  border: 1px solid var(--note-border);
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
