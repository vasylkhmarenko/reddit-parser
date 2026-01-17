# Codebase Structure

**Analysis Date:** 2026-01-17

## Directory Layout

```
reddit-parser/
├── reddit-parser.js          # Main CLI entry point (executable)
├── package.json              # Project metadata, scripts, dependencies
├── package-lock.json         # Dependency lockfile
├── eslint.config.mjs         # ESLint configuration
├── README.md                 # User documentation
├── prompts.txt               # Default analysis prompts
├── reddit-parser.config.json # Example configuration
├── .env.example              # Environment variable template
├── .gitignore                # Git ignore patterns
│
├── src/                      # Application source code
│   ├── analyzer.js           # LLM analysis service (Claude/OpenAI/Ollama)
│   ├── config.js             # Configuration loading and management
│   ├── fetcher.js            # Reddit API fetching with retry/rate-limit
│   ├── formatter.js          # Output formatting (MD, JSON)
│   ├── parser.js             # Reddit data extraction and parsing
│   └── utils.js              # Security, logging, monitoring, validation
│
├── test/                     # Test suite
│   └── test.js               # Unit tests (custom runner)
│
├── prompts/                  # Prompt templates for workflow commands
│   ├── landing-page.txt      # Template: market gaps → landing page prompt
│   ├── market-gaps.txt       # Template: pain points → market gaps
│   └── reddit-marketing.txt  # Template: market gaps → Reddit strategy
│
├── output/                   # Generated output files (gitignored)
│   └── *.md                  # Analysis reports
│
└── .planning/                # Project planning documents
    └── codebase/             # Codebase analysis (this directory)
```

## Directory Purposes

**src/**

- Purpose: Core application logic
- Contains: 6 JavaScript modules
- Key files: `fetcher.js` (Reddit API), `analyzer.js` (LLM), `utils.js` (utilities)
- Subdirectories: None (flat structure)

**test/**

- Purpose: Unit test suite
- Contains: `test.js` - 19 tests covering security, parsing, config, monitoring
- Key files: Single test file with custom assertions
- Subdirectories: None

**prompts/**

- Purpose: LLM prompt templates for workflow commands
- Contains: Plain text files with system prompts
- Key files: `market-gaps.txt`, `landing-page.txt`, `reddit-marketing.txt`
- Subdirectories: None

**output/**

- Purpose: Generated analysis reports
- Contains: Markdown files from CLI runs
- Key files: Research output, market analysis, landing prompts
- Subdirectories: None

## Key File Locations

**Entry Points:**

- `reddit-parser.js` - Main CLI entry (shebang: `#!/usr/bin/env node`)

**Configuration:**

- `reddit-parser.config.json` - Default configuration
- `.env.example` - Environment variable template
- `eslint.config.mjs` - Linting configuration

**Core Logic:**

- `src/fetcher.js` - Reddit API calls with retry logic
- `src/analyzer.js` - LLM provider integrations
- `src/parser.js` - Reddit data parsing
- `src/formatter.js` - Output formatting
- `src/config.js` - Configuration management
- `src/utils.js` - Validation, logging, metrics

**Testing:**

- `test/test.js` - All unit tests

**Documentation:**

- `README.md` - User-facing documentation

## Naming Conventions

**Files:**

- kebab-case for all files: `reddit-parser.js`, `market-gaps.txt`
- Descriptive module names: `fetcher.js`, `parser.js`, `formatter.js`
- Config uses dot notation: `reddit-parser.config.json`

**Directories:**

- lowercase: `src/`, `test/`, `prompts/`, `output/`
- Plural for collections: `prompts/`

**Special Patterns:**

- `.example` suffix for templates: `.env.example`
- `.mjs` for ESM config: `eslint.config.mjs`

## Where to Add New Code

**New Feature:**

- Primary code: `src/{feature-name}.js`
- Tests: Add to `test/test.js`
- Config if needed: Update `reddit-parser.config.json`

**New CLI Command:**

- Definition: Add to `reddit-parser.js` using Commander
- Handler: Inline in main file or extract to `src/`
- Prompts if needed: `prompts/{command-name}.txt`

**New Utility:**

- Implementation: Add to `src/utils.js`
- Tests: Add to `test/test.js`

**New LLM Provider:**

- Implementation: Add method to `LLMAnalyzer` class in `src/analyzer.js`
- Config: Add provider config to `src/config.js`

## Special Directories

**output/**

- Purpose: Generated artifacts from CLI runs
- Source: Created by `-o` flag
- Committed: No (gitignored)

**node_modules/**

- Purpose: npm dependencies
- Source: `npm install`
- Committed: No (gitignored)

**.planning/**

- Purpose: Project planning and documentation
- Source: Manual creation
- Committed: Yes

---

_Structure analysis: 2026-01-17_
_Update when directory structure changes_
