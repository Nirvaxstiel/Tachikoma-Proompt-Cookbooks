// VitePress theme extension for GITS (Ghost In The Shell) theme
// Extends default theme with custom color scheme and install banner

import DefaultTheme from 'vitepress/theme'
import './gits-theme.css'

/**
 * GITS Theme Extension
 * Extends VitePress default theme with Ghost In The Shell color palette
 * Adds install banner below navigation bar
 */

// Install banner injection script
const installBannerScript = `
  (function() {
    const navBar = document.querySelector('.VPNav');
    if (!navBar) return;

    // Create banner element
    const banner = document.createElement('div');
    banner.className = 'install-banner-wrapper';
    banner.innerHTML = \`
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
    \`;

    // Insert after nav bar
    navBar.parentNode.insertBefore(banner, navBar.nextSibling);

    // Dismiss functionality
    let dismissed = localStorage.getItem('install-banner-dismissed') === 'true';
    if (dismissed) {
      banner.style.display = 'none';
    }

    banner.querySelector('.close-btn').addEventListener('click', function() {
      localStorage.setItem('install-banner-dismissed', 'true');
      banner.style.display = 'none';
    });
  })();
`;

export default {
  ...DefaultTheme,
  enhanceApp({ app }) {
    // Inject banner script on app initialization
    if (typeof document !== 'undefined' && !document.querySelector('script[data-install-banner]')) {
      const script = document.createElement('script');
      script.dataset.installBanner = 'true';
      script.textContent = installBannerScript;
      document.head.appendChild(script);
    }
  }
}
