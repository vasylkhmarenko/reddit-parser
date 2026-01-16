/**
 * Configuration management
 */

const fs = require("fs");
const path = require("path");

const DEFAULT_CONFIG = {
  llm: {
    default_provider: "claude",
    providers: {
      claude: {
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
      },
      openai: {
        model: "gpt-4o",
        max_tokens: 4096,
      },
      ollama: {
        model: "llama3",
        base_url: "http://localhost:11434",
      },
    },
  },
  reddit: {
    user_agent: "RedditParser/2.0",
    request_delay_ms: 1000,
    max_retries: 3,
  },
  defaults: {
    top: 25,
    since: "day",
    sort: "hot",
  },
};

function loadConfig(configPath) {
  let config = { ...DEFAULT_CONFIG };

  // Try to load config file
  if (configPath) {
    try {
      const fileConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      config = mergeDeep(config, fileConfig);
    } catch (err) {
      if (err.code !== "ENOENT") {
        console.error(`Warning: Could not load config from ${configPath}`);
      }
    }
  } else {
    // Try default locations
    const defaultPaths = [
      "./reddit-parser.config.json",
      path.join(process.env.HOME || "", ".reddit-parser.config.json"),
    ];

    for (const p of defaultPaths) {
      try {
        const fileConfig = JSON.parse(fs.readFileSync(p, "utf-8"));
        config = mergeDeep(config, fileConfig);
        break;
      } catch {
        // File not found, continue
      }
    }
  }

  // Override with environment variables
  if (process.env.ANTHROPIC_API_KEY) {
    config.llm.providers.claude.api_key = process.env.ANTHROPIC_API_KEY;
  }
  if (process.env.OPENAI_API_KEY) {
    config.llm.providers.openai.api_key = process.env.OPENAI_API_KEY;
  }
  if (process.env.OLLAMA_BASE_URL) {
    config.llm.providers.ollama.base_url = process.env.OLLAMA_BASE_URL;
  }
  if (process.env.REDDIT_PARSER_PROVIDER) {
    config.llm.default_provider = process.env.REDDIT_PARSER_PROVIDER;
  }

  return config;
}

function mergeDeep(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {
      result[key] = mergeDeep(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

function getProviderConfig(config, providerName) {
  const provider = providerName || config.llm.default_provider;
  const providerConfig = config.llm.providers[provider];

  if (!providerConfig) {
    throw new Error(`Unknown LLM provider: ${provider}`);
  }

  return { provider, ...providerConfig };
}

function loadPrompts(promptsPath) {
  try {
    const content = fs.readFileSync(promptsPath, "utf-8");
    return content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"));
  } catch (err) {
    if (err.code === "ENOENT") {
      throw new Error(`Prompts file not found: ${promptsPath}`);
    }
    throw err;
  }
}

module.exports = {
  DEFAULT_CONFIG,
  loadConfig,
  getProviderConfig,
  loadPrompts,
};
