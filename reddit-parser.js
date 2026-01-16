#!/usr/bin/env node

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

const MAX_ITEMS = 50;
const program = new Command();

program
  .name("reddit-parser")
  .description("Parse Reddit threads/subreddits and analyze with AI")
  .version("2.0.0")
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
  .action(main);

async function main(urls, options) {
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
}

program.parse();
