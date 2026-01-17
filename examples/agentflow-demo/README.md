# AgentFlow Demo - Reddit Parser Workflow Example

Complete example of the reddit-parser workflow from raw data to marketing plan.

## Source Data

- **Subreddit:** r/webdev
- **Posts:** 5 threads
- **Comments:** 291 total
- **Date:** 2026-01-17

## Workflow Output

| Step | File               | Description                                |
| ---- | ------------------ | ------------------------------------------ |
| 1    | `1-raw-data.md`    | Raw Reddit threads and comments            |
| 2    | `2-pain-points.md` | Identified user pain points                |
| 3    | `3-gaps.md`        | Market gap analysis with solution concepts |
| 4    | `4-landing.md`     | Landing page prompt (BAB framework)        |
| 5    | `5-marketing.md`   | 4-week Reddit marketing plan               |

## Product Concept Generated

**AgentFlow** - AI Agent Orchestration Learning Platform

A platform for developers to learn and practice orchestrating AI coding agents, targeting junior developers anxious about AI disruption.

## Key Pain Points Identified

1. Fear of AI replacement among junior developers
2. Reduced junior hiring due to AI perception
3. Lack of clear guidance on "AI-proofing" careers
4. Legacy code management challenges
5. Toxic startup culture (underreported)

## Commands Used

```bash
# Step 1: Parse subreddit
node reddit-parser.js -s webdev --top 5 --md -o output/1-raw-data.md

# Steps 2-5: Generated via Claude Code (API unreachable)
# Normally would use:
# node reddit-parser.js gaps -i output/1-raw-data.md -o output/2-gaps.md
# node reddit-parser.js landing -i output/2-gaps.md -o output/3-landing.md
# node reddit-parser.js marketing -i output/2-gaps.md --product "AgentFlow" -o output/4-marketing.md
```
