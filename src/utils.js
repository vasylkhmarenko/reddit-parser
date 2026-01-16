/**
 * Utility functions - Security, Validation, Logging, Monitoring
 */

// Validate Reddit URL format (Security)
function validateRedditUrl(url) {
  if (!url || typeof url !== "string") return false;
  const redditPattern =
    /^https?:\/\/(www\.)?(old\.)?reddit\.com\/r\/[\w]+\/(comments\/[\w]+\/?)?/i;
  return redditPattern.test(url);
}

// Validate subreddit name (Security - prevent injection)
function validateSubreddit(name) {
  if (!name || typeof name !== "string") return false;
  const subredditPattern = /^[\w]+$/;
  return subredditPattern.test(name) && name.length >= 2 && name.length <= 50;
}

// Validate API key format (Security)
function validateApiKey(key, provider) {
  if (!key || typeof key !== "string") return false;
  switch (provider) {
    case "claude":
      return key.startsWith("sk-ant-");
    case "openai":
      return key.startsWith("sk-");
    default:
      return key.length > 0;
  }
}

// Sanitize user input for logging (Security - no sensitive data in logs)
function sanitizeForLog(text, maxLength = 100) {
  if (!text) return "[empty]";
  return text.slice(0, maxLength).replace(/[\n\r]/g, " ");
}

// Logger with levels (Monitor)
const LOG_LEVELS = { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 };
let currentLogLevel = LOG_LEVELS.INFO;

function setLogLevel(level) {
  currentLogLevel = LOG_LEVELS[level.toUpperCase()] ?? LOG_LEVELS.INFO;
}

function log(level, message, context = {}) {
  if (LOG_LEVELS[level] > currentLogLevel) return;

  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level}]`;

  if (level === "ERROR") {
    console.error(`${prefix} ${message}`, context);
  } else {
    console.error(`${prefix} ${message}`);
  }
}

// Performance timer (Optimize)
function createTimer() {
  const start = Date.now();
  return {
    elapsed: () => Date.now() - start,
    log: (action) => {
      const ms = Date.now() - start;
      if (ms > 1000) {
        log("WARN", `Slow operation: ${action} took ${ms}ms`);
      }
    },
  };
}

// Rate limiter with exponential backoff (Security)
class RateLimiter {
  constructor(delayMs = 1000, maxRetries = 3) {
    this.delayMs = delayMs;
    this.maxRetries = maxRetries;
    this.lastRequest = 0;
  }

  async wait() {
    const now = Date.now();
    const timeSinceLast = now - this.lastRequest;
    if (timeSinceLast < this.delayMs) {
      await new Promise((r) => setTimeout(r, this.delayMs - timeSinceLast));
    }
    this.lastRequest = Date.now();
  }

  getBackoffDelay(attempt) {
    return Math.min(this.delayMs * Math.pow(2, attempt), 30000);
  }
}

// Metrics collector (Monitor)
class MetricsCollector {
  constructor() {
    this.metrics = {
      requests: { total: 0, success: 0, failed: 0 },
      timing: { api: [], llm: [] },
      errors: [],
    };
  }

  recordRequest(success) {
    this.metrics.requests.total++;
    if (success) {
      this.metrics.requests.success++;
    } else {
      this.metrics.requests.failed++;
    }
  }

  recordTiming(category, ms) {
    this.metrics.timing[category] = this.metrics.timing[category] || [];
    this.metrics.timing[category].push(ms);
  }

  recordError(error, context = {}) {
    this.metrics.errors.push({
      message: error.message || error,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  getSummary() {
    const apiTimings = this.metrics.timing.api;
    const llmTimings = this.metrics.timing.llm;
    return {
      requests: this.metrics.requests,
      avgApiTime: apiTimings.length
        ? Math.round(apiTimings.reduce((a, b) => a + b, 0) / apiTimings.length)
        : 0,
      avgLlmTime: llmTimings.length
        ? Math.round(llmTimings.reduce((a, b) => a + b, 0) / llmTimings.length)
        : 0,
      errorCount: this.metrics.errors.length,
    };
  }

  logSummary() {
    const summary = this.getSummary();
    log(
      "INFO",
      `Requests: ${summary.requests.total} (${summary.requests.success} ok, ${summary.requests.failed} failed)`,
    );
    if (summary.avgApiTime > 0) {
      log("INFO", `Avg API time: ${summary.avgApiTime}ms`);
    }
    if (summary.avgLlmTime > 0) {
      log("INFO", `Avg LLM time: ${summary.avgLlmTime}ms`);
    }
  }
}

// Global metrics instance
const metrics = new MetricsCollector();

// Redact sensitive data from logs (Security)
function redactSensitive(text) {
  if (!text || typeof text !== "string") return text;
  return text
    .replace(/sk-ant-[a-zA-Z0-9_-]+/g, "[REDACTED_CLAUDE_KEY]")
    .replace(/sk-[a-zA-Z0-9_-]+/g, "[REDACTED_OPENAI_KEY]")
    .replace(/Bearer\s+[a-zA-Z0-9_-]+/g, "Bearer [REDACTED]");
}

module.exports = {
  validateRedditUrl,
  validateSubreddit,
  validateApiKey,
  sanitizeForLog,
  redactSensitive,
  log,
  setLogLevel,
  createTimer,
  RateLimiter,
  MetricsCollector,
  metrics,
  LOG_LEVELS,
};
