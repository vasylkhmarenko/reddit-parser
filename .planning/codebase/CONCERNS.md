# Codebase Concerns

**Analysis Date:** 2026-01-17

## Tech Debt

**Main CLI file size:**

- Issue: `reddit-parser.js` is 404 lines with multiple responsibilities
- Why: Rapid development, all command logic in single file
- Impact: Harder to navigate, test, and maintain
- Fix approach: Extract command handlers to separate files in `src/commands/`

## Known Bugs

**No critical bugs identified.**

The codebase appears stable with comprehensive input validation.

## Security Considerations

**API Key Exposure Risk:**

- Risk: `.env` file could accidentally be committed
- Files: `.env` (gitignored), `.env.example` (safe template)
- Current mitigation: `.gitignore` includes `.env`
- Recommendations: Add pre-commit hook to prevent `.env` commits

**Input Validation (GOOD):**

- Strong URL validation: `validateRedditUrl()` in `src/utils.js`
- Subreddit name validation: `validateSubreddit()` in `src/utils.js`
- API key format validation: `validateApiKey()` in `src/utils.js`
- Sensitive data redaction: `redactSensitive()` in `src/utils.js`

## Performance Bottlenecks

**Sequential LLM Requests:**

- Problem: Analysis requests processed sequentially in loop
- File: `src/analyzer.js` (runAnalysis function)
- Measurement: Not measured, but compounds with multiple prompts
- Cause: Intentional for rate limiting, but not documented
- Improvement path: Document rationale or add parallel option

**No Comment Limit on Fetch:**

- Problem: All comments fetched before analysis truncation
- File: `src/fetcher.js`
- Measurement: Memory usage could spike on large threads
- Cause: Truncation happens in formatter (50 comments), not fetcher
- Improvement path: Add early truncation in fetcher for memory efficiency

## Fragile Areas

**Reddit API Response Parsing:**

- File: `src/fetcher.js` (lines 85-86)
- Why fragile: Assumes specific array indices without validation
- Code: `data[0].data.children[0].data` and `data[1].data.children`
- Common failures: Reddit API format changes, malformed responses
- Safe modification: Add existence checks before array access
- Test coverage: Not tested for malformed responses

**JSON Parsing Without Try-Catch:**

- File: `src/analyzer.js` (lines 73, 107, 131)
- Why fragile: `response.json()` calls not wrapped in try-catch
- Common failures: Non-JSON response from API
- Safe modification: Wrap in try-catch, provide clear error messages
- Test coverage: Not tested for JSON parse failures

## Scaling Limits

**Memory:**

- Current capacity: Handles typical Reddit threads well
- Limit: Very large threads (1000+ comments) may consume significant memory
- Symptoms at limit: Process slowdown, potential OOM
- Scaling path: Stream processing or early truncation

**API Rate Limits:**

- Reddit: 1000ms delay implemented (configurable)
- LLM APIs: No explicit rate limiting beyond sequential processing
- Scaling path: Add configurable rate limiting for LLM calls

## Dependencies at Risk

**None identified.**

All dependencies are:

- `commander` ^12.0.0 - Actively maintained
- `dotenv` ^17.2.3 - Actively maintained
- `eslint` ^9.39.2 - Actively maintained

## Missing Critical Features

**No critical features missing for current scope.**

Nice-to-have improvements:

- Retry logic for LLM API failures (only Reddit has retries)
- Progress indicator for long operations
- Caching for repeated requests

## Test Coverage Gaps

**Error Handling Tests:**

- What's not tested: API errors (404, 500, timeout, malformed responses)
- Risk: Error conditions could have unclear behavior
- Priority: Medium
- Difficulty to test: Would require HTTP mocking

**Edge Cases:**

- What's not tested: Deleted posts, suspended users, private subreddits
- Risk: Could crash or produce confusing errors
- Priority: Low
- Difficulty to test: Requires specific Reddit content states

**LLM Integration:**

- What's not tested: LLM API responses, error handling
- Risk: LLM failures not gracefully handled
- Priority: Medium
- Difficulty to test: Would require API mocking or test accounts

---

_Concerns audit: 2026-01-17_
_Update as issues are fixed or new ones discovered_
