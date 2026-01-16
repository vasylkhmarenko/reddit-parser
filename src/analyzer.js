/**
 * LLM Analysis integration - supports Claude, OpenAI, and Ollama
 */

class LLMAnalyzer {
  constructor(config) {
    this.provider = config.provider;
    this.model = config.model;
    this.apiKey = config.api_key;
    this.baseUrl = config.base_url;
    this.maxTokens = config.max_tokens || 4096;
  }

  async analyze(content, prompt) {
    switch (this.provider) {
      case "claude":
        return this.analyzeWithClaude(content, prompt);
      case "openai":
        return this.analyzeWithOpenAI(content, prompt);
      case "ollama":
        return this.analyzeWithOllama(content, prompt);
      default:
        throw new Error(`Unknown provider: ${this.provider}`);
    }
  }

  async analyzeWithClaude(content, prompt) {
    if (!this.apiKey) {
      throw new Error(
        "Claude API key not set. Set ANTHROPIC_API_KEY environment variable.",
      );
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
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
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  async analyzeWithOpenAI(content, prompt) {
    if (!this.apiKey) {
      throw new Error(
        "OpenAI API key not set. Set OPENAI_API_KEY environment variable.",
      );
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async analyzeWithOllama(content, prompt) {
    const baseUrl = this.baseUrl || "http://localhost:11434";

    const response = await fetch(`${baseUrl}/api/generate`, {
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

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
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
  }

  return analysisResults;
}

module.exports = {
  LLMAnalyzer,
  prepareContentForAnalysis,
  runAnalysis,
};
