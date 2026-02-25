<template>
  <header class="navbar">
    <div class="container navbar-inner">
      <div class="navbar-brand">
        <span class="brand-name">SalesPipeline Demo</span>
      </div>

      <div class="navbar-right">
        <div class="user-badge">
          <span class="user-avatar">{{ initial }}</span>
          <span class="user-info">
            <span class="user-name">{{ auth.username }}</span>
            <span class="user-role">{{ auth.role }}</span>
          </span>
        </div>
        <button class="btn btn-ghost btn-sm" @click="handleLogout">Sign out</button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const initial = computed(() =>
  (auth.username ?? 'U').charAt(0).toUpperCase()
)

async function handleLogout() {
  await auth.logout()
  router.push({ name: 'login' })
}
</script>

<style scoped>
.navbar {
  position: sticky; top: 0; z-index: 100;
  background: var(--c-surface);
  border-bottom: 1px solid var(--c-border);
  height: 60px;
}
.navbar-inner {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.navbar-brand {
  display: flex; align-items: center; gap: 10px;
  font-family: var(--f-body); font-weight: 600; font-size: 15px;
}

.brand-logo { height: 24px; width: auto; display: block; }
.navbar-right { display: flex; align-items: center; gap: var(--sp-4); }

.user-badge {
  display: flex; align-items: center; gap: var(--sp-3);
  padding: 6px 12px 6px 6px;
  border: 1px solid var(--c-border);
  border-radius: 100px;
}
.user-avatar {
  width: 28px; height: 28px; border-radius: 50%;
  background: var(--c-text); color: var(--c-surface);
  display: grid; place-items: center;
  font-size: 11px; font-weight: 700;
  flex-shrink: 0;
}
.user-info { display: flex; flex-direction: column; line-height: 1.2; }
.user-name { font-size: 13px; font-weight: 500; }
.user-role {
  font-size: 10px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.06em;
  color: var(--c-muted);
}
</style>
