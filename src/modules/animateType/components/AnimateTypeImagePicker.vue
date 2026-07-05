<script setup>
defineProps({
  selectedFileName: {
    type: String,
    default: '',
  },
  preview: {
    type: String,
    default: '',
  },
})

defineEmits(['change'])
</script>

<template>
  <div class="animate-type-image-editor">
    <label class="file-drop">
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        @change="$emit('change', $event)"
      />
      <span>{{ selectedFileName || '選擇作品圖片' }}</span>
    </label>
    <a
      v-if="preview"
      class="image-preview image-link"
      :href="preview"
      target="_blank"
      rel="noreferrer"
    >
      <img :src="preview" alt="作品圖片預覽" />
    </a>
    <div v-else class="image-preview">
      <span>尚未選擇圖片</span>
    </div>
  </div>
</template>

<style scoped>
.animate-type-image-editor {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  align-items: stretch;
}

.file-drop {
  display: grid;
  min-height: 150px;
  place-items: center;
  border: 1px dashed #eaded2;
  border-radius: 14px;
  background: #fffdf9;
  color: #384942;
  font-weight: 750;
  padding: 14px;
  text-align: center;
}

.file-drop input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  opacity: 0;
}

.image-preview {
  display: grid;
  min-height: 150px;
  place-items: center;
  overflow: hidden;
  border: 1px solid #eaded2;
  border-radius: 14px;
  background: #fffdf9;
  color: #59665f;
  font-size: 0.9rem;
  font-weight: 750;
}

.image-preview img {
  width: 100%;
  height: 100%;
  min-height: 150px;
  object-fit: cover;
}

.image-link {
  color: inherit;
  text-decoration: none;
}

.image-link:hover {
  border-color: #b84d55;
  box-shadow: 0 12px 28px rgb(184 77 85 / 12%);
}

@media (max-width: 560px) {
  .animate-type-image-editor {
    grid-template-columns: 1fr;
  }
}
</style>
