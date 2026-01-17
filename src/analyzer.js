/**
 * LLM Analysis integration - supports Claude, OpenAI, and Ollama
 */

const { metrics, createTimer, log } = require("./utils");

const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_RETRY_COUNT = 3;
const DEFAULT_DELAY_BETWEEN_REQUESTS_MS = 100;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(err, status) {
  // Retry on network errors, timeouts, and server-side issues
  if (err.name === "AbortError") return true;
  if (err.message.includes("timed out")) return true;
  if (status === 429 || status === 503 || status === 502 || status === 500)
    return true;
  return false;
}

async function fetchWithTimeout(
  url,
  options = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

async function parseJsonSafe(response, providerName) {
  try {
    return await response.json();
  } catch (parseError) {
    throw new Error(
      `Failed to parse ${providerName} response as JSON: ${parseError.message}`,
    );
  }
}

/**
 * Check if Ollama is available at the given URL
 * @param {string} baseUrl - Ollama base URL (default: http://localhost:11434)
 * @returns {Promise<boolean>} - true if Ollama is available
 */
async function checkOllamaAvailable(baseUrl = "http://localhost:11434") {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${baseUrl}/api/tags`, {
      signal: controller.signal,
    });

    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

class LLMAnalyzer {
  constructor(config) {
    this.provider = config.provider;
    this.model = config.model;
    this.apiKey = config.api_key;
    this.baseUrl = config.base_url;
    this.maxTokens = config.max_tokens || 4096;
  }

  async analyze(content, prompt, retries = DEFAULT_RETRY_COUNT) {
    const timer = createTimer();
    let lastError;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        let result;
        switch (this.provider) {
          case "claude":
            result = await this.analyzeWithClaude(content, prompt);
            break;
          case "openai":
            result = await this.analyzeWithOpenAI(content, prompt);
            break;
          case "ollama":
            result = await this.analyzeWithOllama(content, prompt);
            break;
          default:
            throw new Error(`Unknown provider: ${this.provider}`);
        }
        metrics.recordTiming("llm", timer.elapsed());
        return result;
      } catch (err) {
        lastError = err;
        const status =
          err.status ||
          (err.message.match(/(\d{3})/) &&
            parseInt(err.message.match(/(\d{3})/)[1]));

        if (!isRetryableError(err, status) || attempt === retries - 1) {
          metrics.recordError(err, {
            provider: this.provider,
            model: this.model,
          });
          throw err;
        }

        const waitTime = Math.pow(2, attempt) * 1000;
        log(
          "WARN",
          `LLM request failed (attempt ${attempt + 1}/${retries}), retrying in ${waitTime}ms...`,
        );
        await sleep(waitTime);
      }
    }

    metrics.recordError(lastError, {
      provider: this.provider,
      model: this.model,
    });
    throw lastError;
  }

  async analyzeWithClaude(content, prompt) {
    if (!this.apiKey) {
      throw new Error(
        "Claude API key not set. Set ANTHROPIC_API_KEY environment variable.",
      );
    }

    let response;
    try {
      response = await fetchWithTimeout(
        "https://api.anthropic.com/v1/messages",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": this.apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: this.model,
            max_tokens: this.maxTokens,
            messages: [
              {
                role: "user",
                content: `${prompt}\n\n---\n\nREDDIT DATA:\n\n${content}`,
              },
            ],
          }),
        },
      );
    } catch (err) {
      if (err.name === "AbortError") {
        throw new Error(
          `Claude API request timed out after ${DEFAULT_TIMEOUT_MS}ms`,
        );
      }
      throw err;
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${error}`);
    }

    const data = await parseJsonSafe(response, "Claude");
    return data.content[0].text;
  }

  async analyzeWithOpenAI(content, prompt) {
    if (!this.apiKey) {
      throw new Error(
        "OpenAI API key not set. Set OPENAI_API_KEY environment variable.",
      );
    }

    let response;
    try {
      response = await fetchWithTimeout(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: this.model,
            max_tokens: this.maxTokens,
            messages: [
              {
                role: "user",
                content: `${prompt}\n\n---\n\nREDDIT DATA:\n\n${content}`,
              },
            ],
          }),
        },
      );
    } catch (err) {
      if (err.name === "AbortError") {
        throw new Error(
          `OpenAI API request timed out after ${DEFAULT_TIMEOUT_MS}ms`,
        );
      }
      throw err;
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await parseJsonSafe(response, "OpenAI");
    return data.choices[0].message.content;
  }

  async analyzeWithOllama(content, prompt) {
    const baseUrl = this.baseUrl || "http://localhost:11434";

    let response;
    try {
      response = await fetchWithTimeout(`${baseUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          prompt: `${prompt}\n\n---\n\nREDDIT DATA:\n\n${content}`,
          stream: false,
        }),
      });
    } catch (err) {
      if (err.name === "AbortError") {
        throw new Error(
          `Ollama API request timed out after ${DEFAULT_TIMEOUT_MS}ms`,
        );
      }
      throw err;
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${error}`);
    }

    const data = await parseJsonSafe(response, "Ollama");
    return data.response;
  }
}

function prepareContentForAnalysis(results) {
  const lines = [];

  for (const { post, comments } of results) {
    lines.push(`## ${post.title}`);
    lines.push(
      `Subreddit: r/${post.subreddit} | Author: u/${post.author} | Score: ${post.score}`,
    );
    lines.push("");

    if (post.selftext) {
      lines.push(post.selftext);
      lines.push("");
    }

    lines.push(`### Comments (${comments.length})`);
    lines.push("");

    for (const comment of comments.slice(0, 50)) {
      // Limit comments per post for context size
      const indent = "  ".repeat(comment.depth);
      lines.push(`${indent}u/${comment.author} (${comment.score} pts):`);
      lines.push(`${indent}${comment.body}`);
      lines.push("");
    }

    lines.push("---");
    lines.push("");
  }

  return lines.join("\n");
}

async function runAnalysis(results, prompts, providerConfig, onProgress) {
  const analyzer = new LLMAnalyzer(providerConfig);
  const content = prepareContentForAnalysis(results);
  const analysisResults = [];
  const delayMs = providerConfig.delay_ms || DEFAULT_DELAY_BETWEEN_REQUESTS_MS;

  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i];

    if (onProgress) {
      onProgress(i + 1, prompts.length, prompt.slice(0, 50));
    }

    try {
      const response = await analyzer.analyze(content, prompt);
      analysisResults.push({ prompt, response });
    } catch (err) {
      console.error(`    Error on prompt ${i + 1}: ${err.message}`);
      analysisResults.push({ prompt, response: `Error: ${err.message}` });
    }

    // Rate limiting: delay between requests (except after the last one)
    if (i < prompts.length - 1) {
      await sleep(delayMs);
    }
  }

  return analysisResults;
}

module.exports = {
  LLMAnalyzer,
  prepareContentForAnalysis,
  runAnalysis,
  checkOllamaAvailable,
};
