/**
 * Basic tests for reddit-parser
 * Run: npm test
 */

const {
  validateRedditUrl,
  validateSubreddit,
  sanitizeForLog,
  createTimer,
} = require("../src/utils");
const {
  parseComments,
  flattenComments,
  decodeHtmlEntities,
} = require("../src/parser");
const { loadPrompts } = require("../src/config");
const fs = require("fs");
const path = require("path");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${err.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || "Assertion failed");
}

console.log("\n=== Reddit Parser Tests ===\n");

// Security Tests
console.log("Security (4-secure):");
test("validates correct Reddit URL", () => {
  assert(validateRedditUrl("https://reddit.com/r/webdev/comments/abc123/"));
  assert(
    validateRedditUrl("https://www.reddit.com/r/programming/comments/xyz/"),
  );
  assert(
    validateRedditUrl("https://old.reddit.com/r/javascript/comments/123/"),
  );
});

test("rejects invalid URLs", () => {
  assert(!validateRedditUrl("https://example.com"));
  assert(!validateRedditUrl("not-a-url"));
  assert(!validateRedditUrl("https://reddit.com/u/username"));
});

test("validates subreddit names", () => {
  assert(validateSubreddit("webdev"));
  assert(validateSubreddit("programming123"));
  assert(validateSubreddit("my_subreddit"));
});

test("rejects invalid subreddit names", () => {
  assert(!validateSubreddit("invalid-name"));
  assert(!validateSubreddit("spaces here"));
  assert(!validateSubreddit("a".repeat(100))); // too long
});

test("sanitizes log output", () => {
  const result = sanitizeForLog("test\nwith\nnewlines");
  assert(!result.includes("\n"));
});

// Parser Tests
console.log("\nParser (6-test):");
test("decodes HTML entities", () => {
  assert(decodeHtmlEntities("&amp;") === "&");
  assert(decodeHtmlEntities("&lt;script&gt;") === "<script>");
  assert(decodeHtmlEntities("&quot;hello&quot;") === '"hello"');
});

test("handles empty input", () => {
  assert(decodeHtmlEntities("") === "");
  assert(decodeHtmlEntities(null) === "");
});

test("flattens nested comments", () => {
  const nested = [
    { author: "user1", replies: [{ author: "user2", replies: [] }] },
  ];
  const flat = flattenComments(nested);
  assert(flat.length === 2);
});

// Config Tests
console.log("\nConfig (5-optimize):");
test("loads single-prompt file as one prompt", () => {
  const testFile = path.join(__dirname, "test-prompt.txt");
  fs.writeFileSync(testFile, "# Comment\nThis is a multi-line\nprompt text");
  const prompts = loadPrompts(testFile);
  assert(prompts.length === 1);
  fs.unlinkSync(testFile);
});

test("loads multi-prompt file with --- delimiter", () => {
  const testFile = path.join(__dirname, "test-prompts.txt");
  fs.writeFileSync(testFile, "Prompt one\n---\nPrompt two\n---\nPrompt three");
  const prompts = loadPrompts(testFile);
  assert(prompts.length === 3);
  fs.unlinkSync(testFile);
});

// Performance Tests
console.log("\nPerformance (5-optimize):");
test("timer tracks elapsed time", () => {
  const timer = createTimer();
  const elapsed = timer.elapsed();
  assert(elapsed >= 0 && elapsed < 100);
});

// Summary
console.log("\n" + "=".repeat(30));
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log("=".repeat(30) + "\n");

process.exit(failed > 0 ? 1 : 0);
