# Troubleshooting & FAQ

Common issues and solutions for working with Tachikoma, skills, agents, and capabilities.

## Quick Fixes

| Problem | Quick Fix |
|---------|------------|
| Skill not loading | Check YAML frontmatter is valid |
| Wrong skill being called | Verify route name matches skill name |
| Low confidence on intent | Add keywords to intent classifier |
| Instructions not followed | Check skill formatting and clarity |
| Subagent not invoked | Verify routing configuration |
| Context module missing | Check file path and naming |
| Edit format failing | Try model-aware-editor skill |

---

## FAQ

### General Questions

**Q: What is Tachikoma?**
A: Tachikoma is a primary orchestrator agent that receives all user input, classifies intent, and routes tasks to the appropriate skill or subagent.

**Q: What's the difference between a skill and a subagent?**
A: Skills are for routine, focused tasks (normal context window). Subagents are for complex, large-context tasks (unlimited context via chunking).

**Q: How do I add my own capabilities?**
A: Create custom skills, agents, or context modules following the [Agent Skills specification](/capabilities/skills-specification). See [Add Skill](/capabilities/customization/add-skill) and [Add Agent](/capabilities/customization/add-agent).

**Q: Can I use Tachikoma with different AI agents?**
A: Yes! Tachikoma is built on the Agent Skills standard and is compatible with any skills-supporting agent.

---

## Skill Issues

### Skill Not Loading

**Symptoms:**
- Skill doesn't activate even when it should
- Intent classifier doesn't recognize relevant keywords
- No error message, just wrong skill is used

**Solutions:**

1. **Check YAML Frontmatter**
   ```yaml
   # Correct format
   ---
   name: my-skill
   description: What this skill does
   ---

   # Common mistakes
   ---  # Missing closing dashes
   name: MySkill  # Uppercase not allowed
   name: my-skill  # Description field missing
   ```

2. **Verify Naming**
   - Skill directory name must match `name` field exactly
   - Must be lowercase, numbers, hyphens only
   - No consecutive hyphens

3. **Check Intent Classifier**
   - Update `.opencode/skills/intent-classifier/SKILL.md`
   - Add your skill's keywords to appropriate patterns
   - Include examples that match your skill

4. **Validate Skill**
   ```bash
   # If you have skills-ref
   skills-ref validate .opencode/skills/my-skill
   ```

### Instructions Not Followed

**Symptoms:**
- Agent doesn't follow skill instructions
- Agent ignores boundaries
- Agent makes assumptions not in skill

**Solutions:**

1. **Check Skill Clarity**
   - Be explicit about what to do and what not to do
   - Provide step-by-step instructions
   - Use clear, unambiguous language

2. **Verify Skill Formatting**
   - Use proper Markdown headings
   - Keep sections focused
   - Include examples

3. **Check Context Modules**
   - Ensure relevant context is loaded
   - Verify modules aren't conflicting
   - Check module priority

4. **Test with Explicit Requests**
   ```
   User: "Use the my-skill to do X"
   ```
   This forces skill activation for testing.

### Skill Too Large

**Symptoms:**
- Token limit warnings
- Slow loading
- Lost-in-the-middle problem

**Solutions:**

1. **Split Into Multiple Skills**
   - One skill per primary purpose
   - Use skill chains for complex workflows

2. **Use Progressive Disclosure**
   ```
   SKILL.md (< 500 lines, < 5000 tokens)
   ├── references/  # Detailed docs (loaded on demand)
   └── scripts/     # Executable code
   ```

3. **Move Reference Material**
   - Put detailed documentation in `references/`
   - Link from main SKILL.md
   - Load only when needed

---

## Intent Routing Issues

### Wrong Intent Classification

**Symptoms:**
- Task routed to wrong skill
- Wrong subagent is invoked
- "Unclear" intent when it should be clear

**Solutions:**

1. **Update Intent Classifier**
   - Add keywords to appropriate patterns
   - Include examples that match your use case
   - Check for keyword conflicts

2. **Adjust Confidence Threshold**
   ```yaml
   routes:
     my-intent:
       confidence_threshold: 0.7  # Lower to be more permissive
       # or
       confidence_threshold: 0.85  # Higher to be more strict
   ```

3. **Add Alternative Intents**
   ```yaml
   alternative_intents:
     - intent: debug
       confidence: 0.7
     - intent: implement
       confidence: 0.6
   ```

4. **Check for Ambiguity**
   - If query is genuinely ambiguous, it's OK to ask
   - Provide clear feedback to user

### Always "Unclear" Intent

**Symptoms:**
- Every query returns "unclear"
- Confidence is always low
- Agent asks for clarification too often

**Solutions:**

1. **Add Pattern Matching**
   ```markdown
   ### My Intent Patterns
   - Keywords: `keyword1`, `keyword2`, `keyword3`
   - Indicators: [what triggers this intent]
   ```

2. **Include Examples**
   ```markdown
   ### Usage Example
   **User:** "fix the bug"
   **Intent:** debug
   **Confidence:** 0.95
   ```

3. **Check for Over-specificity**
   - Make patterns broader
   - Include synonyms
   - Account for different phrasings

---

## Context Module Issues

### Module Not Loading

**Symptoms:**
- Context modules don't affect behavior
- Rules aren't being followed
- Module seems to be ignored

**Solutions:**

1. **Check File Location**
   - Must be in `.opencode/context/`
   - File name must follow pattern: `XX-name.md`
   - XX is the priority (00-99)

2. **Verify Frontmatter**
   ```yaml
   ---
   module_id: my-module
   name: My Module
   priority: 45
   ---
   ```

3. **Check Route Configuration**
   ```yaml
   routes:
     my-intent:
       context_modules:
         - 00-core-contract
         - 45-my-module  # Must reference by filename prefix
   ```

4. **Verify Coupling**
   ```yaml
   module_coupling:
     10-coding-standards:
       must_co_load:
         - 12-commenting-rules
   ```

### Conflicting Rules

**Symptoms:**
- Modules have conflicting instructions
- Agent behaves inconsistently
- Some rules ignored

**Solutions:**

1. **Clarify Conflicts**
   - Make rules more specific
   - Add conditions to rules
   - Document priorities

2. **Check Module Priority**
   - Lower priority modules load first
   - Later modules can override earlier ones
   - Adjust if needed

3. **Split Modules**
   - Separate concerns into different modules
   - Avoid overlap
   - Each module has clear focus

---

## Subagent Issues

### Subagent Not Invoked

**Symptoms:**
- Complex task routed to skill instead of subagent
- Large context fails to process
- "Complex" intent not recognized

**Solutions:**

1. **Check Route Configuration**
   ```yaml
   routes:
     complex:
       subagent: rlm-optimized  # Not 'skill'
       fallback_subagent: rlm-subcall
   ```

2. **Verify Intent Classification**
   - Ensure query triggers "complex" intent
   - Keywords: "entire", "all files", "bulk", "large"
   - Check confidence threshold

3. **Check Context Size**
   - Subagents for >2000 tokens
   - Skills for normal context
   - Reroute if context is actually small

### Subagent Fails Silently

**Symptoms:**
- No output or error
- Partial results only
- Task times out

**Solutions:**

1. **Check SUBAGENT.md**
   - Verify YAML frontmatter is valid
   - Check instructions are clear
   - Ensure tools are listed

2. **Add Error Handling**
   ```markdown
   ## Error Handling

   If [error occurs]:
   1. Identify the issue
   2. Report clearly
   3. Suggest recovery
   4. Offer to retry
   ```

3. **Check Tool Access**
   - Verify subagent has required tools
   - Check tool syntax
   - Test tools manually

---

## Common Mistakes

### 1. Forgetting Frontmatter

**Mistake:**
```markdown
# My Skill

Instructions...
```

**Fix:**
```yaml
---
name: my-skill
description: What this skill does
---

# My Skill

Instructions...
```

### 2. Wrong Naming Convention

**Mistake:**
```
name: MySkill
name: my-skill-
name: my--skill
```

**Fix:**
```
name: my-skill
```

### 3. Missing Context Modules

**Mistake:**
```yaml
routes:
  debug:
    skill: code-agent
    # Missing context_modules
```

**Fix:**
```yaml
routes:
  debug:
    skill: code-agent
    context_modules:
      - 00-core-contract
      - 10-coding-standards
      - 12-commenting-rules
```

### 4. Not Testing Edge Cases

**Mistake:**
- Only testing happy path
- Not testing error conditions
- No fallback strategies

**Fix:**
- Test normal usage
- Test with missing dependencies
- Test with invalid input
- Test with empty context

### 5. Over-engineering

**Mistake:**
- Creating skill for simple tasks
- Adding unnecessary complexity
- Making skills too large

**Fix:**
- Keep skills focused
- Use skill chains for complexity
- Split when too large

---

## Debugging Tips

### Enable Debug Mode

Check what's being loaded and routed:

```yaml
behavior:
  report_routing: true
  report_alternatives: true
```

### Check Logs

Review agent logs for:
- Intent classification results
- Skill activation
- Module loading
- Tool usage

### Test in Isolation

Test components individually:

1. **Test Skill**
   ```
   User: "Use the my-skill to do X"
   ```

2. **Test Intent**
   ```
   User: "What intent would you classify this as: [query]?"
   ```

3. **Test Route**
   ```
   User: "Show me the route for [intent]"
   ```

### Use Progressive Testing

1. Start with simple query
2. Gradually add complexity
3. Identify where it fails
4. Fix the specific issue

---

## Performance Issues

### Slow Response Times

**Solutions:**

1. **Reduce Context Loading**
   - Only load necessary modules
   - Use conditional context
   - Lazy load reference materials

2. **Optimize Skill Size**
   - Keep SKILL.md under 500 lines
   - Move detailed docs to `references/`
   - Use progressive disclosure

3. **Adjust Confidence Thresholds**
   - Lower thresholds reduce classification time
   - Balance with accuracy

4. **Use Subagents Wisely**
   - Subagents are slower than skills
   - Only use for truly large context
   - Skills for routine tasks

### High Token Usage

**Solutions:**

1. **Use Selective Loading**
   - Load only relevant modules
   - Don't load everything
   - Respect module priorities

2. **Compress Instructions**
   - Be concise
   - Use bullet points
   - Remove redundancy

3. **Cache Common Patterns**
   - Reuse loaded context when possible
   - Avoid re-loading same modules

---

## Getting Help

### When to Seek Help

- You've tried all troubleshooting steps
- Issue is blocking critical work
- You're not sure how to proceed
- Something seems broken (not just misconfigured)

### What to Include

When reporting issues:

1. **Description**
   - What you were trying to do
   - What you expected to happen
   - What actually happened

2. **Context**
   - Your configuration files
   - Skill/subagent definitions
   - Intent classifier patterns

3. **Error Messages**
   - Full error output
   - Stack traces
   - Logs

4. **Steps to Reproduce**
   - Clear, reproducible steps
   - Minimal example
   - Expected vs actual

### Resources

- [Agent Skills Specification](/capabilities/skills-specification)
- [Add Skill Guide](/capabilities/customization/add-skill)
- [Add Agent Guide](/capabilities/customization/add-agent)
- [Context Modules](/capabilities/customization/context-modules)
- [Intent Routing](/capabilities/intent-routing)

---

## Best Practices Checklist

### Creating Skills
- [ ] Valid YAML frontmatter with required fields
- [ ] Correct naming (lowercase, hyphens)
- [ ] Clear description with when-to-use
- [ ] Step-by-step instructions
- [ ] Examples and edge cases
- [ ] Proper error handling
- [ ] Under 500 lines (or split)
- [ ] Tested with real queries

### Creating Intents
- [ ] Added keywords to classifier
- [ ] Configured route with appropriate threshold
- [ ] Loaded relevant context modules
- [ ] Tested with various phrasings
- [ ] Checked for conflicts with other intents

### Creating Context Modules
- [ ] Proper frontmatter with priority
- [ ] Clear, focused rules
- [ ] No conflicts with other modules
- [ ] Referenced in routes
- [ ] Tested with real tasks

### Creating Subagents
- [ ] Valid SUBAGENT.md with capabilities
- [ ] Clear workflow and limitations
- [ ] Proper routing configuration
- [ ] Error handling in place
- [ ] Tested with large context

---

## Quick Reference

### Common YAML Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `mapping values are not allowed here` | Indentation issue | Check indentation (use spaces, not tabs) |
| `could not find expected ':'` | Missing colon | Add colons after keys |
| `expected <document start>` | Missing frontmatter | Add `---` before YAML |

### Common Naming Errors

| Invalid | Valid | Reason |
|---------|--------|--------|
| `MySkill` | `my-skill` | Uppercase not allowed |
| `my-skill-` | `my-skill` | Can't end with hyphen |
| `-my-skill` | `my-skill` | Can't start with hyphen |
| `my--skill` | `my-skill` | No consecutive hyphens |

### Common File Locations

| File Type | Location |
|-----------|----------|
| Skills | `.opencode/skills/my-skill/SKILL.md` |
| Subagents | `.opencode/agents/subagents/my-subagent/SUBAGENT.md` |
| Context Modules | `.opencode/context/XX-my-module.md` |
| Routes | `.opencode/config/intent-routes.yaml` |
| Intent Classifier | `.opencode/skills/intent-classifier/SKILL.md` |

---

## See Also

- [Skills Specification](/capabilities/skills-specification) - Complete format reference
- [Skill Execution](/capabilities/skill-execution) - How skills work
- [Intent Routing](/capabilities/intent-routing) - How routing works
- [Context Management](/capabilities/context-management) - How context loading works
- [Architecture](/concepts/architecture) - System architecture overview
