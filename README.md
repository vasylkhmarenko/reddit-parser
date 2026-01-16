# Reddit Parser

Fast Reddit thread/subreddit parser with AI analysis. No API keys required for scraping.

## Features

- Parse individual Reddit threads
- Scrape entire subreddits (hot, new, top, rising)
- AI analysis with custom prompts (Claude, OpenAI, Ollama)
- Output as JSON or Markdown
- Configurable rate limiting

## Installation

```bash
git clone https://github.com/vasylkhmarenko/reddit-parser.git
cd reddit-parser
npm install
```

## Usage

### Basic Thread Parsing

```bash
# Single thread (JSON output)
node reddit-parser.js "https://reddit.com/r/webdev/comments/abc123/"

# Single thread (Markdown output)
node reddit-parser.js "https://reddit.com/r/webdev/comments/abc123/" --md

# Multiple threads
node reddit-parser.js URL1 URL2 URL3 --md -o threads.md
```

### Subreddit Scraping

```bash
# Fetch hot posts (default)
node reddit-parser.js -s webdev --top 20 --md -o webdev.md

# Fetch top posts from last week
node reddit-parser.js -s programming --top 50 --sort top --since week -o programming.md

# Fetch new posts
node reddit-parser.js -s javascript --top 10 --sort new --md
```

### AI Analysis

```bash
# Analyze with Claude (default)
export ANTHROPIC_API_KEY=sk-ant-...
node reddit-parser.js -s webdev --top 10 --analyze -o report.md

# Analyze with OpenAI
export OPENAI_API_KEY=sk-...
node reddit-parser.js -s webdev --top 10 --analyze --provider openai -o report.md

# Analyze with Ollama (local)
node reddit-parser.js -s webdev --top 5 --analyze --provider ollama --model llama3
```

## Options

| Option               | Short | Description                                    |
| -------------------- | ----- | ---------------------------------------------- |
| `--subreddit <name>` | `-s`  | Subreddit to scrape                            |
| `--top <n>`          |       | Number of posts to fetch (default: 25)         |
| `--since <period>`   |       | Time filter: hour, day, week, month, year, all |
| `--sort <type>`      |       | Sort: hot, new, top, rising (default: hot)     |
| `--md`               | `-m`  | Output as Markdown                             |
| `--output <file>`    | `-o`  | Save to file                                   |
| `--analyze`          |       | Enable AI analysis                             |
| `--prompts <file>`   |       | Prompts file (default: ./prompts.txt)          |
| `--provider <name>`  |       | LLM: claude, openai, ollama                    |
| `--model <name>`     |       | Model override                                 |
| `--config <file>`    |       | Config file path                               |

## Configuration

### Config File (reddit-parser.config.json)

```json
{
  "llm": {
    "default_provider": "claude",
    "providers": {
      "claude": { "model": "claude-sonnet-4-20250514", "max_tokens": 4096 },
      "openai": { "model": "gpt-4o", "max_tokens": 4096 },
      "ollama": { "model": "llama3", "base_url": "http://localhost:11434" }
    }
  },
  "reddit": {
    "request_delay_ms": 1000
  },
  "defaults": {
    "top": 25,
    "since": "day",
    "sort": "hot"
  }
}
```

### Environment Variables

- `ANTHROPIC_API_KEY` - Claude API key
- `OPENAI_API_KEY` - OpenAI API key
- `OLLAMA_BASE_URL` - Ollama server URL (default: http://localhost:11434)

## Prompts File

Create `prompts.txt` with one prompt per line:

```
# Lines starting with # are comments

Summarize the main topics discussed in these Reddit posts.

What are the most common complaints or pain points mentioned?

Identify any product recommendations made by commenters.
```

## Output Examples

### Analysis Report (Markdown)

```markdown
# Reddit Analysis Report

**Subreddit:** r/webdev
**Posts analyzed:** 10
**Total comments:** 523
**Generated:** 2026-01-16T10:00:00.000Z

---

## AI Analysis

### Summarize the main topics...

[AI response here]

### What are the most common complaints...

[AI response here]

---

## Raw Data

[Posts and comments in markdown format]
```

### JSON Output

```json
{
  "thread_count": 10,
  "total_comments": 523,
  "threads": [
    {
      "post": { "id": "...", "title": "...", "author": "...", "score": 142 },
      "comments": [...],
      "comment_count": 45
    }
  ]
}
```

## How It Works

Uses Reddit's built-in JSON endpoint (append `.json` to any Reddit URL). No authentication required for public posts.

## License

MIT
