<script setup>
import { nextTick, onMounted, ref, watch } from 'vue'
import { sanitizeHtml } from '@/utils/html'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '請輸入內容',
  },
})

const emit = defineEmits(['update:modelValue'])
const editor = ref(null)
const savedSelection = ref(null)
const isFocused = ref(false)

const inlineTags = {
  bold: 'strong',
  underline: 'u',
}

const syncEditor = () => {
  if (!editor.value) return

  const sanitized = sanitizeHtml(props.modelValue)
  if (editor.value.innerHTML !== sanitized) {
    editor.value.innerHTML = sanitized
  }
}

const saveSelection = () => {
  if (typeof window === 'undefined' || !editor.value) return

  const selection = window.getSelection()
  if (!selection?.rangeCount) return

  const range = selection.getRangeAt(0)
  if (!editor.value.contains(range.commonAncestorContainer)) return

  savedSelection.value = range.cloneRange()
}

const restoreSelection = () => {
  if (typeof window === 'undefined' || !savedSelection.value) return

  const selection = window.getSelection()
  selection.removeAllRanges()
  selection.addRange(savedSelection.value)
}

const emitEditorValue = () => {
  emit('update:modelValue', editor.value?.innerHTML || '')
}

const onEditorInput = () => {
  emitEditorValue()
  saveSelection()
}

const sanitizeEditor = () => {
  isFocused.value = false
  emit('update:modelValue', sanitizeHtml(editor.value?.innerHTML || ''))
  nextTick(syncEditor)
}

const applyInlineCommand = (command) => {
  const tagName = inlineTags[command]
  if (!tagName || typeof window === 'undefined' || !editor.value) return false

  restoreSelection()

  const selection = window.getSelection()
  if (!selection?.rangeCount) return false

  const range = selection.getRangeAt(0)
  if (range.collapsed || !editor.value.contains(range.commonAncestorContainer)) return false

  const wrapper = document.createElement(tagName)
  wrapper.appendChild(range.extractContents())
  range.insertNode(wrapper)

  const nextRange = document.createRange()
  nextRange.selectNodeContents(wrapper)
  selection.removeAllRanges()
  selection.addRange(nextRange)

  onEditorInput()
  savedSelection.value = nextRange.cloneRange()
  return true
}

const applyCommand = (command) => {
  if (!editor.value) return

  editor.value.focus()
  if (applyInlineCommand(command)) return

  restoreSelection()
  document.execCommand('styleWithCSS', false, 'false')
  document.execCommand(command)
  onEditorInput()
  saveSelection()
}

watch(
  () => props.modelValue,
  () => {
    if (!isFocused.value) {
      nextTick(syncEditor)
    }
  },
  { immediate: true },
)

onMounted(syncEditor)
</script>

<template>
  <div class="rich-html-editor">
    <div class="rich-html-toolbar" aria-label="文字格式">
      <button type="button" title="粗體" @mousedown.prevent @click="applyCommand('bold')">B</button>
      <button type="button" title="底線" @mousedown.prevent @click="applyCommand('underline')">U</button>
      <button type="button" title="項目符號" @mousedown.prevent @click="applyCommand('insertUnorderedList')">
        •
      </button>
      <button type="button" title="編號列表" @mousedown.prevent @click="applyCommand('insertOrderedList')">
        1.
      </button>
    </div>
    <div
      ref="editor"
      class="rich-html-surface"
      contenteditable="true"
      role="textbox"
      :aria-label="placeholder"
      :data-placeholder="placeholder"
      @input="onEditorInput"
      @keyup="saveSelection"
      @mouseup="saveSelection"
      @focus="isFocused = true; saveSelection()"
      @blur="sanitizeEditor"
    ></div>
  </div>
</template>

<style scoped>
.rich-html-editor {
  overflow: hidden;
  border: 1px solid #eaded2;
  border-radius: 14px;
  background: #fffdf9;
}

.rich-html-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  border-bottom: 1px solid #f0e5dc;
  background: #fff8f0;
  padding: 8px;
}

.rich-html-toolbar button {
  display: grid;
  min-width: 34px;
  min-height: 32px;
  place-items: center;
  border: 1px solid #e8d8c8;
  border-radius: 8px;
  background: #fffdf9;
  color: #4e443d;
  font-weight: 850;
}

.rich-html-toolbar button:hover {
  border-color: #b84d55;
  color: #9d3e46;
}

.rich-html-surface {
  min-height: 140px;
  max-height: 260px;
  overflow: auto;
  color: #2a2825;
  font-weight: 500;
  line-height: 1.65;
  outline: none;
  padding: 13px;
}

.rich-html-surface:empty::before {
  color: #9a8b82;
  content: attr(data-placeholder);
}

.rich-html-surface :deep(ul),
.rich-html-surface :deep(ol) {
  margin: 8px 0;
  padding-left: 24px;
}

.rich-html-surface :deep(strong) {
  font-weight: 850;
}

.rich-html-surface :deep(u) {
  text-decoration: underline;
}
</style>
