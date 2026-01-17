# Architecture

**Analysis Date:** 2026-01-17

## Pattern Overview

**Overall:** CLI Application with Layered Architecture

**Key Characteristics:**

- Single executable with subcommands
- Modular service layer
- File-based configuration
- Stateless execution model

## Layers

**Command Layer:**

- Purpose: Parse user input and route to appropriate handler
- Contains: CLI commands, argument parsing, help text
- Location: `reddit-parser.js`
- Depends on: All service layers
- Used by: CLI entry point

**Service Layer:**

- Purpose: Core business logic
- Contains: Fetcher, Analyzer, Formatter modules
- Location: `src/fetcher.js`, `src/analyzer.js`, `src/formatter.js`
- Depends on: Parser, Utils, Config
- Used by: Command handlers

**Data Processing Layer:**

- Purpose: Parse and transform Reddit data
- Contains: Comment parsing, HTML decoding, data flattening
- Location: `src/parser.js`
- Depends on: None
- Used by: Fetcher, Formatter

**Configuration Layer:**

- Purpose: Load and merge configuration from multiple sources
- Contains: Config loading, provider selection, prompt parsing
- Location: `src/config.js`
- Depends on: fs, path
- Used by: Command layer, Analyzer

**Utility Layer:**

- Purpose: Cross-cutting concerns
- Contains: Validation, logging, metrics, rate limiting
- Location: `src/utils.js`
- Depends on: None
- Used by: All layers

## Data Flow

**CLI Command Execution:**

1. User runs: `reddit-parser -s webdev --analyze`
2. Commander parses args and flags
3. Command handler validates input (`validateSubreddit()`)
4. Config loaded and merged (`loadConfig()`)
5. Fetcher retrieves Reddit data (`fetchSubredditWithComments()`)
6. Parser extracts posts and comments (`parsePost()`, `parseComments()`)
7. Optional: Analyzer sends to LLM (`runAnalysis()`)
8. Formatter generates output (`formatAnalysisMarkdown()`)
9. Output written to file or stdout
10. Process exits with status code

**State Management:**

- Stateless - each execution is independent
- No persistent in-memory state
- Configuration loaded fresh each run

## Key Abstractions

**LLMAnalyzer:**

- Purpose: Encapsulate LLM provider interactions
- Location: `src/analyzer.js`
- Pattern: Provider pattern with pluggable backends (Claude, OpenAI, Ollama)

**MetricsCollector:**

- Purpose: Track request metrics and timing
- Location: `src/utils.js`
- Pattern: Collector with summary computation

**RateLimiter:**

- Purpose: Control request frequency
- Location: `src/utils.js`
- Pattern: Token bucket with configurable delay

## Entry Points

**CLI Entry:**

- Location: `reddit-parser.js`
- Triggers: User runs `node reddit-parser.js <command>`
- Responsibilities: Register commands, parse args, orchestrate execution

**Subcommands:**

- `gaps` - Generate market gaps from pain points
- `landing` - Generate landing page prompt
- `marketing` - Generate Reddit marketing strategy

## Error Handling

**Strategy:** Throw errors, catch at command level, log and exit

**Patterns:**

- Input validation at boundaries (CLI entry)
- Services throw Error with descriptive messages
- Command handlers catch, log to stderr, exit(1)
- Retry logic with exponential backoff for network errors

## Cross-Cutting Concerns

**Logging:**

- Custom logger with levels (ERROR, WARN, INFO, DEBUG)
- Console output with optional verbosity
- Location: `src/utils.js`

**Validation:**

- Regex-based validators for URLs, subreddits, API keys
- Fail fast on invalid input
- Location: `src/utils.js`

**Metrics:**

- Request tracking (success/failure counts)
- Timing measurements (API, LLM)
- Error recording with context

---

_Architecture analysis: 2026-01-17_
_Update when major patterns change_
