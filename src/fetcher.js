/**
 * Reddit API fetching utilities
 */

const { parseComments, flattenComments, parsePost } = require("./parser");

const DEFAULT_USER_AGENT = "RedditParser/2.0";
const DEFAULT_DELAY_MS = 1000;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options = {}, retries = 3) {
  const { userAgent = DEFAULT_USER_AGENT } = options;

  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": userAgent },
      });

      if (res.status === 429) {
        // Rate limited - wait and retry
        const waitTime = Math.pow(2, i) * 1000;
        console.error(`Rate limited, waiting ${waitTime}ms...`);
        await sleep(waitTime);
        continue;
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      return res.json();
    } catch (err) {
      if (i === retries - 1) throw err;
      await sleep(1000);
    }
  }
}

async function fetchThread(redditUrl, options = {}) {
  const jsonUrl = redditUrl.replace(/\/?(\?.*)?$/, ".json");
  const data = await fetchWithRetry(jsonUrl, options);

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
