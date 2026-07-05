<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '@/shared/components/AppButton.vue'
import { useAuthStore } from '@/shared/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()
const adminName = computed(() => authStore.displayName)

const logout = () => {
  authStore.signOut()
  router.push('/pages/login')
}
</script>

<template>
  <div class="app-layout">
    <header class="app-header">
      <RouterLink class="brand-lockup" :to="{ name: 'Dashboard' }" aria-label="回 Dashboard 首頁">
        <img class="brand-mark" src="/cc-admin-mark.svg" alt="" />
        <div>
          <strong>CC 日本動漫代購 後臺管理系統</strong>
        </div>
      </RouterLink>

      <div class="header-actions">
        <span class="admin-name">歡迎回來，{{ adminName }}</span>
        <AppButton type="button" @click="logout">登出</AppButton>
      </div>
    </header>

    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  background: #eef2ef;
}

.app-header {
  display: flex;
  min-height: 64px;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  border-bottom: 1px solid #d6dfd9;
  background: #ffffff;
  padding: 0 24px;
}

.brand-lockup {
  display: flex;
  min-width: 0;
  align-items: center;
  color: inherit;
  gap: 12px;
  text-decoration: none;
}

.brand-mark {
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
}

.brand-lockup strong {
  display: block;
  overflow: hidden;
  color: #13201c;
  font-size: 0.98rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.admin-name {
  min-width: 0;
  max-width: 320px;
  overflow: hidden;
  color: #59665f;
  font-size: 0.9rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-main {
  padding: 28px;
}

@media (max-width: 560px) {
  .app-header {
    align-items: flex-start;
    flex-direction: column;
    padding: 14px 18px;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .app-main {
    padding: 18px;
  }
}
</style>
