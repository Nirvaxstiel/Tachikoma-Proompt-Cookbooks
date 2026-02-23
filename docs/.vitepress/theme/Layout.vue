<script setup>
import DefaultTheme from 'vitepress/theme'
import { onMounted, watch } from 'vue'
import { useRoute } from 'vitepress'

const route = useRoute()

// Inject banner after navigation
onMounted(() => {
  injectBanner()
})

watch(() => route.path, () => {
  // Re-inject on route change
  setTimeout(injectBanner, 100)
})

function injectBanner() {
  if (typeof document === 'undefined') return

  // Remove existing banner if any
  const existing = document.querySelector('.install-banner-wrapper')
  if (existing) existing.remove()

  // Check if dismissed
  if (localStorage.getItem('install-banner-dismissed') === 'true') return

  // Find nav bar
  const navBar = document.querySelector('.VPNav')
  if (!navBar) return

  // Create banner
  const banner = document.createElement('div')
  banner.className = 'install-banner-wrapper'
  banner.innerHTML = `
    <div class="banner-content">
      <span class="icon">📍</span>
      <div class="locations">
        <strong>Two Installation Locations:</strong>
        <span class="location local">Locally: <code>cwd/.opencode</code></span>
        <span class="separator">|</span>
        <span class="location global">Globally: <code>~/.config/opencode</code></span>
      </div>
      <button class="close-btn">×</button>
    </div>
  `

  // Insert after nav bar
  navBar.after(banner)

  // Close button handler
  banner.querySelector('.close-btn').addEventListener('click', () => {
    localStorage.setItem('install-banner-dismissed', 'true')
    banner.remove()
  })
}
</script>

<template>
  <DefaultTheme.Layout />
</template>
