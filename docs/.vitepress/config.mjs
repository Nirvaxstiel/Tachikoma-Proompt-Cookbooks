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
      { text: 'Deployment', link: '/deployment' },
      { text: 'Deployment', link: '/deployment' },
      {
        text: 'Explanation',
        items: [
          { text: 'Overview', link: '/explanation/overview' },
          { text: 'Architecture', link: '/explanation/architecture' },
          { text: 'Intent Routing', link: '/explanation/intent-routing' },
          { text: 'Skill Chains', link: '/explanation/skill-chains' },
          { text: 'Composite Intents', link: '/explanation/composite-intents' },
        ]
      },
      { 
        text: 'How-To',
        items: [
          { text: 'Add Skill', link: '/how-to/add-skill' },
          { text: 'Add Intent', link: '/how-to/add-intent' },
          { text: 'Customize', link: '/how-to/customize' },
        ]
      },
      {
        text: 'Reference',
        items: [
          { text: 'Skills', link: '/reference/skills' },
          { text: 'Subagents', link: '/reference/subagents' },
          { text: 'Context Modules', link: '/reference/context' },
        ]
      },
      { 
        text: 'Guides',
        items: [
          { text: 'Understanding Changes', link: '/guides/understanding-changes' },
          { text: 'Massive Refactor', link: '/guides/massive-refactor' },
        ]
      },
      { 
        text: 'Research',
        items: [
          { text: 'Sources & Papers', link: '/research/index' },
        ]
      },
    ],

    // Sidebar
    sidebar: {
      '/explanation/': [
        {
          text: 'Explanation',
          items: [
            { text: 'Overview', link: '/explanation/overview' },
            { text: 'Architecture', link: '/explanation/architecture' },
            { text: 'Intent Routing', link: '/explanation/intent-routing' },
            { text: 'Skill Chains', link: '/explanation/skill-chains' },
            { text: 'Composite Intents', link: '/explanation/composite-intents' },
          ]
        }
      ],
      '/how-to/': [
        {
          text: 'How-To Guides',
          items: [
            { text: 'Add Skill', link: '/how-to/add-skill' },
            { text: 'Add Intent', link: '/how-to/add-intent' },
            { text: 'Customize', link: '/how-to/customize' },
          ]
        }
      ],
      '/reference/': [
        {
          text: 'Reference',
          items: [
            { text: 'Skills', link: '/reference/skills' },
            { text: 'Subagents', link: '/reference/subagents' },
            { text: 'Context Modules', link: '/reference/context' },
          ]
        }
      ],
      '/guides/': [
        {
          text: 'Guides',
          items: [
            { text: 'Understanding Changes', link: '/guides/understanding-changes' },
            { text: 'Massive Refactor', link: '/guides/massive-refactor' },
          ]
        }
      ],
      '/research/': [
        {
          text: 'Research',
          items: [
            { text: 'Sources & Papers', link: '/research/index' },
          ]
        }
      ],
    },

    // Social links
    socialLinks: [
      { icon: 'github', link: 'https://github.com/your-repo' }
    ],

    // Footer
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 Tachikoma'
    },

    // Edit link
    editLink: {
      text: 'Edit this page on GitHub',
      pattern: 'https://github.com/your-repo/edit/main/docs/:path'
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
