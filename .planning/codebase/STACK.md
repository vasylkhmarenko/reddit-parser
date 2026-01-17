# Technology Stack

**Analysis Date:** 2026-01-17

## Languages

**Primary:**

- JavaScript (ES2022) - All application code

**Secondary:**

- JavaScript (ESM) - ESLint configuration (`eslint.config.mjs`)

## Runtime

**Environment:**

- Node.js >= 18.0.0 (LTS)
- No browser runtime (CLI tool only)

**Package Manager:**

- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**

- None (vanilla Node.js CLI)

**CLI:**

- Commander.js 12.x - CLI argument parsing and subcommand structure

**Testing:**

- Custom test runner (no external framework)
- Tests run via `node test/test.js`

**Build/Dev:**

- ESLint 9.x - Code linting
- @eslint/js 9.x - ESLint recommended rules
- dotenv 17.x - Environment variable loading

## Key Dependencies

**Critical:**

- `commander` ^12.0.0 - CLI framework for argument parsing - `reddit-parser.js`
- `dotenv` ^17.2.3 - Environment variable loading - `reddit-parser.js`

**Infrastructure:**

- Node.js built-ins - fs, path, fetch (Node 18+)
- Native fetch API - HTTP requests (no external HTTP library)

## Configuration

**Environment:**

- `.env` file for API keys (gitignored)
- `.env.example` template provided
- Key variables: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `OLLAMA_BASE_URL`, `REDDIT_PARSER_PROVIDER`

**Build:**

- `eslint.config.mjs` - Linting configuration
- No TypeScript, no build step required

**Application:**

- `reddit-parser.config.json` - Main configuration file
- Hierarchical config: file → environment variables → CLI flags

## Platform Requirements

**Development:**

- macOS/Linux/Windows (any platform with Node.js 18+)
- No external dependencies (Docker, databases)

**Production:**

- Runs locally as CLI tool
- No deployment infrastructure required
- Distributed as git repository

---

_Stack analysis: 2026-01-17_
_Update after major dependency changes_
