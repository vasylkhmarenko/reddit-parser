#!/usr/bin/env node

require("dotenv").config({ quiet: true });
const fs = require("fs");
const { Command } = require("commander");
const {
  fetchThread,
  fetchSubredditWithComments,
  sleep,
} = require("./src/fetcher");
const {
  formatCollectionMarkdown,
  formatAnalysisMarkdown,
  formatJSON,
} = require("./src/formatter");
const { loadConfig, getProviderConfig, loadPrompts } = require("./src/config");
const { runAnalysis } = require("./src/analyzer");
const {
  validateRedditUrl,
  validateSubreddit,
  log,
  setLogLevel,
  createTimer,
  metrics,
} = require("./src/utils");

const MAX_ITEMS = 50;
const path = require("path");
const program = new Command();

program
  .name("reddit-parser")
  .description("Parse Reddit threads/subreddits and analyze with AI")
  .version("3.0.0");

// Default command - fetch Reddit data
program
  .argument("[urls...]", "Reddit thread URLs to parse (max 50)")
  .option("-s, --subreddit <name>", "Subreddit to scrape (e.g., webdev)")
  .option("--top <n>", "Number of posts to fetch (max 50)", parseInt)
  .option(
    "--since <period>",
    "Time period: hour, day, week, month, year, all",
    "day",
  )
  .option("--sort <type>", "Sort by: hot, new, top, rising", "hot")
  .option("-m, --md", "Output as markdown")
  .option("-o, --output <file>", "Save output to file")
  .option("--analyze", "Enable AI analysis")
  .option("--prompts <file>", "Path to prompts file", "./prompts.txt")
  .option("--provider <name>", "LLM provider: claude, openai, ollama")
  .option("--model <name>", "Model name override")
  .option("--config <file>", "Path to config file")
  .option("--debug", "Enable debug logging")
  .option("--stats", "Show execution statistics at end")
  .action(main);

// Gaps command - generate market gaps from pain points
program
  .command("gaps")
  .description("Generate market gaps/solutions from pain points analysis")
  .requiredOption(
    "-i, --input <file>",
    "Input file with pain points (markdown)",
  )
  .option("-o, --output <file>", "Output file for market gaps")
  .option("--provider <name>", "LLM provider: claude, openai, ollama")
  .option("--model <name>", "Model name override")
  .option("--config <file>", "Path to config file")
  .option("--debug", "Enable debug logging")
  .action(runGapsCommand);

// Landing command - generate landing page prompt
program
  .command("landing")
  .description("Generate frontend-design plugin prompt for landing page")
  .requiredOption(
    "-i, --input <file>",
    "Input file with market gaps (markdown)",
  )
  .option("-o, --output <file>", "Output file for landing page prompt")
  .option("--provider <name>", "LLM provider: claude, openai, ollama")
  .option("--model <name>", "Model name override")
  .option("--config <file>", "Path to config file")
  .option("--debug", "Enable debug logging")
  .action(runLandingCommand);

// Marketing command - generate Reddit marketing plan
program
  .command("marketing")
  .description("Generate Reddit marketing strategy and content templates")
  .requiredOption(
    "-i, --input <file>",
    "Input file with market gaps (markdown)",
  )
  .requiredOption("--product <name>", "Product name")
  .requiredOption(
    "--subreddits <list>",
    "Comma-separated list of target subreddits",
  )
  .option("-o, --output <file>", "Output file for marketing plan")
  .option("--provider <name>", "LLM provider: claude, openai, ollama")
  .option("--model <name>", "Model name override")
  .option("--config <file>", "Path to config file")
  .option("--debug", "Enable debug logging")
  .action(runMarketingCommand);

async function main(urls, options) {
  // Debug mode (7-debug)
  if (options.debug) {
    setLogLevel("DEBUG");
    log("DEBUG", "Debug mode enabled");
  }

  const config = loadConfig(options.config);
  const results = [];
  const errors = [];

  // Determine what to fetch
  const hasUrls = urls && urls.length > 0;
  const hasSubreddit = options.subreddit;

  if (!hasUrls && !hasSubreddit) {
    console.error("Error: Provide Reddit URLs or use --subreddit option");
    console.error("");
    program.help();
  }

  // Validate URL count
  if (hasUrls && urls.length > MAX_ITEMS) {
    console.error(
      `Error: Maximum ${MAX_ITEMS} URLs allowed (got ${urls.length})`,
    );
    process.exit(1);
  }

  // Validate URLs (Security)
  if (hasUrls) {
    const invalidUrls = urls.filter((url) => !validateRedditUrl(url));
    if (invalidUrls.length > 0) {
      console.error("Error: Invalid Reddit URL(s):");
      invalidUrls.forEach((url) => console.error(`  - ${url}`));
      console.error(
        "\nExpected format: https://reddit.com/r/subreddit/comments/...",
      );
      process.exit(1);
    }
  }

  // Validate subreddit name (Security)
  if (hasSubreddit && !validateSubreddit(options.subreddit)) {
    console.error(`Error: Invalid subreddit name: ${options.subreddit}`);
    console.error(
      "Subreddit names can only contain letters, numbers, and underscores.",
    );
    process.exit(1);
  }

  const timer = createTimer();

  // Fetch from URLs
  if (hasUrls) {
    console.error(`Fetching ${urls.length} thread(s)...\n`);

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      console.error(`[${i + 1}/${urls.length}] Fetching: ${url}`);

      try {
        const result = await fetchThread(url);
        results.push(result);
        console.error(
          `    ✓ ${result.post.title.slice(0, 50)}... (${result.comments.length} comments)`,
        );
      } catch (err) {
        console.error(`    ✗ Error: ${err.message}`);
        errors.push({ url, error: err.message });
      }

      if (i < urls.length - 1) {
        await sleep(config.reddit.request_delay_ms);
      }
    }
  }

  // Fetch from subreddit
  if (hasSubreddit) {
    const limit = Math.min(options.top || config.defaults.top, MAX_ITEMS);
    const sort = options.sort || config.defaults.sort;
    const since = options.since || config.defaults.since;

    console.error(
      `\nFetching r/${options.subreddit} (${sort}, ${since}, limit: ${limit})...\n`,
    );

    const { results: subResults, errors: subErrors } =
      await fetchSubredditWithComments(options.subreddit, {
        sort,
        since,
        limit,
        delayMs: config.reddit.request_delay_ms,
        onProgress: (current, total, title) => {
          console.error(`[${current}/${total}] ${title.slice(0, 60)}...`);
        },
      });

    results.push(...subResults);
    errors.push(...subErrors);
  }

  console.error("");

  if (results.length === 0) {
    console.error("No threads fetched successfully.");
    process.exit(1);
  }

  console.error(
    `✓ Fetched ${results.length} thread(s), ${results.reduce((s, r) => s + r.comments.length, 0)} comments total\n`,
  );

  // AI Analysis
  let analysisResults = null;

  if (options.analyze) {
    try {
      const prompts = loadPrompts(options.prompts);
      console.error(
        `Running AI analysis with ${prompts.length} prompt(s)...\n`,
      );

      const providerConfig = getProviderConfig(config, options.provider);
      if (options.model) {
        providerConfig.model = options.model;
      }

      console.error(
        `Provider: ${providerConfig.provider}, Model: ${providerConfig.model}\n`,
      );

      analysisResults = await runAnalysis(
        results,
        prompts,
        providerConfig,
        (current, total, prompt) => {
          console.error(`[${current}/${total}] Analyzing: ${prompt}...`);
        },
      );

      console.error(`\n✓ Analysis complete\n`);
    } catch (err) {
      console.error(`Analysis error: ${err.message}`);
      console.error("Continuing with raw data output...\n");
    }
  }

  // Format output
  let output;

  if (options.md || options.analyze) {
    if (analysisResults) {
      output = formatAnalysisMarkdown(results, analysisResults, {
        subreddit: options.subreddit,
      });
    } else {
      output = formatCollectionMarkdown(results);
    }
  } else {
    output = formatJSON(results, errors);
  }

  // Output
  if (options.output) {
    fs.writeFileSync(options.output, output);
    console.error(`Saved to: ${options.output}`);
    console.error(`  - ${results.length} threads`);
    console.error(
      `  - ${results.reduce((s, r) => s + r.comments.length, 0)} total comments`,
    );
    if (analysisResults) {
      console.error(`  - ${analysisResults.length} analysis prompts`);
    }
    if (errors.length > 0) {
      console.error(`  - ${errors.length} failed URLs`);
    }
  } else {
    console.log(output);
  }

  // Performance logging (Monitor)
  timer.log("Total execution");

  // Stats output (8-monitor)
  if (options.stats) {
    console.error("\n--- Execution Statistics ---");
    const summary = metrics.getSummary();
    console.error(`Total API requests: ${summary.requests.total}`);
    console.error(`  Successful: ${summary.requests.success}`);
    console.error(`  Failed: ${summary.requests.failed}`);
    if (summary.avgApiTime > 0) {
      console.error(`Avg Reddit API time: ${summary.avgApiTime}ms`);
    }
    if (summary.avgLlmTime > 0) {
      console.error(`Avg LLM response time: ${summary.avgLlmTime}ms`);
    }
    if (summary.errorCount > 0) {
      console.error(`Errors recorded: ${summary.errorCount}`);
    }
    console.error(`Total execution time: ${timer.elapsed()}ms`);
  }
}

// Helper: Run LLM analysis on input file with prompt template
async function runWorkflowCommand(options, promptFile, extraContext = "") {
  if (options.debug) {
    setLogLevel("DEBUG");
    log("DEBUG", "Debug mode enabled");
  }

  const config = loadConfig(options.config);
  const timer = createTimer();

  // Read input file
  if (!fs.existsSync(options.input)) {
    console.error(`Error: Input file not found: ${options.input}`);
    process.exit(1);
  }
  const inputContent = fs.readFileSync(options.input, "utf-8");
  console.error(`Read input: ${options.input}`);

  // Read prompt template
  const promptPath = path.join(__dirname, "prompts", promptFile);
  if (!fs.existsSync(promptPath)) {
    console.error(`Error: Prompt template not found: ${promptPath}`);
    process.exit(1);
  }
  const promptTemplate = fs.readFileSync(promptPath, "utf-8");

  // Combine prompt + extra context + input
  const fullPrompt = promptTemplate + "\n" + extraContext + "\n" + inputContent;

  // Get provider config
  const providerConfig = getProviderConfig(config, options.provider);
  if (options.model) {
    providerConfig.model = options.model;
  }

  console.error(
    `Provider: ${providerConfig.provider}, Model: ${providerConfig.model}\n`,
  );
  console.error("Running AI analysis...\n");

  // Run analysis
  const { LLMAnalyzer } = require("./src/analyzer");
  const analyzer = new LLMAnalyzer(providerConfig);

  try {
    const result = await analyzer.analyze("", fullPrompt);

    // Output
    if (options.output) {
      fs.writeFileSync(options.output, result);
      console.error(`\n✓ Saved to: ${options.output}`);
    } else {
      console.log(result);
    }

    console.error(`\n✓ Complete (${timer.elapsed()}ms)`);
  } catch (err) {
    console.error(`\nError: ${err.message}`);
    process.exit(1);
  }
}

// Gaps command handler
async function runGapsCommand(options, cmd) {
  console.error("\n=== Market Gap Generator ===\n");
  // Merge parent options (for -o which is defined on parent)
  const mergedOptions = { ...cmd.parent.opts(), ...options };
  await runWorkflowCommand(mergedOptions, "market-gaps.txt");
}

// Landing command handler
async function runLandingCommand(options, cmd) {
  console.error("\n=== Landing Page Prompt Generator ===\n");
  const mergedOptions = { ...cmd.parent.opts(), ...options };
  await runWorkflowCommand(mergedOptions, "landing-page.txt");
}

// Marketing command handler
async function runMarketingCommand(options, cmd) {
  console.error("\n=== Reddit Marketing Strategy Generator ===\n");
  const mergedOptions = { ...cmd.parent.opts(), ...options };
  const extraContext = `
Product Name: ${mergedOptions.product}
Target Subreddits: ${mergedOptions.subreddits
    .split(",")
    .map((s) => "r/" + s.trim())
    .join(", ")}
`;
  await runWorkflowCommand(mergedOptions, "reddit-marketing.txt", extraContext);
}

program.parse();
