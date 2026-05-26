<script setup>
defineProps({
  images: {
    type: Array,
    default: () => [],
  },
  remainingSlots: {
    type: Number,
    default: 5,
  },
  limit: {
    type: Number,
    default: 5,
  },
  productName: {
    type: String,
    default: '',
  },
})

defineEmits(['change', 'remove-existing', 'remove-new'])
</script>

<template>
  <div class="product-image-picker">
    <div class="product-image-select">
      <label class="image-file-drop" :class="{ 'is-disabled': remainingSlots <= 0 }">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          :disabled="remainingSlots <= 0"
          @change="$emit('change', $event)"
        />
        <span>
          {{ remainingSlots > 0 ? `選擇商品圖片 (${images.length}/${limit})` : `圖片已達 ${limit} 張` }}
        </span>
      </label>
    </div>

    <div class="product-image-preview-panel">
      <div v-if="images.length" class="product-image-grid">
        <div
          v-for="image in images"
          :key="image.key"
          class="product-image-tile"
        >
          <a
            class="product-image-link"
            :href="image.url"
            target="_blank"
            rel="noreferrer"
          >
            <img :src="image.url" :alt="image.name || productName || '商品圖片'" />
          </a>
          <span v-if="image.kind === 'new'" class="image-state">新</span>
          <button
            class="remove-image-button"
            type="button"
            :aria-label="`移除${image.name || productName || '商品圖片'}`"
            title="移除圖片"
            @click="
              image.kind === 'existing'
                ? $emit('remove-existing', image.id)
                : $emit('remove-new', image.index)
            "
          >
            ×
          </button>
        </div>
      </div>
      <div v-else class="product-image-empty">尚未上傳圖片</div>
    </div>
  </div>
</template>

<style scoped>
.product-image-picker {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  align-items: stretch;
  gap: 14px;
}

.product-image-select,
.product-image-preview-panel {
  min-width: 0;
}

.image-file-drop {
  position: relative;
  display: grid;
  min-height: 176px;
  height: 100%;
  place-items: center;
  border: 1px dashed #d8c7ba;
  border-radius: 8px;
  background: #fffdf9;
  color: #384942;
  font-weight: 800;
  padding: 14px;
  text-align: center;
}

.image-file-drop:hover {
  border-color: #277867;
  background: #f8fff9;
  color: #1f6154;
}

.image-file-drop.is-disabled {
  cursor: not-allowed;
  opacity: 0.68;
}

.image-file-drop input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  opacity: 0;
  white-space: nowrap;
}

.product-image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
  min-height: 176px;
  max-height: 236px;
  overflow: auto;
  border: 1px solid #eaded2;
  border-radius: 8px;
  background: #fffdf9;
  padding: 10px;
  gap: 10px;
}

.product-image-tile {
  position: relative;
  overflow: hidden;
  border: 1px solid #eaded2;
  border-radius: 8px;
  background: #fffaf4;
  aspect-ratio: 1;
}

.product-image-link {
  display: block;
  width: 100%;
  height: 100%;
}

.product-image-link img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-state {
  position: absolute;
  left: 8px;
  top: 8px;
  display: inline-flex;
  min-width: 28px;
  min-height: 24px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgb(31 97 84 / 90%);
  color: #ffffff;
  font-size: 0.78rem;
  font-weight: 900;
}

.remove-image-button {
  position: absolute;
  top: 8px;
  right: 8px;
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border: 1px solid rgb(255 255 255 / 70%);
  border-radius: 999px;
  background: rgb(19 32 28 / 72%);
  color: #ffffff;
  font-size: 1.25rem;
  line-height: 1;
}

.remove-image-button:hover {
  background: #9d3e46;
}

.product-image-empty {
  display: grid;
  min-height: 176px;
  height: 100%;
  place-items: center;
  border: 1px solid #eaded2;
  border-radius: 8px;
  background: #fffdf9;
  color: #59665f;
  font-size: 0.92rem;
  font-weight: 750;
}

@media (max-width: 640px) {
  .product-image-picker {
    grid-template-columns: 1fr;
  }

  .image-file-drop,
  .product-image-empty,
  .product-image-grid {
    min-height: 140px;
  }
}
</style>
