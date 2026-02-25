<template>
  <div
    class="dropzone"
    :class="{ 'dropzone--drag': isDragging, 'dropzone--filled': !!file }"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="onDrop"
    @click="!file && fileInput?.click()"
    :role="!file ? 'button' : 'region'"
    :tabindex="!file ? 0 : -1"
    @keydown.enter="!file && fileInput?.click()"
  >
    <input
      ref="fileInput"
      type="file"
      accept=".csv,text/csv"
      class="sr-only"
      @change="onInputChange"
    />

    <!-- Empty state -->
    <template v-if="!file">
      <div class="dz-icon">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M16 22V10M10 16l6-6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <rect x="4" y="24" width="24" height="4" rx="2" stroke="currentColor" stroke-width="1.5"/>
        </svg>
      </div>
      <div class="dz-text">
        <p class="dz-headline">Drop your CSV file here</p>
        <p class="dz-sub">or <span class="dz-link">browse files</span> · max 10 MB</p>
      </div>
    </template>

    <!-- Filled state -->
    <template v-else>
      <div class="dz-file">
        <div class="dz-file-icon">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 3h8l4 4v10a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" stroke-width="1.5"/>
            <path d="M12 3v5h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="dz-file-meta">
          <span class="dz-file-name">{{ file.name }}</span>
          <span class="dz-file-size t-muted">{{ formatBytes(file.size) }}</span>
        </div>
        <button class="dz-remove" @click.stop="$emit('clear')" aria-label="Remove file">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ file: File | null }>()
const emit = defineEmits<{
  (e: 'select', file: File): void
  (e: 'clear'): void
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

function onDrop(e: DragEvent) {
  isDragging.value = false
  const f = e.dataTransfer?.files[0]
  if (f) emit('select', f)
}

function onInputChange(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (f) emit('select', f)
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<style scoped>
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }

.dropzone {
  border: 2px dashed var(--c-border-dk);
  border-radius: var(--r-lg);
  padding: var(--sp-10) var(--sp-8);
  transition: border-color var(--t-base), background var(--t-base);
  cursor: pointer;
}
.dropzone:not(.dropzone--filled):hover,
.dropzone--drag {
  border-color: var(--c-accent);
  background: var(--c-accent-lt);
}
.dropzone--filled {
  cursor: default;
  border-style: solid;
  border-color: var(--c-border);
  padding: var(--sp-4) var(--sp-5);
}

/* Empty state */
.dz-icon { color: var(--c-border-dk); margin-bottom: var(--sp-4); display: flex; justify-content: center; }
.dropzone:hover .dz-icon,
.dropzone--drag .dz-icon { color: var(--c-accent); }
.dz-text { text-align: center; }
.dz-headline { font-size: 15px; font-weight: 500; margin-bottom: var(--sp-1); }
.dz-sub { font-size: 13px; color: var(--c-muted); }
.dz-link { color: var(--c-accent); text-decoration: underline; }

/* Filled state */
.dz-file { display: flex; align-items: center; gap: var(--sp-3); }
.dz-file-icon { color: var(--c-accent); flex-shrink: 0; }
.dz-file-meta { flex: 1; min-width: 0; }
.dz-file-name { display: block; font-size: 14px; font-weight: 500; font-family: var(--f-mono); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dz-file-size { font-size: 12px; font-family: var(--f-mono); }
.dz-remove {
  flex-shrink: 0; background: none; border: none;
  color: var(--c-muted); cursor: pointer; padding: var(--sp-1);
  border-radius: var(--r-sm); transition: color var(--t-fast);
}
.dz-remove:hover { color: var(--c-error); }
</style>
