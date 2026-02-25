import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Tachikoma",
  description: "Agent orchestration system for AI-assisted development with PAUL methodology",
  base: "/Tachikoma-Proompt-Cookbooks/",

  themeConfig: {
    logo: "/favicon.ico",

    // Top navigation
    nav: [
      { text: "Home", link: "/" },
      { text: "Getting Started", link: "/getting-started" },
      { text: "Installation", link: "/installation" },
      { text: "Concepts", link: "/concepts/overview" },
      { text: "Capabilities", link: "/capabilities/index" },
      { text: "Internals", link: "/internals/" },
      { text: "Research", link: "/research/overview" },
    ],

    // Sidebar navigation
    sidebar: {
      "/": [
        {
          text: "Getting Started",
          items: [
            { text: "Quick Start", link: "/getting-started" },
            { text: "Installation", link: "/installation" },
          ],
        },
        {
          text: "Concepts",
          items: [
            { text: "Overview", link: "/concepts/overview" },
            { text: "Architecture", link: "/concepts/architecture" },
          ],
        },
        {
          text: "Capabilities",
          collapsed: false,
          items: [
            { text: "Overview", link: "/capabilities/index" },
            { text: "Intent Routing", link: "/capabilities/intent-routing" },
            { text: "Context Management", link: "/capabilities/context-management" },
            { text: "Skill Execution", link: "/capabilities/skill-execution" },
            { text: "Skill Chains", link: "/capabilities/skill-chains" },
            { text: "PAUL Methodology", link: "/capabilities/paul-methodology" },
            { text: "CARL Quality Gates", link: "/capabilities/carl-quality-gates" },
            { text: "Model-Aware Editing", link: "/capabilities/model-aware-editing" },
            { text: "Subagents", link: "/capabilities/subagents" },
          ],
        },
        {
          text: "Internals",
          collapsed: true,
          items: [
            { text: "Overview", link: "/internals/" },
            { text: "Architecture", link: "/internals/opencode-architecture" },
            { text: "Database Schema", link: "/internals/opencode-database" },
            { text: "Tools System", link: "/internals/opencode-tools" },
            { text: "Skills System", link: "/internals/opencode-skills" },
            { text: "Agents System", link: "/internals/opencode-agents" },
            { text: "Configuration", link: "/internals/opencode-config" },
            { text: "Agent Skills Format", link: "/internals/agent-skills-format" },
            { text: "CLI Integration", link: "/internals/cli-integration" },
          ],
        },
        {
          text: "Research",
          collapsed: true,
          items: [
            { text: "Overview", link: "/research/overview" },
            { text: "Position Bias", link: "/research/position-bias" },
            { text: "Verification Loops", link: "/research/verification-loops" },
            { text: "Model Harness", link: "/research/model-harness" },
            { text: "RLM", link: "/research/rlm" },
            { text: "Cost-Aware Routing", link: "/research/cost-aware-routing" },
            { text: "Modularity", link: "/research/modularity" },
          ],
        },
        {
          text: "Dashboard",
          collapsed: true,
          items: [{ text: "Overview", link: "/dashboard/" }],
        },
        {
          text: "Telemetry",
          collapsed: true,
          items: [
            { text: "Capabilities", link: "/telemetry/opencode-telemetry-capabilities" },
            { text: "Skill Tracking", link: "/telemetry/skill-tracking-implementation" },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/Nirvaxstiel/Tachikoma-Proompt-Cookbooks" },
    ],

    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2026 Tachikoma",
    },

    editLink: {
      text: "Edit this page on GitHub",
      pattern: "https://github.com/Nirvaxstiel/Tachikoma-Proompt-Cookbooks/edit/master/docs/:path",
    },

    search: {
      provider: "local",
    },

    outline: {
      level: [2, 3],
    },
  },

  markdown: {
    lineNumbers: true,
  },
});
