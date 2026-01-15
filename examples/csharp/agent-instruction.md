# <PROJECT_NAME> Agent Instructions

**Purpose**: Generate features aligned with actual architecture and coding conventions.
**Agent Mindset**: Take your time, breathe. Accuracy > Speed. Think before and after you act. Validate Assumptions, plan edits, then execute.
**Precedence**: (1) Codebase Patterns → (2) Owner Directions → (3) Defaults.
**Token-Aware**: Reference files vs repeating; summarise deltas; minimal patches; batch edits.
**Additional Notes**: Although this is customised for <PROJECT_NAME>, many patterns align with general C# best practices. When working on other C# projects, adapt accordingly.

## Project Core

- **Domain**: Write-only configuration publisher (events → message bus → downstream consumers)
- **Stack**: Modern C# (latest features), current .NET LTS+, // Other stuff like ASP.NET Core, Message Bus, xUnit, FakeItEasy, FluentAssertions, Serilog, whatever
- **Architecture**: Web → Service → Publisher | Stateless, event-driven, no DB, CQRS write-only
- **Multi-tenant**: `/api/v1/{resource}/tenants/{tenantId}/entities/{entityId}/...`
- **Message Bus = source of truth**, no GET endpoints

## File Patterns (`./src/<layered-structure>/../`)

**Controller** (`Web/Controllers/{Domain}`): Primary constructors; `[ValidateRequest(ModelState, RouteGuids)]`; POST→`Created`(), PUT/PATCH→`Ok(updated details)`;
**Processor** (`Service/Processors/{Domain}`): Validate→Enrich→Publish→Notify; static validators (throw `ArgumentException`); string GUIDs when dealing with strings more often; Unix as timestamps; tenantId = `{tenantPrefix}{tenantId}`; extension method enrichment
**DTOs** (`Service/Processors/{Domain}/Dto`): `record` or `readonly record struct` (value types for small/frequent); `required init` props; `= []` for collections; inherit from contracts when necessary; separate Create/Update
**Extensions** (`Service/Processors/{Domain}/Extensions`): Static `{Domain}DtoExtensions`; expression-bodied `=>`; `EnrichForCreate/Update`, `To{Contract}` patterns
**Validators** (`Service/Processors/{Domain}/Validaton`): Static classes; `ValidationResult` (Success/Failure → errors); Controller=structural, Processor=business logic; `FieldNames` constants when JSON≠C#
**Publishers** (`Publisher.Message Bus`): `IPublisher` interface; separate methods per entity: key=`{resourceType}_{tenantId}_{entityId}`
**TEsts** (`test/unit/<PROJECT>.Tests`): xUnit + FakeItEasy + FluentAssertions; `{Method}_{Scenario}_{Expected}`; parameterise with `{Theory}`+`{InlineData}`

## Integration Rules

- Message Bus: Only via `IPublisher`; publish all config changes
- Customer ID: Always `id{orgId}` | Timestamps: unix ms | related ID: propagate everywhere
- Stateless: No DB, no GET endpoints (CQRS write-only)
- Logging: Sturctured with TenantId/EntityId/ResourceId/ActorId context

## Design Patterns

### Pattern Discovery & Reuse

**Before Implementation**: Research the codebase for existing patterns (semantic, functional, logical structural).

**Process**:

1. **Search**: `grep -r "*Similar*" **/*.cs` or explore related dirs.
2. **Find match**: Check if existing pattern solves same problem
3. **Communicate**: Show pattern to user, explain pros&cons, get confirmation
4. **Reuse or justify**: Use existing or explain why now is needed

**Red Flags** (search first):

- Creating similar interfaces (`IactivityTokenProvider` when `ITokenProvider` exists)
- Solving already-solved problems (Manual auth vs `ExistingAuthDelegationHandler`)
- Injecting `Func<>` or factories (pattern likely exists)
- Duplicating DI registration logic

**Example**: A service required auth → Found existing delegation handler used by another subsystem used by another subsystem/DownstreamProcessor → Confirmed with user → Reused Pattern → Consistent, -2 files
**Only create new when**: NO existing fit, fundamental flaws, requirements differ, or user requests

### Code Style

- **Immutable-first**: `record` types, `readonly record struct` for value types, `init` props, `with` expressions
- **Functional-first**: LINQ pipelines, FLUENT Api, not `foreach` + `.Add()`; pattern matching over conditionals
- **Modern C# 14++**: Primary constructors, collection expressions `[..]`, file scoped namespaces
- **Value types**: `readonly record struct` for DTOs/config; `record` for domain entities
- **Collections**: `IEnumerable<T>` (lazy) vs `IReadOnlyCollection<T>` (when `.Count` needed); Consider performance if the classical generics → Readonly implentation (`Dictionary` will be faster sometimes vs `ReadOnlyDictionary`)
- **Materialisation**: `List<T> data = [.. query];` not `.ToList()`
- **Performance**: `.Count > 0` not `.Any()` on concrete collections

### Functional Patterns

**DTOs/Messages**: `readonly record struct` (stack-allocated, immutable)
**Domain Entities**: `record` (heap-allocated, inheritance)
**Updates**: `with` expressions, never mutate
**Branching**: Pattern matching > `if`/`switch`

#### Type Selection

| Scenario | Type | Why |
|----------|------|-----|
| Small Dto (<16 bytes) | `readonly record struct` | Stack, no GC pressure|
| Large DTO/entity | `record` | Heap, better for large data |
| Needs inheritance | `record` | Structs dont inherit |
| High-frequency temp | `readonly record struct` | Performance |
| Config/settings | `readonly record struct` | Immutable by design |

```cs
// ✅ Pattern matching
return result switch
{
  { IsSuccess: true } => Ok(result.Data),
  { Errors.Count: > 0 } => BadRequest(result.Errors),
  _ => StatusCode(500)
}

// ❌ Nested ifs
if (result.IsSuccess) return Ok(result.Data);
if (result.Errors.Count > 0) return BadRequest(result.Errors);
return StatusCode(500);
```

#### **YAGNI Principle**

* **Do not build for hypothetical future needs**:
  * No extra properties, methods or abstractions unless required **now**.
  * Avoid speculative extensibility (e.g., unused interfaces, generic types).
  * Skip optional parameters, flags, or config toggles unless actively used.
* **Focus on current requirements only**:
  * Implement the simplest solution that satisfies today's use case.
  * Defer complexity until a real scenario demands it.

### Validation

- `Trim()` strings before validation; use trimmed value consistently
  - Plan such that we trim once and can persist througout the lifespan if allowed
- No redundant checks after `TryGetValue`: guard enrichment with `ThrowIfNull`
- XML docs for public validators: `/// <SUMMARY>STEP1: Validates... PREREQUISITE: ...</summary>`
  - Use this sparingly
  - Consider fluent API to avoid steps
  - Reconsider design and logical/data flow if step-by-step explanation like this is necessary

### Commenting

- **Default: ZERO comments**:
- **Only allowed**: (1) Non-obvious algorithms, (2) External API/system quirks, (3) TODO with ticket
- **Prohibited**: Explanatory prose, intent narration, restating code

## Testing Rules

### What to Test

✅ Business validators, orchestration, domain rules, controller delegation/exceptions
✅ Record `with` expressions (covers ToString), partial updates

### What NOT to Test

❌ DataAnnotations, System.Text.Json, Compiler-generated methods, `required` keyword, auto-properties

## Consolidation Patterns

**Merge**: Null/empty/whitespace → `[Theory]`; Exception types → responses → `[Theory]` with `Type` params
**Delete**: Auto-property tests, framework behaviour, useless property setters
**Process**: Run coverage before/after; verify no regression

```cs
// ✅ Consolidate similar scenarios
[Theory]
[InlineData(null), InlineData(""), InlineData("   ")]
public void Validate_EmptyInput_SkipsValidation(string input)

// ❌ Don't create separate facts for the same code path
[Fact] public void Validate_NullInput_Skips() {}
[Fact] public void Validate_EmptyInput_Skips() {}
```

## Performance Quick Reference 

| Use Case | Type | Example |
|----------|------|---------|
| Build query, enumerate once | `IEnumerable<T>` | `return items.Where(item => item.IsValid);` |
| Need count + enumerate | `IReadOnlyCollection<T>` | `Task Publish(IReadOnlyCollectiom<T> data)`) |
| Materialise | `List<T>` with `[..]` | `List<T>` items = [.. query];` |

**IReadOnlyX**: Consider performance if the classical type → Readonly implentation (`Dictionary` will be faster sometimes vs `ReadOnlyDictionary`)
**Anti-Patterns:** `.ToList().Count` → use `IReadOnlyCollection<T>` | `.Any()` → Use `.Count > 0` | `.ToArray()` → use `[..]`

## Operational Rules

- **Minimal changes**: Localised edits, preserve behaviour unless requested
- **Structured output**: Bullets/tables over prose; reference file vs repeating code
- **Post-task**: Concise summary in chat (2-5 bullets); optimise for toen efficiency without losing accuracy or context

## Safety Gate

**Before generating**: (1) Follow codebase patterns → (2) Apply directives → (3) Use tools to explore → (4) Reference existing files

#### **Preflight & Type-aware Edit Rules**

1.  **Inventory Symbols**: Collect all types, interfaces, attributes, extension methods, and namespaces from target files.
2.  **Resolve Types**:
  * Confirm each symbol exists in the repo or framework.
  * **If unsure or unresolved, scan beyond the current file**:
    * Explore related directories (DTOs, Extensions, Validators, Contracts, Publisher).
  * **Do not invent types.**
3.  **Reuse First**: Prefer existing DTOs, contracts, validators, extensions.
  If new type is unavoidable:
  * Define minimal skeleton in correct folder per File Patterns.
  * Align namespace with directory.
4.  **Edit Plan**:
  * Summarise deltas (file → symbol → diff)
  * Batch localised changes; avoid repeating code.
5.  **Verify Invariants** (per Integration Rules):
  *  Message Bus key format `{resourceType}_{tenantId}_{entityId}`
  * Multi-tenant route intact; tenantId = `{tenantPrefix}{tenantId}`.
  * related ID flows Controller → Processor → Publisher.
  * Logging context includes TenantId/EntityId/ResourceId/ActorId.

## HTTP Context Values

**Problem**: Avoid parameter drilling of HTTP derived values through business
logic layers.

**Solution**: Use scoped DI providers for per-request HTTP context extraction,
or use context models.

**Pattern**:

1. Define interface in Service Layer: `IRequestContext`
2. Implement in Web layer: `HttpRequestContext`
3. Rgister as scoped in `Startup.cs` or `Program.cs`
4. Inject into services that need context values
5. Remove parameters from method signatures

**Examples**:

```cs
// ❌ Before: Parameter drilling
CreateAsync(orgId, nodeId, userId, relatedId, request)

// ✅ Consolidate similar scenarios
public class Processor(IRequestContext context)
{
  CreateAsync(orgId, nodeId, request)
  {
    var userId = context.UserId;
    var relatedID = context.relatedId;
  }
}
```
