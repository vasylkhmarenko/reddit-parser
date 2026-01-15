#!/usr/bin/env node

const fs = require('fs');

// Parse arguments
const args = process.argv.slice(2);
const flags = {
  md: args.includes('--md') || args.includes('-m'),
  output: null
};

// Get output file if specified
const outputIdx = args.findIndex(a => a === '--output' || a === '-o');
if (outputIdx !== -1 && args[outputIdx + 1]) {
  flags.output = args[outputIdx + 1];
}

// Get all URLs (any arg containing reddit.com)
const urls = args.filter(a => a.includes('reddit.com'));

if (urls.length === 0) {
  console.log('Usage: node reddit-parser.js <reddit-url> [more-urls...] [options]');
  console.log('');
  console.log('Options:');
  console.log('  --md, -m           Output as markdown');
  console.log('  --output, -o FILE  Save to file');
  console.log('');
  console.log('Examples:');
  console.log('  # Single thread');
  console.log('  node reddit-parser.js https://reddit.com/r/webdev/comments/abc123/');
  console.log('');
  console.log('  # Multiple threads to one file');
  console.log('  node reddit-parser.js URL1 URL2 URL3 --md -o combined.md');
  console.log('');
  console.log('  # Paste multiple URLs');
  console.log('  node reddit-parser.js \\');
  console.log('    "https://reddit.com/r/programming/comments/abc/" \\');
  console.log('    "https://reddit.com/r/webdev/comments/xyz/" \\');
  console.log('    --md -o threads.md');
  process.exit(1);
}

async function fetchRedditThread(redditUrl) {
  const jsonUrl = redditUrl.replace(/\/?(\?.*)?$/, '.json');

  const res = await fetch(jsonUrl, {
    headers: { 'User-Agent': 'RedditParser/1.0' }
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

function parseComments(children, depth = 0) {
  const comments = [];

  for (const child of children) {
    if (child.kind !== 't1') continue;

    const data = child.data;
    const comment = {
      author: data.author,
      body: data.body,
      score: data.score,
      created: new Date(data.created_utc * 1000).toISOString(),
      depth,
      replies: []
    };

    if (data.replies && data.replies.data?.children) {
      comment.replies = parseComments(data.replies.data.children, depth + 1);
    }

    comments.push(comment);
  }

  return comments;
}

function flattenComments(comments, flat = []) {
  for (const c of comments) {
    const { replies, ...comment } = c;
    flat.push(comment);
    if (replies.length) flattenComments(replies, flat);
  }
  return flat;
}

function decodeHtmlEntities(text) {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function formatMarkdown(post, comments, index, total) {
  const lines = [];

  // Thread separator for multiple threads
  if (total > 1) {
    lines.push(`${'='.repeat(80)}`);
    lines.push(`THREAD ${index + 1} OF ${total}`);
    lines.push(`${'='.repeat(80)}`);
    lines.push('');
  }

  // Header
  lines.push(`# ${decodeHtmlEntities(post.title)}`);
  lines.push('');
  lines.push(`**r/${post.subreddit}** • Posted by u/${post.author} • ${post.score} points`);
  lines.push(`**URL:** https://reddit.com/r/${post.subreddit}/comments/${post.id}/`);
  lines.push('');

  // Post body
  if (post.selftext) {
    lines.push(decodeHtmlEntities(post.selftext));
    lines.push('');
  }

  // Link post
  if (post.url && !post.url.includes('reddit.com')) {
    lines.push(`**Link:** ${post.url}`);
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push(`## Comments (${comments.length})`);
  lines.push('');

  // Comments
  for (const comment of comments) {
    const indent = '  '.repeat(comment.depth);
    const prefix = comment.depth > 0 ? '↳ ' : '';

    lines.push(`${indent}${prefix}**u/${comment.author}** (${comment.score} pts)`);
    lines.push('');

    // Indent comment body
    const bodyLines = decodeHtmlEntities(comment.body).split('\n');
    for (const line of bodyLines) {
      lines.push(`${indent}${line}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

async function processUrl(url) {
  const data = await fetchRedditThread(url);

  const postData = data[0].data.children[0].data;
  const commentsData = data[1].data.children;

  const post = {
    id: postData.id,
    title: postData.title,
    author: postData.author,
    subreddit: postData.subreddit,
    score: postData.score,
    url: postData.url,
    selftext: postData.selftext,
    created: new Date(postData.created_utc * 1000).toISOString(),
    num_comments: postData.num_comments
  };

  const comments = parseComments(commentsData);
  const flatComments = flattenComments(comments);

  return { post, comments: flatComments };
}

async function main() {
  const results = [];
  const errors = [];

  console.error(`Processing ${urls.length} URL(s)...\n`);

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.error(`[${i + 1}/${urls.length}] Fetching: ${url}`);

    try {
      const result = await processUrl(url);
      results.push(result);
      console.error(`    ✓ ${result.post.title.slice(0, 50)}... (${result.comments.length} comments)`);
    } catch (err) {
      console.error(`    ✗ Error: ${err.message}`);
      errors.push({ url, error: err.message });
    }

    // Small delay between requests to be nice to Reddit
    if (i < urls.length - 1) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  console.error('');

  if (results.length === 0) {
    console.error('No threads fetched successfully.');
    process.exit(1);
  }

  let output;

  if (flags.md) {
    // Combine all threads into one markdown
    const parts = results.map((r, i) => formatMarkdown(r.post, r.comments, i, results.length));
    output = parts.join('\n\n');

    // Add summary at top if multiple threads
    if (results.length > 1) {
      const summary = [
        '# Reddit Threads Collection',
        '',
        `**Total threads:** ${results.length}`,
        `**Total comments:** ${results.reduce((sum, r) => sum + r.comments.length, 0)}`,
        `**Generated:** ${new Date().toISOString()}`,
        '',
        '## Contents',
        '',
        ...results.map((r, i) => `${i + 1}. [${r.post.title}](#thread-${i + 1}-of-${results.length})`),
        '',
        ''
      ].join('\n');
      output = summary + output;
    }
  } else {
    // JSON output
    output = JSON.stringify({
      thread_count: results.length,
      total_comments: results.reduce((sum, r) => sum + r.comments.length, 0),
      threads: results.map(r => ({
        post: r.post,
        comments: r.comments,
        comment_count: r.comments.length
      })),
      errors: errors.length > 0 ? errors : undefined
    }, null, 2);
  }

  if (flags.output) {
    fs.writeFileSync(flags.output, output);
    console.error(`Saved to: ${flags.output}`);
    console.error(`  - ${results.length} threads`);
    console.error(`  - ${results.reduce((sum, r) => sum + r.comments.length, 0)} total comments`);
    if (errors.length > 0) {
      console.error(`  - ${errors.length} failed URLs`);
    }
  } else {
    console.log(output);
  }
}

main();
