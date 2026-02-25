<template>
  <div class="result slide-up">
    <!-- Success banner -->
    <div class="result-banner">
      <div class="banner-check">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M4 10l4 4 8-8" stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round" />
        </svg>
      </div>
      <div>
        <h3 class="banner-title">Pipeline complete</h3>
        <p class="banner-sub">Uploaded to Azure Blob Storage</p>
      </div>
    </div>

    <!-- Details grid -->
    <div class="result-grid">
      <div class="result-item">
        <span class="t-label">Submission ID</span>
        <div class="result-id-row">
          <span class="result-value t-mono">{{ result.submissionId }}</span>
        </div>
      </div>

      <div class="result-item">
        <span class="t-label">Submitted At</span>
        <span class="result-value t-mono">{{ formatDate(result.submittedAt) }}</span>
      </div>

      <div class="result-item">
        <span class="t-label">Submitted By</span>
        <span class="result-value t-mono">{{ result.submittedBy }}</span>
      </div>

      <div class="result-item">
        <span class="t-label">Rows Processed</span>
        <span class="result-value t-mono">{{ result.rowCount.toLocaleString() }}</span>
      </div>

      <div class="result-item result-item--full">
        <span class="t-label">Azure Blob Path</span>
        <span class="result-value t-mono">{{ result.blobPath }}</span>
      </div>

      <div v-if="result.downloadUrl" class="result-item result-item--full">
        <span class="t-label">Download (SAS URL, 15 min)</span>
        <a :href="result.downloadUrl" class="result-link" download>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v7M4 6l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
              stroke-linejoin="round" />
            <path d="M2 11h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
          {{ result.submissionId }}.csv
        </a>
      </div>
    </div>

    <div class="result-actions">
      <button class="btn btn-outline" @click="$emit('reset')">
        ← Upload another file
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UploadResult } from '@/types'

defineProps<{ result: UploadResult }>()
defineEmits<{ (e: 'reset'): void }>()

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('sv-SE', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}
</script>

<style scoped>
.result {
  display: flex;
  flex-direction: column;
  gap: var(--sp-5);
}

.result-banner {
  display: flex;
  align-items: center;
  gap: var(--sp-4);
  padding: var(--sp-5);
  background: var(--c-success-lt);
  border: 1px solid rgba(42, 122, 82, 0.2);
  border-radius: var(--r-lg);
}

.banner-check {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--c-success);
  color: white;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.banner-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--c-success);
}

.banner-sub {
  font-size: 13px;
  color: var(--c-muted);
  margin-top: 2px;
}

.result-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-3);
}

.result-item {
  background: var(--c-surface2);
  border: 1px solid var(--c-border);
  border-radius: var(--r-md);
  padding: var(--sp-4) var(--sp-5);
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.result-item--full {
  grid-column: span 2;
}

.result-id-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
}

.result-value {
  font-size: 13px;
  word-break: break-all;
  line-height: 1.4;
}

.result-value--accent {
  color: var(--c-accent);
}

.copy-btn {
  border-radius: var(--r-sm);
  border: 1px solid var(--c-border);
  background: var(--c-surface);
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
}

.result-link {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
  color: var(--c-accent);
  text-decoration: none;
  font-family: var(--f-mono);
  font-size: 13px;
  transition: opacity var(--t-fast);
}

.result-link:hover {
  opacity: 0.75;
}

.result-actions {
  display: flex;
  justify-content: flex-start;
}

@media (max-width: 560px) {
  .result-grid {
    grid-template-columns: 1fr;
  }

  .result-item--full {
    grid-column: span 1;
  }
}
</style>
