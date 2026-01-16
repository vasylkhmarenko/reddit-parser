# Reddit Parser MVP Specification

## Introduction

### Background

CLI tool for parsing Reddit threads/subreddits and analyzing content with AI. Designed for market researchers, content analysts, and developers who need to extract and process Reddit data.

### In Scope

- Parse individual Reddit thread URLs (max 50)
- Scrape subreddit posts with comments (top/hot/new/rising, configurable time period)
- Analyze content with custom prompts via multiple LLM providers
- Output as JSON or Markdown
- Save results to file

### Out of Scope

- GUI/web interface
- User authentication with Reddit
- Real-time monitoring
- Database storage
- Comment posting/interaction

## User Roles

| Role     | Description                                    |
| -------- | ---------------------------------------------- |
| CLI User | Runs commands to fetch and analyze Reddit data |

## Core Features

### 1. Thread Parsing

Users provide Reddit thread URLs to extract post content and all comments.

- Input: 1-50 Reddit thread URLs
- Output: Post title, body, author, score, comments (nested)
- Validation: Only accepts valid reddit.com URLs

### 2. Subreddit Scraping

Users specify a subreddit to fetch multiple posts with comments.

- Flags: `--top N`, `--sort (hot|new|top|rising)`, `--since (hour|day|week|month|year|all)`
- Limit: Maximum 50 posts
- Rate limiting: 1-second delay between requests

### 3. AI Analysis

Users provide custom prompts to analyze fetched content.

- Prompt source: File (prompts.txt or custom path)
- Multiple prompts: Separated by `---` delimiter
- Providers: Claude, OpenAI, Ollama
- Output: Analysis results per prompt

### 4. Output Formats

- JSON: Structured data for programmatic use
- Markdown: Human-readable reports with analysis
- File: Optional `-o filename` to save output

## CLI Interface

```
reddit-parser [urls...] [options]

Options:
  -s, --subreddit <name>   Subreddit to scrape
  --top <n>                Number of posts (max 50)
  --since <period>         Time period: hour, day, week, month, year, all
  --sort <type>            Sort: hot, new, top, rising
  -m, --md                 Output as markdown
  -o, --output <file>      Save to file
  --analyze                Enable AI analysis
  --prompts <file>         Path to prompts file
  --provider <name>        LLM: claude, openai, ollama
  --model <name>           Model override
  --config <file>          Config file path
```

## Happy Path

1. User runs: `reddit-parser -s webdev --top 5 --analyze -o report.md`
2. Tool fetches 5 posts from r/webdev with comments
3. Tool loads prompts from prompts.txt
4. Tool analyzes content with configured LLM
5. Tool outputs markdown report to report.md

## Edge Cases

| Scenario                | Response                                       |
| ----------------------- | ---------------------------------------------- |
| Invalid Reddit URL      | Error message with expected format             |
| Subreddit doesn't exist | HTTP 404 error with clear message              |
| API rate limited        | Retry with exponential backoff (max 3 retries) |
| LLM API key missing     | Error: "Set [PROVIDER]\_API_KEY in .env"       |
| No prompts file         | Error with path to expected file               |
| >50 URLs provided       | Error: "Maximum 50 URLs allowed"               |

## Configuration

### Environment Variables (.env)

```
CLAUDE_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
OLLAMA_HOST=http://localhost:11434
```

### Config File (reddit-parser.config.json)

```json
{
  "defaults": { "top": 10, "sort": "hot", "since": "day" },
  "reddit": { "request_delay_ms": 1000 },
  "llm": {
    "default_provider": "claude",
    "claude_model": "claude-sonnet-4-20250514"
  }
}
```

## Technical Stack

- Runtime: Node.js 18+
- Dependencies: commander (CLI), dotenv (env vars)
- APIs: Reddit JSON API (.json suffix), Claude/OpenAI/Ollama APIs
- No database required

## Success Criteria

- Fetches Reddit data reliably with rate limiting
- Supports all 3 LLM providers
- Validates all user input
- Produces clean markdown reports
- All tests pass (`npm test`)
