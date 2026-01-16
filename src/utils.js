/**
 * Utility functions - Security, Validation, Logging
 */

// Validate Reddit URL format (Security)
function validateRedditUrl(url) {
  const redditPattern =
    /^https?:\/\/(www\.)?(old\.)?reddit\.com\/r\/[\w]+\/(comments\/[\w]+\/?)?/i;
  return redditPattern.test(url);
}

// Validate subreddit name (Security - prevent injection)
function validateSubreddit(name) {
  const subredditPattern = /^[\w]+$/;
  return subredditPattern.test(name) && name.length <= 50;
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

module.exports = {
  validateRedditUrl,
  validateSubreddit,
  sanitizeForLog,
  log,
  setLogLevel,
  createTimer,
  RateLimiter,
  LOG_LEVELS,
};
