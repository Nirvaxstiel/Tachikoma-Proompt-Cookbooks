import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Tachikoma',
  description: 'Agent orchestration system for AI-assisted development',
  base: '/Tachikoma-Proompt-Cookbooks/',

  themeConfig: {
    // Logo
    logo: '/favicon.ico',

    // Navigation
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Getting Started', link: '/getting-started' },
      {
        text: 'Concepts',
        items: [
          { text: 'Overview', link: '/concepts/overview' },
          { text: 'Architecture', link: '/concepts/architecture' },
        ]
      },
      {
        text: 'Capabilities',
        items: [
          { text: 'Intent Routing', link: '/capabilities/intent-routing' },
          { text: 'Context Management', link: '/capabilities/context-management' },
          { text: 'Skill Execution', link: '/capabilities/skill-execution' },
          { text: 'Skill Chains', link: '/capabilities/skill-chains' },
          { text: 'Composite Intents', link: '/capabilities/composite-intents' },
          { text: 'Subagents', link: '/capabilities/subagents' },
          { text: 'Customize', link: '/capabilities/customization/overview' },
        ]
      },
      {
        text: 'Research',
        items: [
          { text: 'Overview', link: '/research/overview' },
        ]
      },
    ],

    // Sidebar
    sidebar: {
      '/concepts/': [
        {
          text: 'Concepts',
          items: [
            { text: 'Overview', link: '/concepts/overview' },
            { text: 'Architecture', link: '/concepts/architecture' },
          ]
        }
      ],
      '/capabilities/': [
        {
          text: 'Capabilities',
          items: [
            { text: 'Intent Routing', link: '/capabilities/intent-routing' },
            { text: 'Context Management', link: '/capabilities/context-management' },
            { text: 'Skill Execution', link: '/capabilities/skill-execution' },
            { text: 'Skill Chains', link: '/capabilities/skill-chains' },
            { text: 'Composite Intents', link: '/capabilities/composite-intents' },
            { text: 'Subagents', link: '/capabilities/subagents' },
          ]
        },
        {
          text: 'Customization',
          items: [
            { text: 'Overview', link: '/capabilities/customization/overview' },
            { text: 'Add Skill', link: '/capabilities/customization/add-skill' },
            { text: 'Add Intent', link: '/capabilities/customization/add-intent' },
            { text: 'Context Modules', link: '/capabilities/customization/context-modules' },
          ]
        }
      ],
      '/research/': [
        {
          text: 'Research',
          items: [
            { text: 'Overview', link: '/research/overview' },
          ]
        }
      ],
    },

    // Social links
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Nirvaxstiel/Tachikoma-Proompt-Cookbooks' }
    ],

    // Footer
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 Tachikoma'
    },

    // Edit link
    editLink: {
      text: 'Edit this page on GitHub',
      pattern: 'https://github.com/Nirvaxstiel/Tachikoma-Proompt-Cookbooks/edit/master/docs/:path'
    },

    // Search
    search: {
      provider: 'local'
    },

    // Outline
    outline: {
      level: [2, 3]
    }
  },

  // Markdown configuration
  markdown: {
    lineNumbers: true
  }
})
