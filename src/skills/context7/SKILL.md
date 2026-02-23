---
name: context7
description: Retrieve live documentation and patterns from context7.com for libraries, frameworks, and APIs
keywords:
  - documentation
  - library
  - framework
  - api
  - patterns
  - best practices
  - how to
  - context
triggers:
  - how do i
  - what are the best practices for
  - patterns for
  - documentation for
  - learn about
  - context for
---

# Context7 External Documentation

Retrieve live, domain-specific knowledge from context7.com when you need library/framework patterns, API documentation, or best practices.

## When to Use

Activate when:
- User asks about a specific library or framework
- Need API documentation for a technology
- Looking for best practices or patterns
- Domain knowledge required for implementation
- "How do I..." questions about specific technologies

## Context7 API

**Base URL:** `https://context7.com/api/v2`

### Search for Library

```bash
GET /libs/search?libraryName={name}&query={topic}
```

Returns library IDs and descriptions.

### Fetch Documentation

```bash
GET /context?libraryId={id}&query={topic}&type=txt
```

Returns raw documentation text.

## Workflow

1. **Identify Domain**
   - Extract library/framework name from request
   - Identify specific topic (e.g., "authentication", "hooks", "routing")

2. **Search Library**
   - Use webfetch to query Context7 search API
   - Find correct library ID

3. **Fetch Documentation**
   - Use webfetch to get documentation for specific topic
   - Parse and extract relevant sections

4. **Present Findings**
   - Summarize key patterns/practices
   - Provide code examples if available
   - Link to full documentation if needed

## Example Query

```
User: "How do I implement authentication in NestJS?"

Context7 process:
1. Search: libraryName="NestJS", query="authentication"
2. Fetch: libraryId="/frameworks/nestjs", query="authentication"
3. Extract: Guard pattern, JWT strategies, middleware setup
4. Present: Code examples + patterns specific to NestJS
```

## Output Format

Provide:
- **Summary**: Brief overview of patterns/practices
- **Key Concepts**: Main ideas from documentation
- **Code Examples**: Relevant snippets from retrieved docs
- **Best Practices**: Recommended approaches
- **References**: Link to full Context7 documentation if needed

## Important

- Use webfetch tool for all Context7 API calls
- Cache retrieved documentation if session may need it again
- Summarize findings, don't dump entire response
- Focus on actionable patterns, not exhaustive documentation
