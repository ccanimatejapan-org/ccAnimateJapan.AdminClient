import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  clearAdminToken,
  getAdminDisplayName,
  getValidAdminToken,
  setAdminToken,
} from '@/shared/stores/authSession'

// 反應式登入狀態包裝（供 layout / 頁面讀取）。
// 底層仍沿用 authSession 的 localStorage helper，讓 httpClient / router guard
// 可以用純函式直接讀 token（不必進 Pinia context）。
export const useAuthStore = defineStore('auth', () => {
  // 只接受「仍有效」的 token：localStorage 裡殘留已過期的 token 時，一開始就當作未登入。
  const token = ref(getValidAdminToken())

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

  // 外部（httpClient 401、token 過期檢查、router 守衛）清掉 token 後，用這個把反應式狀態同步回來。
  const syncFromStorage = () => {
    token.value = getValidAdminToken()
  }

  return { token, isAuthenticated, displayName, signIn, signOut, syncFromStorage }
})

// 給 Pinia 元件外的呼叫端（httpClient、router 守衛）：把 authStore 同步回 localStorage 的現況。
// 包 try/catch 以防極少數在 pinia 啟用前被呼叫。
export const syncAuthStoreFromStorage = () => {
  try {
    useAuthStore().syncFromStorage()
  } catch (_) {
    /* pinia 尚未啟用，略過 */
  }
}

// 讓 store 於開發時支援熱替換，避免改動 store 後舊實例殘留（狀態形狀不同）而報錯
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot))
}
