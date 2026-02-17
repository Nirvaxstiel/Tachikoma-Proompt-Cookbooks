import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Tachikoma',
  description: 'Agent orchestration system for AI-assisted development',
  base: '/Tachikoma-Proompt-Cookbooks/',

  themeConfig: {
    logo: '/favicon.ico',

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
          { text: 'Skills Specification', link: '/capabilities/skills-specification' },
          { text: 'Skill Templates', link: '/capabilities/skill-templates' },
          { text: 'Customize', link: '/capabilities/customization/overview' },
          { text: 'Troubleshooting', link: '/troubleshooting' },
        ]
      },
      {
        text: 'Research',
        items: [
          { text: 'Overview', link: '/research/overview' },
        ]
      },
    ],

    sidebar: {
      '/': [
        {
          text: 'Documentation',
          items: [
            { text: 'Getting Started', link: '/getting-started' },
            { text: 'Troubleshooting', link: '/troubleshooting' },
          ]
        }
      ],
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
            { text: 'Skills Specification', link: '/capabilities/skills-specification' },
            { text: 'Skill Templates', link: '/capabilities/skill-templates' },
          ]
        },
        {
          text: 'Customization',
          items: [
            { text: 'Overview', link: '/capabilities/customization/overview' },
            { text: 'Add Skill', link: '/capabilities/customization/add-skill' },
            { text: 'Add Agent', link: '/capabilities/customization/add-agent' },
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

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Nirvaxstiel/Tachikoma-Proompt-Cookbooks' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 Tachikoma'
    },

    editLink: {
      text: 'Edit this page on GitHub',
      pattern: 'https://github.com/Nirvaxstiel/Tachikoma-Proompt-Cookbooks/edit/master/docs/:path'
    },

    search: {
      provider: 'local'
    },

    outline: {
      level: [2, 3]
    }
  },

  markdown: {
    lineNumbers: true
  }
})
