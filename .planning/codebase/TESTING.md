# Testing Patterns

**Analysis Date:** 2026-01-17

## Test Framework

**Runner:**

- Custom test runner (no external framework)
- Location: `test/test.js`

**Assertion Library:**

- Custom `assert(condition, message)` function
- Custom `test(name, fn)` wrapper

**Run Commands:**

```bash
npm test                              # Run all tests
node test/test.js                     # Direct execution
npm run test:fetch                    # Integration test (fetches real data)
npm run test:validate                 # Validation test
```

## Test File Organization

**Location:**

- All tests in `test/test.js` (single file)
- No separate test directories

**Naming:**

- Single test file: `test.js`
- No naming convention for test functions (descriptive strings)

**Structure:**

```
test/
└── test.js              # All unit tests (192 lines)
```

## Test Structure

**Suite Organization:**

```javascript
// test/test.js - Custom test pattern

console.log("Security (4-secure):");
test("validates correct Reddit URL", () => {
  assert(validateRedditUrl("https://reddit.com/r/webdev/comments/abc123/"));
});

test("rejects invalid URLs", () => {
  assert(!validateRedditUrl("https://example.com"));
});
```

**Patterns:**

- Console headers for test categories
- Simple test/assert pattern
- Manual pass/fail counting
- Process exit code indicates result

## Mocking

**Framework:**

- No mocking framework
- File I/O mocked via temp files

**Patterns:**

```javascript
// Create temp file, test, cleanup
const testFile = path.join(__dirname, "test-prompt.txt");
fs.writeFileSync(testFile, "content");
const result = loadPrompts(testFile);
assert(result.length === 1);
fs.unlinkSync(testFile);
```

**What to Mock:**

- File system (via temp files)
- No HTTP mocking (integration tests use real APIs)

**What NOT to Mock:**

- Pure functions (test directly)
- Validators (test with real inputs)

## Fixtures and Factories

**Test Data:**

- Inline test data in test functions
- No shared fixtures directory
- Temp files created and cleaned up per test

**Location:**

- Factory functions: inline in test
- No separate fixtures directory

## Coverage

**Requirements:**

- No enforced coverage target
- Focus on critical paths (security, parsing)

**Configuration:**

- No coverage tool configured
- Manual verification via test pass/fail

## Test Types

**Unit Tests:**

- Security validators: 8+ test cases
- Parser utilities: 3 test cases
- Config loading: 2 test cases
- Metrics collection: 3 test cases

**Integration Tests:**

- `npm run test:fetch` - Real Reddit API call
- `npm run test:validate` - CLI validation

**E2E Tests:**

- Not implemented
- Manual testing via CLI

## Common Patterns

**Positive/Negative Testing:**

```javascript
test("validates correct Reddit URL", () => {
  assert(validateRedditUrl("https://reddit.com/r/webdev/comments/abc123/"));
});

test("rejects invalid URLs", () => {
  assert(!validateRedditUrl("https://example.com"));
});
```

**Edge Case Testing:**

```javascript
test("handles null/undefined in validators", () => {
  assert(!validateRedditUrl(null));
  assert(!validateRedditUrl(undefined));
});

test("handles empty input", () => {
  assert(decodeHtmlEntities("") === "");
  assert(decodeHtmlEntities(null) === "");
});
```

**Error Testing:**

- Not extensively covered
- Happy path focus

## Test Categories

1. **Security (4-secure)** - URL validation, subreddit validation, input sanitization
2. **Parser (6-test)** - HTML decoding, comment flattening
3. **Config (5-optimize)** - Prompt loading
4. **Performance (5-optimize)** - Timer functionality
5. **Additional Security** - API key validation, data redaction
6. **Monitor (8-monitor)** - MetricsCollector

## Test Results

**Current Status:**

- 19 tests passing
- 0 tests failing
- All critical paths covered

**Output Format:**

```
=== Reddit Parser Tests ===

Security (4-secure):
  ✓ validates correct Reddit URL
  ✗ rejects invalid URLs
    Error: Assertion failed

==============================
Results: 18 passed, 1 failed
==============================
```

---

_Testing analysis: 2026-01-17_
_Update when test patterns change_
