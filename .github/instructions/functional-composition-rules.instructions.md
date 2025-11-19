---
applyTo: "**"
---

# Functional Composition and Architecture Rules

## Single Responsibility Per Function

Each function must have ONE clearly defined responsibility that can be stated in a single sentence without using "and" or "or".

**Violation indicator**: If the TSDoc requires multiple paragraphs to explain what the function does, it violates Single Responsibility.

## Input/Output Transparency

Function parameters must be **minimal** and **self-documenting**.

- **Maximum 3 parameters** - More indicates the function is doing too much or the domain model is wrong
- Parameters must represent the **minimum necessary** to perform the single responsibility
- No hidden dependencies on global state

## No Leaky Abstractions

Functions must not leak implementation details through their signatures or return types.

**Return simple, opaque types** - Callers should not need to understand internal data structures.

## Composition Over Configuration

Prefer **composing small functions** over **configuring large functions**.

**Violations:**

- Functions with mode switches (`if (mode === "x")`)
- Functions with option objects that change core behavior
- Functions with conditional branching based on configuration

**Fix**: Create separate functions, let the caller compose them.

## Pipeline Clarity

When multiple transformations are chained, each step must be **independently useful** and **testable in isolation**.

**Test**: Can you remove a pipeline step without changing the output? Then that step is worthless cargo-cult code.

**Example violation:**

```typescript
// normalizeValue is shallow, stringify does deep work anyway
const result = stringify(normalizeValue(v)); // normalizeValue is WORTHLESS
```

## No Action-At-A-Distance

Functions must not have hidden dependencies on distant state or cause distant mutations.

**Violations:**

- Reading from global registry AND modifying it in the same function
- Side effects that affect state unrelated to the function's stated purpose
- Mixing query (read) and command (write) operations

**Fix**: Separate read from write. Make dependencies explicit parameters. Return data, let caller decide persistence.

## Testability and Reusability

If a function cannot be meaningfully tested or used **without importing its entire dependency graph**, it's poorly designed.

**Red flags:**

- "I can't test this function without mocking 5 other modules"
- "This function only makes sense when called from one specific place"
- "The parameters are so specific that only one caller could ever use this"

**Fix**: Extract pure logic into a function with simple types. Leave plumbing/wiring as a thin wrapper.

---

## Code Review Checklist

1. ✓ **Can I state this function's purpose in one sentence without "and"?**
2. ✓ **Are there 3 or fewer parameters?**
3. ✓ **Does this function only read OR only write, not both?**
4. ✓ **Can I test this function in isolation with simple inputs?**
5. ✓ **Do all pipeline steps produce output used by the next step?**
6. ✓ **Is there only one code path (no mode switches)?**
7. ✓ **Does the return type hide implementation details?**

If any answer is ❌, the function needs refactoring.
