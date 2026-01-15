# Reddit Parser

Fast and simple Reddit thread and comment parser. No API keys required.

## Installation

```bash
git clone https://github.com/vasylkhmarenko/reddit-parser.git
cd reddit-parser
```

## Usage

```bash
# Single thread (JSON output)
node reddit-parser.js "https://reddit.com/r/webdev/comments/abc123/"

# Single thread (Markdown output)
node reddit-parser.js "https://reddit.com/r/webdev/comments/abc123/" --md

# Save to file
node reddit-parser.js "https://reddit.com/r/webdev/comments/abc123/" --md -o thread.md

# Multiple threads to one file
node reddit-parser.js \
  "https://reddit.com/r/programming/comments/abc/" \
  "https://reddit.com/r/webdev/comments/xyz/" \
  "https://reddit.com/r/javascript/comments/123/" \
  --md -o combined.md
```

## Options

| Option                | Description        |
| --------------------- | ------------------ |
| `--md`, `-m`          | Output as Markdown |
| `--output`, `-o FILE` | Save to file       |

## Output

### JSON (default)

```json
{
  "thread_count": 1,
  "total_comments": 45,
  "threads": [
    {
      "post": {
        "title": "Post title",
        "author": "username",
        "subreddit": "webdev",
        "score": 142,
        "selftext": "Post body..."
      },
      "comments": [
        {
          "author": "commenter",
          "body": "Comment text",
          "score": 25,
          "depth": 0
        }
      ]
    }
  ]
}
```

### Markdown

```markdown
# Post Title

**r/subreddit** • Posted by u/author • 142 points

Post body text...

---

## Comments (45)

**u/commenter1** (25 pts)

Top level comment...

↳ **u/commenter2** (10 pts)

Reply with indentation...
```

For multiple threads, includes table of contents and thread separators.

## How It Works

Uses Reddit's built-in JSON endpoint (append `.json` to any Reddit URL). No authentication required for public posts.

## License

MIT
