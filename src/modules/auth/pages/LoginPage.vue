<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { loginAdmin } from '@/modules/auth/api/authApi'
import AppButton from '@/shared/components/AppButton.vue'
import FormField from '@/shared/components/FormField.vue'
import MessageBlock from '@/shared/components/MessageBlock.vue'
import { useAuthStore } from '@/shared/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()
const form = reactive({
  account: '',
  password: '',
})
const loading = ref(false)
const error = ref('')

const login = async () => {
  error.value = ''

  if (!form.account.trim() || !form.password) {
    error.value = '請輸入帳號與密碼。'
    return
  }

  loading.value = true
  try {
    const admin = await loginAdmin({
      account: form.account.trim(),
      password: form.password,
    })

    if (!admin) {
      throw new Error('登入失敗，請確認帳號與密碼。')
    }

    authStore.signIn(admin.token)
    router.push('/dashboard')
  } catch (err) {
    error.value = err?.message || '登入失敗，請稍後再試。'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="login-page">
    <section class="login-panel" aria-labelledby="login-title">
      <div class="login-card">
        <div class="login-heading">
          <h1 id="login-title">ccAnimateJapan</h1>
          <p>登入</p>
        </div>

        <form class="login-form" @submit.prevent="login">
          <FormField label="帳號">
            <input
              v-model="form.account"
              autocomplete="username"
              name="account"
              placeholder="請輸入帳號"
              type="text"
            />
          </FormField>

          <FormField label="密碼">
            <input
              v-model="form.password"
              autocomplete="current-password"
              name="password"
              placeholder="請輸入密碼"
              type="password"
            />
          </FormField>

          <MessageBlock v-if="error" role="alert">{{ error }}</MessageBlock>

          <AppButton variant="primary" type="submit" :disabled="loading">
            {{ loading ? '登入中...' : '登入' }}
          </AppButton>
        </form>
      </div>
    </section>
  </main>
</template>

<style scoped lang="scss">
.login-page {
  display: grid;
  min-height: 100vh;
  place-items: center;
  background: #f6f7f6;
  padding: 24px;
}

.login-panel {
  display: grid;
  width: min(100%, 420px);
}

.login-card {
  width: 100%;
  border: 1px solid #eaded2;
  border-radius: 8px;
  background: #fffdf9;
  box-shadow: 0 24px 60px rgb(114 74 56 / 12%);
  padding: 32px;
}

.login-heading {
  display: grid;
  gap: 8px;
  margin-bottom: 30px;
  text-align: center;
}

.login-heading h1 {
  margin: 0;
  color: #2c2926;
  font-size: 1.85rem;
  line-height: 1.18;
  letter-spacing: 0;
}

.login-heading p {
  margin: 0;
  color: #59665f;
  font-size: 1rem;
  font-weight: 750;
}

.login-form {
  display: grid;
  gap: 18px;
}

@media (max-width: 860px) {
  .login-card {
    width: 100%;
  }
}

@media (max-width: 560px) {
  .login-card {
    padding: 22px;
  }
}
</style>
