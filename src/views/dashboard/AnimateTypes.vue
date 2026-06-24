<script setup>
import { computed, onMounted, ref } from 'vue'
import PageShell from '@/components/layout/PageShell.vue'
import PageHeading from '@/components/layout/PageHeading.vue'
import PanelCard from '@/components/layout/PanelCard.vue'
import FormField from '@/components/ui/FormField.vue'
import AppButton from '@/components/ui/AppButton.vue'
import MessageBlock from '@/components/ui/MessageBlock.vue'
import AnimateTypeImagePicker from '@/components/animateTypes/AnimateTypeImagePicker.vue'
import { useImageUpload } from '@/composables/common/useImageUpload'
import { listAnimateTypes, createAnimateType, updateAnimateType } from '@/api/activities'

const animateTypes = ref([])
const form = ref({ id: null, name: '', imageUrl: '' })
const errorMessage = ref('')
const successMessage = ref('')
const isSaving = ref(false)

const isEditing = computed(() => form.value.id != null)

const { selectedImageFile, imagePreview, resetImageUpload, onImageChange } = useImageUpload({
  existingImageUrl: () => form.value.imageUrl,
  invalidTypeMessage: '作品圖片僅支援圖片檔。',
  maxBytesMessage: '作品圖片不可超過 5MB。',
  onError: (message) => {
    errorMessage.value = message
  },
})

const loadAnimateTypes = async () => {
  try {
    animateTypes.value = await listAnimateTypes()
  } catch (err) {
    errorMessage.value = err?.message || '載入作品失敗。'
  }
}

const resetForm = () => {
  form.value = { id: null, name: '', imageUrl: '' }
  resetImageUpload()
}

const startEdit = (animateType) => {
  errorMessage.value = ''
  successMessage.value = ''
  resetImageUpload()
  form.value = {
    id: animateType.id,
    name: animateType.name || '',
    imageUrl: animateType.imageUrl || '',
  }
}

const submit = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  const name = form.value.name.trim()
  if (!name) {
    errorMessage.value = '請輸入作品名稱。'
    return
  }

  const formData = new FormData()
  formData.append('Name', name)
  if (form.value.id != null) {
    formData.append('Id', String(form.value.id))
  }
  if (selectedImageFile.value) {
    formData.append('imageFile', selectedImageFile.value)
  } else if (form.value.imageUrl) {
    formData.append('ImageUrl', form.value.imageUrl)
  }

  isSaving.value = true
  try {
    if (form.value.id != null) {
      await updateAnimateType(formData)
      successMessage.value = '作品已更新。'
    } else {
      await createAnimateType(formData)
      successMessage.value = '作品已新增。'
    }
    resetForm()
    await loadAnimateTypes()
  } catch (err) {
    errorMessage.value = err?.message || '儲存失敗。'
  } finally {
    isSaving.value = false
  }
}

onMounted(loadAnimateTypes)
</script>

<template>
  <PageShell>
    <PageHeading
      eyebrow="設定"
      title="作品管理"
      copy="管理動漫作品（animateType）與其圖片，圖片會顯示在前台「依作品逛」的圓形頭像。"
    />

    <MessageBlock v-if="errorMessage" tone="error">{{ errorMessage }}</MessageBlock>
    <MessageBlock v-if="successMessage" tone="success">{{ successMessage }}</MessageBlock>

    <PanelCard>
      <form class="animate-type-form" @submit.prevent="submit">
        <h2 class="animate-type-form__title">{{ isEditing ? '編輯作品' : '新增作品' }}</h2>

        <FormField label="作品名稱">
          <input v-model="form.name" type="text" maxlength="100" placeholder="例如：間諜家家酒" />
        </FormField>

        <FormField as="div" label="作品圖片（上傳最大 5MB，jpg / png / webp / gif）" full>
          <AnimateTypeImagePicker
            :selected-file-name="selectedImageFile?.name || ''"
            :preview="imagePreview"
            @change="onImageChange"
          />
        </FormField>

        <div class="animate-type-form__actions">
          <AppButton type="submit" variant="primary" :disabled="isSaving">
            {{ isEditing ? '儲存' : '新增' }}
          </AppButton>
          <AppButton
            v-if="isEditing"
            type="button"
            variant="ghost"
            :disabled="isSaving"
            @click="resetForm"
          >
            取消編輯
          </AppButton>
        </div>
      </form>
    </PanelCard>

    <PanelCard>
      <h2 class="animate-type-list__title">作品列表</h2>
      <p v-if="!animateTypes.length" class="animate-type-list__empty">目前沒有作品。</p>
      <ul v-else class="animate-type-list">
        <li v-for="item in animateTypes" :key="item.id" class="animate-type-list__row">
          <span class="animate-type-list__thumb">
            <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" />
            <span v-else class="animate-type-list__thumb-empty">{{ (item.name || '?').slice(0, 1) }}</span>
          </span>
          <span class="animate-type-list__name">{{ item.name }}</span>
          <AppButton type="button" variant="ghost" @click="startEdit(item)">編輯</AppButton>
        </li>
      </ul>
    </PanelCard>
  </PageShell>
</template>

<style scoped>
.animate-type-form {
  display: grid;
  gap: 18px;
  max-width: 640px;
}

.animate-type-form__title,
.animate-type-list__title {
  margin: 0;
  color: #2c2926;
  font-size: 1.15rem;
}

.animate-type-form__actions {
  display: flex;
  gap: 12px;
}

.animate-type-list {
  display: grid;
  gap: 10px;
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
}

.animate-type-list__empty {
  margin: 14px 0 0;
  color: #59665f;
}

.animate-type-list__row {
  display: flex;
  align-items: center;
  gap: 14px;
  border: 1px solid #eaded2;
  border-radius: 12px;
  background: #fffdf9;
  padding: 10px 14px;
}

.animate-type-list__thumb {
  display: grid;
  flex: 0 0 auto;
  width: 52px;
  height: 52px;
  place-items: center;
  overflow: hidden;
  border-radius: 999px;
  border: 1px solid #eaded2;
  background: #fff;
}

.animate-type-list__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.animate-type-list__thumb-empty {
  color: #b26a00;
  font-size: 1.2rem;
  font-weight: 800;
}

.animate-type-list__name {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  color: #2c2926;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
