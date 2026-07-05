import { computed, ref } from 'vue'
import { sanitizeHtml, stripHtml } from '@/shared/utils/html'

// Note-dialog state shared with ActivityNoteDialog. Defaults derive the note HTML
// from `item.info` and the title from `item.name` (falling back to 活動備註),
// matching the original activity.vue behaviour; both are overridable for reuse.
export const useNoteDialog = ({
  getNoteHtmlSource = (item) => item?.info || '',
  getNoteTitle = (item) => item?.name || '活動備註',
} = {}) => {
  const isNoteDialogOpen = ref(false)
  const selectedNoteActivity = ref(null)

  const selectedNoteHtml = computed(() => sanitizeHtml(getNoteHtmlSource(selectedNoteActivity.value) || ''))
  const selectedNoteTitle = computed(() => getNoteTitle(selectedNoteActivity.value))

  const openNoteDialog = (activity) => {
    if (!stripHtml(getNoteHtmlSource(activity))) return

    selectedNoteActivity.value = activity
    isNoteDialogOpen.value = true
  }

  const closeNoteDialog = () => {
    isNoteDialogOpen.value = false
    selectedNoteActivity.value = null
  }

  return {
    isNoteDialogOpen,
    selectedNoteActivity,
    selectedNoteHtml,
    selectedNoteTitle,
    openNoteDialog,
    closeNoteDialog,
  }
}
