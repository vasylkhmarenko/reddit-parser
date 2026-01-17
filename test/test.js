/**
 * Basic tests for reddit-parser
 * Run: npm test
 */

const {
  validateRedditUrl,
  validateSubreddit,
  validateApiKey,
  sanitizeForLog,
  redactSensitive,
  createTimer,
  MetricsCollector,
} = require("../src/utils");
const { flattenComments, decodeHtmlEntities } = require("../src/parser");
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

// Additional Security Tests (4-secure)
console.log("\nAdditional Security:");
test("validates API key format for Claude", () => {
  assert(validateApiKey("sk-ant-abc123", "claude"));
  assert(!validateApiKey("invalid-key", "claude"));
  assert(!validateApiKey("", "claude"));
  assert(!validateApiKey(null, "claude"));
});

test("validates API key format for OpenAI", () => {
  assert(validateApiKey("sk-abc123", "openai"));
  assert(!validateApiKey("invalid", "openai"));
});

test("redacts sensitive data from text", () => {
  const text = "Key: sk-ant-api03-abc123 and sk-openai-xyz";
  const redacted = redactSensitive(text);
  assert(!redacted.includes("sk-ant-"));
  assert(!redacted.includes("sk-openai"));
  assert(redacted.includes("[REDACTED"));
});

test("validates subreddit length limits", () => {
  assert(!validateSubreddit("a")); // too short
  assert(validateSubreddit("ab")); // minimum length
  assert(validateSubreddit("a".repeat(50))); // max length
  assert(!validateSubreddit("a".repeat(51))); // too long
});

test("handles null/undefined in validators", () => {
  assert(!validateRedditUrl(null));
  assert(!validateRedditUrl(undefined));
  assert(!validateSubreddit(null));
  assert(!validateSubreddit(undefined));
});

// Monitor Tests (8-monitor)
console.log("\nMonitor (8-monitor):");
test("MetricsCollector tracks requests", () => {
  const collector = new MetricsCollector();
  collector.recordRequest(true);
  collector.recordRequest(true);
  collector.recordRequest(false);
  const summary = collector.getSummary();
  assert(summary.requests.total === 3);
  assert(summary.requests.success === 2);
  assert(summary.requests.failed === 1);
});

test("MetricsCollector tracks timing", () => {
  const collector = new MetricsCollector();
  collector.recordTiming("api", 100);
  collector.recordTiming("api", 200);
  const summary = collector.getSummary();
  assert(summary.avgApiTime === 150);
});

test("MetricsCollector records errors", () => {
  const collector = new MetricsCollector();
  collector.recordError(new Error("Test error"), { context: "test" });
  assert(collector.getSummary().errorCount === 1);
});

// Summary
console.log("\n" + "=".repeat(30));
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log("=".repeat(30) + "\n");

process.exit(failed > 0 ? 1 : 0);
