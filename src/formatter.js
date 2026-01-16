/**
 * Output formatting utilities
 */

const { decodeHtmlEntities } = require("./parser");

function formatThreadMarkdown(post, comments, index, total) {
  const lines = [];

  // Thread separator for multiple threads
  if (total > 1) {
    lines.push(`${"=".repeat(80)}`);
    lines.push(`THREAD ${index + 1} OF ${total}`);
    lines.push(`${"=".repeat(80)}`);
    lines.push("");
  }

  // Header
  lines.push(`# ${decodeHtmlEntities(post.title)}`);
  lines.push("");
  lines.push(
    `**r/${post.subreddit}** • Posted by u/${post.author} • ${post.score} points`,
  );
  lines.push(
    `**URL:** https://reddit.com/r/${post.subreddit}/comments/${post.id}/`,
  );
  lines.push("");

  // Post body
  if (post.selftext) {
    lines.push(decodeHtmlEntities(post.selftext));
    lines.push("");
  }

  // Link post
  if (post.url && !post.url.includes("reddit.com")) {
    lines.push(`**Link:** ${post.url}`);
    lines.push("");
  }

  lines.push("---");
  lines.push("");
  lines.push(`## Comments (${comments.length})`);
  lines.push("");

  // Comments
  for (const comment of comments) {
    const indent = "  ".repeat(comment.depth);
    const prefix = comment.depth > 0 ? "↳ " : "";

    lines.push(
      `${indent}${prefix}**u/${comment.author}** (${comment.score} pts)`,
    );
    lines.push("");

    // Indent comment body
    const bodyLines = decodeHtmlEntities(comment.body).split("\n");
    for (const line of bodyLines) {
      lines.push(`${indent}${line}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function formatCollectionMarkdown(results) {
  const parts = results.map((r, i) =>
    formatThreadMarkdown(r.post, r.comments, i, results.length),
  );
  let output = parts.join("\n\n");

  // Add summary at top if multiple threads
  if (results.length > 1) {
    const summary = [
      "# Reddit Threads Collection",
      "",
      `**Total threads:** ${results.length}`,
      `**Total comments:** ${results.reduce((sum, r) => sum + r.comments.length, 0)}`,
      `**Generated:** ${new Date().toISOString()}`,
      "",
      "## Contents",
      "",
      ...results.map(
        (r, i) =>
          `${i + 1}. [${r.post.title}](#thread-${i + 1}-of-${results.length})`,
      ),
      "",
      "",
    ].join("\n");
    output = summary + output;
  }

  return output;
}

function formatAnalysisMarkdown(results, analysisResults, options = {}) {
  const lines = [];
  const totalComments = results.reduce((sum, r) => sum + r.comments.length, 0);

  // Header
  lines.push("# Reddit Analysis Report");
  lines.push("");

  if (options.subreddit) {
    lines.push(`**Subreddit:** r/${options.subreddit}`);
  }
  lines.push(`**Posts analyzed:** ${results.length}`);
  lines.push(`**Total comments:** ${totalComments}`);
  lines.push(`**Generated:** ${new Date().toISOString()}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // AI Analysis section
  if (analysisResults && analysisResults.length > 0) {
    lines.push("## AI Analysis");
    lines.push("");

    for (const analysis of analysisResults) {
      lines.push(`### ${analysis.prompt}`);
      lines.push("");
      lines.push(analysis.response);
      lines.push("");
    }

    lines.push("---");
    lines.push("");
  }

  // Raw data section
  lines.push("## Raw Data");
  lines.push("");
  lines.push(formatCollectionMarkdown(results));

  return lines.join("\n");
}

function formatJSON(results, errors = []) {
  return JSON.stringify(
    {
      thread_count: results.length,
      total_comments: results.reduce((sum, r) => sum + r.comments.length, 0),
      threads: results.map((r) => ({
        post: r.post,
        comments: r.comments,
        comment_count: r.comments.length,
      })),
      errors: errors.length > 0 ? errors : undefined,
    },
    null,
    2,
  );
}

module.exports = {
  formatThreadMarkdown,
  formatCollectionMarkdown,
  formatAnalysisMarkdown,
  formatJSON,
};
