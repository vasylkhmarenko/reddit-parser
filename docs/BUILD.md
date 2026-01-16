# Build & Development Workflow

## Prerequisites

- Node.js 18+
- npm

## Setup

```bash
# Clone and install
git clone <repo-url>
cd reddit-parser
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys
```

## Development

### Run Tests

```bash
npm test
```

### Test Fetch (without AI)

```bash
npm run test:fetch
# Fetches 2 posts from r/javascript with markdown output
```

### Test with Analysis

```bash
node reddit-parser.js -s webdev --top 2 --analyze -o test-output.md
```

## CLI Usage

### Parse Thread URLs

```bash
node reddit-parser.js https://reddit.com/r/webdev/comments/abc123
```

### Scrape Subreddit

```bash
node reddit-parser.js -s javascript --top 10 --sort hot --since week
```

### With AI Analysis

```bash
node reddit-parser.js -s webdev --top 5 --analyze --prompts ./research.txt -o report.md
```

## File Structure

```
reddit-parser/
├── reddit-parser.js    # CLI entry point
├── src/
│   ├── analyzer.js     # LLM integration
│   ├── config.js       # Config loading
│   ├── fetcher.js      # Reddit API
│   ├── formatter.js    # Output formatting
│   ├── parser.js       # Comment parsing
│   └── utils.js        # Utilities
├── test/
│   └── test.js         # Test suite
├── docs/
│   └── specs/          # Project specifications
├── .env                # API keys (gitignored)
├── .env.example        # Template
├── prompts.txt         # Default prompts
└── reddit-parser.config.json  # Config
```

## Configuration

### Environment Variables

| Variable       | Description       |
| -------------- | ----------------- |
| CLAUDE_API_KEY | Anthropic API key |
| OPENAI_API_KEY | OpenAI API key    |
| OLLAMA_HOST    | Ollama server URL |

### Config File Options

Edit `reddit-parser.config.json`:

- `defaults.top` - Default number of posts
- `defaults.sort` - Default sort order
- `defaults.since` - Default time period
- `reddit.request_delay_ms` - Delay between requests
- `llm.default_provider` - Default LLM provider

## Adding Custom Prompts

1. Create a text file with your prompts
2. Separate multiple prompts with `---`
3. Use `--prompts ./your-file.txt`

Example:

```
Summarize the main topics discussed.
---
What are the most common complaints?
---
List any product recommendations mentioned.
```

## Deployment

### Global Install

```bash
npm install -g .
reddit-parser --help
```

### NPM Publish

```bash
npm publish
```

## Iteration Workflow

1. Make changes
2. Run tests: `npm test`
3. Test manually with sample data
4. Commit when working
