import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  clearAdminToken,
  getAdminDisplayName,
  getAdminToken,
  setAdminToken,
} from '@/shared/stores/authSession'

// 反應式登入狀態包裝（供 layout / 頁面讀取）。
// 底層仍沿用 authSession 的 localStorage helper，讓 httpClient / router guard
// 可以用純函式直接讀 token（不必進 Pinia context）。
export const useAuthStore = defineStore('auth', () => {
  const token = ref(getAdminToken())

  const isAuthenticated = computed(() => !!token.value)
  const displayName = computed(() => (token.value ? getAdminDisplayName() : 'Admin'))

  const signIn = (newToken) => {
    setAdminToken(newToken)
    token.value = newToken
  }

  const signOut = () => {
    clearAdminToken()
    token.value = null
  }

  // 外部（例如 httpClient 401 處理）清掉 token 後，用這個把反應式狀態同步回來。
  const syncFromStorage = () => {
    token.value = getAdminToken()
  }

  return { token, isAuthenticated, displayName, signIn, signOut, syncFromStorage }
})
