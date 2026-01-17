/**
 * Reddit API fetching utilities
 */

const { parseComments, flattenComments, parsePost } = require("./parser");
const { metrics, log, createTimer } = require("./utils");

const DEFAULT_USER_AGENT = "RedditParser/2.0";
const DEFAULT_DELAY_MS = 1000;
const DEFAULT_TIMEOUT_MS = 30000;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Fetch with timeout (Optimize)
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

async function fetchWithRetry(url, options = {}, retries = 3) {
  const { userAgent = DEFAULT_USER_AGENT, timeoutMs = DEFAULT_TIMEOUT_MS } =
    options;
  const timer = createTimer();

  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetchWithTimeout(
        url,
        { headers: { "User-Agent": userAgent } },
        timeoutMs,
      );

      if (res.status === 429) {
        // Rate limited - wait and retry
        const waitTime = Math.pow(2, i) * 1000;
        log("WARN", `Rate limited, waiting ${waitTime}ms...`);
        await sleep(waitTime);
        continue;
      }

      if (!res.ok) {
        metrics.recordRequest(false);
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      metrics.recordRequest(true);
      metrics.recordTiming("api", timer.elapsed());
      return res.json();
    } catch (err) {
      if (err.name === "AbortError") {
        metrics.recordError(err, { url, reason: "timeout" });
        throw new Error(`Request timed out after ${timeoutMs}ms`);
      }
      if (i === retries - 1) {
        metrics.recordRequest(false);
        metrics.recordError(err, { url, attempt: i + 1 });
        throw err;
      }
      log("DEBUG", `Retry ${i + 1}/${retries} for ${url}`);
      await sleep(1000);
    }
  }
}

async function fetchThread(redditUrl, options = {}) {
  const jsonUrl = redditUrl.replace(/\/?(\?.*)?$/, ".json");
  const data = await fetchWithRetry(jsonUrl, options);

  // Validate Reddit API response structure
  if (!Array.isArray(data) || data.length < 2) {
    throw new Error(
      "Unexpected Reddit API response: expected array with post and comments",
    );
  }
  if (!data[0]?.data?.children?.[0]?.data) {
    throw new Error(
      "Unexpected Reddit API response: missing post data (post may be deleted or private)",
    );
  }
  if (!data[1]?.data?.children) {
    throw new Error("Unexpected Reddit API response: missing comments data");
  }

  const postData = data[0].data.children[0].data;
  const commentsData = data[1].data.children;

  const post = parsePost(postData);
  const comments = parseComments(commentsData);
  const flatComments = flattenComments(comments);

  return { post, comments: flatComments };
}

async function fetchSubredditPosts(subreddit, options = {}) {
  const {
    sort = "hot",
    since = "day",
    limit = 25,
    userAgent = DEFAULT_USER_AGENT,
  } = options;

  // Build URL based on sort type
  let url = `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}`;

  // Add time filter for 'top' and 'controversial' sorts
  if (sort === "top" || sort === "controversial") {
    url += `&t=${since}`;
  }

  const data = await fetchWithRetry(url, { userAgent });

  const posts = [];
  for (const child of data.data.children) {
    if (child.kind === "t3") {
      posts.push(parsePost(child.data));
    }
  }

  return posts;
}

async function fetchSubredditWithComments(subreddit, options = {}) {
  const {
    sort = "hot",
    since = "day",
    limit = 25,
    delayMs = DEFAULT_DELAY_MS,
    onProgress,
  } = options;

  // First, get list of posts
  const posts = await fetchSubredditPosts(subreddit, { sort, since, limit });

  const results = [];
  const errors = [];

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const threadUrl = `https://reddit.com/r/${post.subreddit}/comments/${post.id}/`;

    if (onProgress) {
      onProgress(i + 1, posts.length, post.title);
    }

    try {
      const result = await fetchThread(threadUrl, options);
      results.push(result);
    } catch (err) {
      errors.push({ url: threadUrl, error: err.message });
      console.error(`    Error fetching ${post.id}: ${err.message}`);
    }

    // Delay between requests
    if (i < posts.length - 1) {
      await sleep(delayMs);
    }
  }

  return { results, errors };
}

module.exports = {
  fetchThread,
  fetchSubredditPosts,
  fetchSubredditWithComments,
  sleep,
};
