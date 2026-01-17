# External Integrations

**Analysis Date:** 2026-01-17

## APIs & External Services

**Reddit API (Public):**

- Type: Public JSON endpoint (no authentication required)
- Base URL: `https://www.reddit.com/r/`
- Format: Append `.json` to any Reddit URL
- User-Agent: "RedditParser/2.0" - `reddit-parser.config.json`
- Rate Limiting: 1000ms delay between requests (configurable)
- Retry Policy: 3 max retries with exponential backoff
- Implementation: `src/fetcher.js`

**Anthropic Claude API:**

- Type: LLM for AI analysis (primary provider)
- Endpoint: `https://api.anthropic.com/v1/messages` - `src/analyzer.js`
- Auth: `ANTHROPIC_API_KEY` environment variable
- Model: claude-sonnet-4-20250514 (default)
- Implementation: `LLMAnalyzer.analyzeWithClaude()` - `src/analyzer.js`

**OpenAI API:**

- Type: LLM for AI analysis (alternative)
- Endpoint: `https://api.openai.com/v1/chat/completions` - `src/analyzer.js`
- Auth: `OPENAI_API_KEY` environment variable
- Model: gpt-4o (default)
- Implementation: `LLMAnalyzer.analyzeWithOpenAI()` - `src/analyzer.js`

**Ollama (Local LLM):**

- Type: Local LLM for on-premise AI analysis
- Base URL: `http://localhost:11434` (default, configurable via `OLLAMA_BASE_URL`)
- Endpoint: `{baseUrl}/api/generate`
- Model: llama3 (default)
- Implementation: `LLMAnalyzer.analyzeWithOllama()` - `src/analyzer.js`

## Data Storage

**Databases:**

- Not applicable (CLI tool, no persistent storage)

**File Storage:**

- Local filesystem only
- Output files written to `output/` directory or custom path via `-o` flag

**Caching:**

- None (stateless tool)

## Authentication & Identity

**Auth Provider:**

- Not applicable (CLI tool)

**API Authentication:**

- Anthropic: API key via `x-api-key` header
- OpenAI: Bearer token via `Authorization` header
- Ollama: No authentication (local)

## Monitoring & Observability

**Error Tracking:**

- Console logging with configurable levels (ERROR, WARN, INFO, DEBUG)
- `MetricsCollector` class for request/error tracking - `src/utils.js`

**Analytics:**

- Built-in metrics: request counts, timing, error counts
- Display via `--stats` CLI flag

**Logs:**

- stdout/stderr only
- Structured logging via custom logger - `src/utils.js`

## CI/CD & Deployment

**Hosting:**

- Not applicable (local CLI tool)

**CI Pipeline:**

- Not configured
- Manual testing via `npm test`

## Environment Configuration

**Development:**

- Required: Node.js 18+
- Optional: API keys for LLM analysis
- Config: `.env.local` or `.env` (gitignored)

**Production:**

- Same as development (CLI tool)
- No separate environments

## Webhooks & Callbacks

**Incoming:**

- None

**Outgoing:**

- None

---

_Integration audit: 2026-01-17_
_Update when adding/removing external services_
