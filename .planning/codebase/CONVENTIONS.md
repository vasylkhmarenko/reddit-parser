# Coding Conventions

**Analysis Date:** 2026-01-17

## Naming Patterns

**Files:**

- kebab-case for all files: `reddit-parser.js`, `market-gaps.txt`
- Descriptive names: `fetcher.js`, `parser.js`, `formatter.js`
- Test files: `test.js` in `test/` directory

**Functions:**

- camelCase for all functions: `fetchThread()`, `parseComments()`, `validateRedditUrl()`
- Verb-first pattern: `fetch*`, `parse*`, `format*`, `validate*`, `run*`, `load*`
- Helper prefixes: `with*` (e.g., `fetchWithRetry()`), `create*` (e.g., `createTimer()`)

**Variables:**

- camelCase for variables: `postData`, `commentsData`, `providerConfig`
- UPPER_SNAKE_CASE for constants: `MAX_ITEMS`, `DEFAULT_USER_AGENT`, `DEFAULT_TIMEOUT_MS`
- No underscore prefix for private members

**Types:**

- PascalCase for classes: `LLMAnalyzer`, `RateLimiter`, `MetricsCollector`
- No TypeScript, no interfaces

## Code Style

**Formatting:**

- 2-space indentation
- Double quotes for strings
- Semicolons required
- No Prettier (manual formatting)

**Linting:**

- ESLint with `eslint.config.mjs` (flat config format)
- Extends `@eslint/js` recommended
- Rule: `no-unused-vars` with `argsIgnorePattern: "^_"`
- Rule: `no-console: off` (console logging allowed)
- Run: `npm run lint`

## Import Organization

**Order:**

1. Built-in modules (fs, path)
2. External packages (commander, dotenv)
3. Internal modules (./src/\*)

**Grouping:**

- CommonJS `require()` statements
- Destructuring for multiple imports
- No blank lines between groups

**Path Style:**

- Relative imports for internal: `require("./parser")`
- No path aliases

## Error Handling

**Patterns:**

- Throw errors at service level
- Catch at command/boundary level
- Include descriptive error messages

**Error Types:**

- `throw new Error("descriptive message")` for all errors
- No custom error classes
- Include context in message

**Async:**

- Use try/catch blocks
- No `.catch()` chains
- Await all promises

## Logging

**Framework:**

- Custom logger in `src/utils.js`
- Levels: ERROR, WARN, INFO, DEBUG

**Patterns:**

- `log.info()`, `log.error()`, `log.debug()`
- Include context in log messages
- No console.log in library code (use logger)

## Comments

**When to Comment:**

- Module-level JSDoc for file purpose
- Inline comments for complex logic
- Security-sensitive code marked with `// Security`
- Performance code marked with `// Optimize`

**JSDoc/TSDoc:**

- File-level comments: `/** Module description */`
- No function-level JSDoc (self-documenting names preferred)

**TODO Comments:**

- Not used in codebase
- Issues tracked externally

## Function Design

**Size:**

- Keep under 50 lines where practical
- Extract helpers for complex logic
- Main CLI file is exception (404 lines)

**Parameters:**

- Max 3-4 parameters
- Use options object for configuration
- Default values in parameter list

**Return Values:**

- Explicit return statements
- Return early for guard clauses
- Consistent return types

## Module Design

**Exports:**

- Named exports via `module.exports = { ... }`
- No default exports
- Export only public API

**Imports:**

- CommonJS `require()` (no ESM in application code)
- ESM for config files only (`eslint.config.mjs`)

**Dependencies:**

- No circular dependencies
- Utils module is a leaf (no internal imports)
- Clear layer boundaries

---

_Convention analysis: 2026-01-17_
_Update when patterns change_
