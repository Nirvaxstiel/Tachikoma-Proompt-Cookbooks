import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Tachikoma',
  description: 'Agent orchestration system for AI-assisted development',
  base: '/Tachikoma-Proompt-Cookbooks/',

  themeConfig: {
    logo: '/favicon.ico',

    // Simplified top navigation
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Getting Started', link: '/getting-started' },
      { text: 'Concepts', link: '/concepts/overview' },
      { text: 'Capabilities', link: '/capabilities/index' },
      { text: 'Internals', link: '/internals/' },
      { text: 'Research', link: '/research/overview' },
      { text: 'Changelog', link: '/changelog' },
    ],

    // Enhanced sidebar with all navigation
    sidebar: {
      '/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/getting-started' },
            { text: 'Troubleshooting', link: '/troubleshooting' },
          ]
        },
        {
          text: 'Concepts',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/concepts/overview' },
            { text: 'Architecture', link: '/concepts/architecture' },
          ]
        },
        {
          text: 'Capabilities',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/capabilities/index' },
            { text: 'Intent Routing', link: '/capabilities/intent-routing' },
            { text: 'Context Management', link: '/capabilities/context-management' },
            { text: 'Skill Execution', link: '/capabilities/skill-execution' },
            { text: 'Skill Chains', link: '/capabilities/skill-chains' },
            { text: 'Composite Intents', link: '/capabilities/composite-intents' },
            { text: 'Subagents', link: '/capabilities/subagents' },
            { text: 'Tools', link: '/capabilities/tools' },
            { text: 'Epistemic Mode', link: '/capabilities/epistemic-mode' },
            { text: 'Position-Aware Loading', link: '/capabilities/position-aware-loading' },
            { text: 'Communication Protocol', link: '/capabilities/communication-protocol' },
            { text: 'Skills Specification', link: '/capabilities/skills-specification' },
            { text: 'Skill Templates', link: '/capabilities/skill-templates' },
          ]
        },
        {
          text: 'Internals',
          collapsed: true,
          items: [
            { text: 'Overview', link: '/internals/' },
            { text: 'Architecture', link: '/internals/opencode-architecture' },
            { text: 'Database Schema', link: '/internals/opencode-database' },
            { text: 'Tools System', link: '/internals/opencode-tools' },
            { text: 'Skills System', link: '/internals/opencode-skills' },
            { text: 'Agents System', link: '/internals/opencode-agents' },
            { text: 'Configuration', link: '/internals/opencode-config' },
            { text: 'Agent Skills Format', link: '/internals/agent-skills-format' },
          ]
        },
        {
          text: 'Research',
          collapsed: true,
          items: [
            { text: 'Overview', link: '/research/overview' },
            { text: 'Position Bias', link: '/research/position-bias' },
            { text: 'Verification Loops', link: '/research/verification-loops' },
            { text: 'Model Harness', link: '/research/model-harness' },
            { text: 'RLM', link: '/research/rlm' },
            { text: 'Cost-Aware Routing', link: '/research/cost-aware-routing' },
            { text: 'Modularity', link: '/research/modularity' },
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
        },
        {
          text: 'Capabilities',
          collapsed: true,
          items: [
            { text: 'Overview', link: '/capabilities/index' },
            { text: 'Intent Routing', link: '/capabilities/intent-routing' },
            { text: 'Context Management', link: '/capabilities/context-management' },
            { text: 'Skill Execution', link: '/capabilities/skill-execution' },
            { text: 'Skill Chains', link: '/capabilities/skill-chains' },
            { text: 'Composite Intents', link: '/capabilities/composite-intents' },
            { text: 'Subagents', link: '/capabilities/subagents' },
            { text: 'Tools', link: '/capabilities/tools' },
          ]
        },
        {
          text: 'Internals',
          collapsed: true,
          items: [
            { text: 'Overview', link: '/internals/' },
            { text: 'Architecture', link: '/internals/opencode-architecture' },
            { text: 'Database Schema', link: '/internals/opencode-database' },
            { text: 'Tools System', link: '/internals/opencode-tools' },
            { text: 'Skills System', link: '/internals/opencode-skills' },
            { text: 'Agents System', link: '/internals/opencode-agents' },
            { text: 'Configuration', link: '/internals/opencode-config' },
            { text: 'Agent Skills Format', link: '/internals/agent-skills-format' },
          ]
        },
        {
          text: 'Research',
          collapsed: true,
          items: [
            { text: 'Overview', link: '/research/overview' },
            { text: 'Position Bias', link: '/research/position-bias' },
            { text: 'Verification Loops', link: '/research/verification-loops' },
            { text: 'Model Harness', link: '/research/model-harness' },
            { text: 'RLM', link: '/research/rlm' },
            { text: 'Cost-Aware Routing', link: '/research/cost-aware-routing' },
            { text: 'Modularity', link: '/research/modularity' },
          ]
        }
      ],
      '/capabilities/': [
        {
          text: 'Core Capabilities',
          items: [
            { text: 'Overview', link: '/capabilities/index' },
            { text: 'Intent Routing', link: '/capabilities/intent-routing' },
            { text: 'Context Management', link: '/capabilities/context-management' },
            { text: 'Skill Execution', link: '/capabilities/skill-execution' },
            { text: 'Skill Chains', link: '/capabilities/skill-chains' },
            { text: 'Composite Intents', link: '/capabilities/composite-intents' },
          ]
        },
        {
          text: 'Advanced Capabilities',
          items: [
            { text: 'Subagents', link: '/capabilities/subagents' },
            { text: 'Tools', link: '/capabilities/tools' },
          ]
        },
        {
          text: 'Tribal Capabilities',
          items: [
            { text: 'Epistemic Mode', link: '/capabilities/epistemic-mode' },
            { text: 'Position-Aware Loading', link: '/capabilities/position-aware-loading' },
            { text: 'Communication Protocol', link: '/capabilities/communication-protocol' },
          ]
        },
        {
          text: 'Reference',
          items: [
            { text: 'Skills Specification', link: '/capabilities/skills-specification' },
            { text: 'Skill Templates', link: '/capabilities/skill-templates' },
          ]
        },
        {
          text: 'Customization',
          collapsed: true,
          items: [
            { text: 'Overview', link: '/capabilities/customization/overview' },
            { text: 'Add Skill', link: '/capabilities/customization/add-skill' },
            { text: 'Add Agent', link: '/capabilities/customization/add-agent' },
            { text: 'Add Intent', link: '/capabilities/customization/add-intent' },
            { text: 'Context Modules', link: '/capabilities/customization/context-modules' },
          ]
        },
        {
          text: 'Internals',
          collapsed: true,
          items: [
            { text: 'Overview', link: '/internals/' },
            { text: 'Architecture', link: '/internals/opencode-architecture' },
            { text: 'Database Schema', link: '/internals/opencode-database' },
            { text: 'Tools System', link: '/internals/opencode-tools' },
            { text: 'Skills System', link: '/internals/opencode-skills' },
            { text: 'Agents System', link: '/internals/opencode-agents' },
            { text: 'Configuration', link: '/internals/opencode-config' },
            { text: 'Agent Skills Format', link: '/internals/agent-skills-format' },
          ]
        },
        {
          text: 'Research',
          collapsed: true,
          items: [
            { text: 'Overview', link: '/research/overview' },
            { text: 'Position Bias', link: '/research/position-bias' },
            { text: 'Verification Loops', link: '/research/verification-loops' },
            { text: 'Model Harness', link: '/research/model-harness' },
            { text: 'RLM', link: '/research/rlm' },
            { text: 'Cost-Aware Routing', link: '/research/cost-aware-routing' },
            { text: 'Modularity', link: '/research/modularity' },
          ]
        }
      ],
      '/research/': [
        {
          text: 'Research',
          items: [
            { text: 'Overview', link: '/research/overview' },
          ]
        },
        {
          text: 'Core Research',
          items: [
            { text: 'Position Bias in LLMs', link: '/research/position-bias' },
            { text: 'Verification Loops', link: '/research/verification-loops' },
            { text: 'Model Harness', link: '/research/model-harness' },
          ]
        },
        {
          text: 'Advanced Research',
          items: [
            { text: 'Recursive Language Models', link: '/research/rlm' },
            { text: 'Cost-Aware Routing', link: '/research/cost-aware-routing' },
            { text: 'Modularity', link: '/research/modularity' },
          ]
        },
        {
          text: 'Capabilities',
          collapsed: true,
          items: [
            { text: 'Overview', link: '/capabilities/index' },
            { text: 'Intent Routing', link: '/capabilities/intent-routing' },
            { text: 'Context Management', link: '/capabilities/context-management' },
            { text: 'Skill Execution', link: '/capabilities/skill-execution' },
          ]
        }
      ],
      '/internals/': [
        {
          text: 'Internals',
          items: [
            { text: 'Overview', link: '/internals/' },
            { text: 'Architecture', link: '/internals/opencode-architecture' },
            { text: 'Database Schema', link: '/internals/opencode-database' },
            { text: 'Tools System', link: '/internals/opencode-tools' },
            { text: 'Skills System', link: '/internals/opencode-skills' },
            { text: 'Agents System', link: '/internals/opencode-agents' },
            { text: 'Configuration', link: '/internals/opencode-config' },
            { text: 'Agent Skills Format', link: '/internals/agent-skills-format' },
          ]
        },
        {
          text: 'Capabilities',
          collapsed: true,
          items: [
            { text: 'Overview', link: '/capabilities/index' },
            { text: 'Intent Routing', link: '/capabilities/intent-routing' },
            { text: 'Context Management', link: '/capabilities/context-management' },
            { text: 'Skill Execution', link: '/capabilities/skill-execution' },
          ]
        },
        {
          text: 'Research',
          collapsed: true,
          items: [
            { text: 'Overview', link: '/research/overview' },
            { text: 'Position Bias', link: '/research/position-bias' },
            { text: 'Verification Loops', link: '/research/verification-loops' },
            { text: 'Model Harness', link: '/research/model-harness' },
            { text: 'RLM', link: '/research/rlm' },
            { text: 'Cost-Aware Routing', link: '/research/cost-aware-routing' },
            { text: 'Modularity', link: '/research/modularity' },
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
