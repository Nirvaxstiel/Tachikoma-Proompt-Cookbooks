<template>
  <div class="install-banner">
    <div class="banner-content">
      <span class="icon">📍</span>
      <div class="locations">
        <strong>Two Installation Locations:</strong>
        <span class="location local">Locally: <code>cwd/.opencode</code></span>
        <span class="separator">|</span>
        <span class="location global">Globally: <code>~/.config/opencode</code></span>
      </div>
      <button class="close-btn" @click="dismiss">×</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const dismissed = ref(false)

if (typeof window !== 'undefined') {
  dismissed.value = localStorage.getItem('install-banner-dismissed') === 'true'
}

function dismiss() {
  dismissed.value = true
  if (typeof window !== 'undefined') {
    localStorage.setItem('install-banner-dismissed', 'true')
  }
}
</script>

<style scoped>
.install-banner {
  background: linear-gradient(135deg, rgba(0, 168, 107, 0.15), rgba(217, 0, 102, 0.1));
  border-bottom: 2px solid rgba(0, 168, 107, 0.3);
  padding: 12px 20px;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.banner-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 14px;
}

.icon {
  font-size: 18px;
  flex-shrink: 0;
}

.locations {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  flex-wrap: wrap;
}

.location {
  display: flex;
  align-items: center;
  gap: 6px;
}

.location.local code {
  background: rgba(0, 168, 107, 0.15);
  border: 1px solid rgba(0, 168, 107, 0.3);
  color: #007755;
}

.location.global code {
  background: rgba(217, 0, 102, 0.15);
  border: 1px solid rgba(217, 0, 102, 0.3);
  color: #a6004d;
}

code {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-family: var(--font-mono);
}

.separator {
  color: var(--vp-c-text-3);
  flex-shrink: 0;
}

.close-btn {
  background: none;
  border: none;
  color: var(--vp-c-text-3);
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  color: var(--vp-c-text-1);
}

.dark .location.local code {
  background: rgba(0, 255, 159, 0.2);
  border: 1px solid rgba(0, 255, 159, 0.4);
  color: #00ff9f;
}

.dark .location.global code {
  background: rgba(255, 0, 102, 0.2);
  border: 1px solid rgba(255, 0, 102, 0.4);
  color: #ff0066;
}

.dark .install-banner {
  background: linear-gradient(135deg, rgba(0, 255, 159, 0.15), rgba(255, 0, 102, 0.1));
  border-bottom-color: rgba(0, 255, 159, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

@media (max-width: 768px) {
  .banner-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .close-btn {
    position: absolute;
    top: 8px;
    right: 12px;
  }

  .install-banner {
    padding: 36px 16px 12px;
  }

  .separator {
    display: none;
  }
}
</style>
