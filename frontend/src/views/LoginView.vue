<template>
  <div class="login-page">
    <div class="login-main">
      <div class="login-card card slide-up">
        <div class="login-brand">
          <span>SalesPipeline Demo</span>
        </div>

        <div class="login-header">
          <h1 class="t-display">Sign in</h1>
        </div>

        <form @submit.prevent="handleSubmit" novalidate>
          <div class="form-fields">
            <div class="field">
              <label for="username">Username</label>
              <input
                id="username"
                v-model="form.username"
                class="input"
                type="text"
                autocomplete="username"
                placeholder="Your username"
                :disabled="loading"
                required
              />
            </div>

            <div class="field">
              <label for="password">Password</label>
              <input
                id="password"
                v-model="form.password"
                class="input"
                type="password"
                autocomplete="current-password"
                placeholder="••••••••"
                :disabled="loading"
                required
              />
            </div>
          </div>

          <div v-if="errorMsg" class="alert alert-error" role="alert">{{ errorMsg }}</div>

          <button class="btn btn-primary btn-full submit-btn" type="submit" :disabled="loading || !form.username || !form.password">
            <span class="spinner" v-if="loading" />
            {{ loading ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>

        <!-- Azure AD placeholder -->
        <div class="sso-divider">
          <hr /><span>or</span><hr />
        </div>
        <button class="btn btn-outline btn-full sso-btn" type="button" disabled title="Configure MSAL in production">
          <MicrosoftIcon />
          Sign in with Microsoft (Azure AD)
        </button>
        <p class="sso-note t-label">Azure AD — configure in production</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import MicrosoftIcon from '@/components/MicrosoftIcon.vue'

const auth = useAuthStore()
const router = useRouter()

const form = reactive({ username: '', password: '' })
const loading = ref(false)
const errorMsg = ref('')

async function handleSubmit() {
  errorMsg.value = ''
  loading.value = true
  try {
    await auth.login(form.username, form.password)
    router.push({ name: 'upload' })
  } catch (err) {
    errorMsg.value = (err as Error).message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--sp-8);
  background: var(--c-bg);
}

.login-main {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.login-card { width: 100%; max-width: 400px; padding: var(--sp-10) var(--sp-8); }

.login-brand {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  font-size: 14px;
  font-weight: 700;
  opacity: 0.85;
  margin-bottom: var(--sp-8);
}
.login-brand .brand-logo { height: 28px; width: auto; display: block; }
.login-meta { text-align: center; margin-top: var(--sp-2); opacity: 0.6; }

.login-header { margin-bottom: var(--sp-4); margin-top: var(--sp-7); }
.login-header h1 { font-size: 32px; font-weight: 300; }

.form-fields { display: flex; flex-direction: column; gap: var(--sp-5); margin-bottom: var(--sp-5); }
.submit-btn { margin-top: var(--sp-5); }
.login-hint { margin-top: var(--sp-5); text-align: center; }

.sso-divider {
  display: grid; grid-template-columns: 1fr auto 1fr;
  align-items: center; gap: var(--sp-3);
  margin: var(--sp-6) 0 var(--sp-4);
  font-size: 11px; font-weight: 600; letter-spacing: 0.1em;
  text-transform: uppercase; color: var(--c-muted);
}
.sso-btn { gap: var(--sp-3); opacity: 0.55; }
.sso-note { text-align: center; margin-top: var(--sp-3); }
</style>
