<template>
  <div class="page">
    <NavBar />

    <main class="main container">
      <!-- Page header -->
      <div class="page-header">
        <div>
          <h1 class="page-title t-display">Product Sales Upload</h1>
        </div>
      </div>

      <div class="upload-layout">
        <section class="upload-panel card">

          <!-- Result panel shown on success -->
          <ResultPanel
            v-if="step === 'done' && result"
            :result="result"
            @reset="resetUpload"
          />

          <!-- Upload form shown when idle or error -->
          <template v-if="step === 'idle' || step === 'error'">
            <h2 class="panel-title t-label">Select file</h2>

            <DropZone :file="file" @select="onFileSelect" @clear="clearFile" />

            <div
              v-if="step === 'error' && validationResult?.missingColumns && validationResult.missingColumns.length > 0"
              class="col-check slide-up"
            >
              <p class="t-label" style="margin-bottom: 10px;">Validation results</p>
              <div class="col-grid">
                <div
                  v-for="col in validationColumns"
                  :key="col"
                  class="col-item"
                  :class="{
                    'col-item--ok': !(validationResult.missingColumns ?? []).includes(col),
                    'col-item--missing': (validationResult.missingColumns ?? []).includes(col),
                  }"
                >
                  <span class="col-dot" />
                  <span class="t-mono" style="font-size: 13px;">{{ col }}</span>
                </div>
              </div>
            </div>

            <div v-if="errorMsg" class="alert alert-error" role="alert" style="white-space: pre-line;">{{ errorMsg }}</div>

            <button
              class="btn btn-primary btn-full upload-btn"
              :disabled="!file || loading"
              @click="handleUpload"
            >
              <span class="spinner" v-if="loading" />
              {{ loading ? 'Submitting...' : 'Submit' }}
            </button>
          </template>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import NavBar from '@/components/NavBar.vue'
import DropZone from '@/components/DropZone.vue'
import ResultPanel from '@/components/ResultPanel.vue'
import { useAuthStore } from '@/stores/auth'
import { ApiError, type ApiValidationPayload, api } from '@/api/client'
import type { UploadStep, UploadResult } from '@/types'

const auth = useAuthStore()

const file = ref<File | null>(null)
const step = ref<UploadStep>('idle')
const validationResult = ref<ApiValidationPayload | null>(null)
const loading = ref(false)
const errorMsg = ref('')
const result = ref<UploadResult | null>(null)

const validationColumns = computed(() =>
  validationResult.value?.requiredColumns ?? validationResult.value?.missingColumns ?? [],
)

function onFileSelect(f: File) {
  file.value = f
  errorMsg.value = ''
  validationResult.value = null
  result.value = null
  step.value = 'idle'
}

function clearFile() {
  file.value = null
  errorMsg.value = ''
  validationResult.value = null
  step.value = 'idle'
  result.value = null
}

function resetUpload() {
  clearFile()
}

async function handleUpload() {
  if (!file.value || !auth.token) return

  loading.value = true
  errorMsg.value = ''
  validationResult.value = null
  result.value = null
  step.value = 'idle'

  try {
    const res = await api.upload(file.value, auth.token)
    result.value = res
    step.value = 'done'
  } catch (err) {
    if (err instanceof ApiError) {
      errorMsg.value = err.message
      validationResult.value = err.validation ?? null
    } else {
      errorMsg.value = (err as Error).message
      validationResult.value = null
    }
    step.value = 'error'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.page { min-height: 100vh; display: flex; flex-direction: column; }
.main { flex: 1; padding-top: var(--sp-10); padding-bottom: var(--sp-12); }

.page-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: var(--sp-8);
}
.page-title { font-size: clamp(28px, 4vw, 40px); font-weight: 300; }

.upload-layout {
  max-width: 920px;
}

/* Main upload panel */
.upload-panel {
  padding: var(--sp-8);
  display: flex;
  flex-direction: column;
  gap: var(--sp-6);
}
.panel-title { margin-bottom: var(--sp-3); }

.upload-btn { margin-top: var(--sp-2); }

/* Validation results grid */
.col-check { padding: var(--sp-5); background: var(--c-surface2); border-radius: var(--r-md); }
.col-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--sp-3); }
.col-item { display: flex; align-items: center; gap: var(--sp-2); }
.col-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--c-border-dk); flex-shrink: 0;
  transition: background 0.2s;
}
.col-item--ok .col-dot { background: var(--c-success); }
.col-item--missing .col-dot { background: var(--c-error); }

@media (max-width: 760px) {
  .upload-layout { max-width: 100%; }
}
</style>
