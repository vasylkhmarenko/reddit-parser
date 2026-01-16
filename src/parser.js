/**
 * Reddit comment parsing utilities
 */

function parseComments(children, depth = 0) {
  const comments = [];

  for (const child of children) {
    if (child.kind !== "t1") continue;

    const data = child.data;
    const comment = {
      author: data.author,
      body: data.body,
      score: data.score,
      created: new Date(data.created_utc * 1000).toISOString(),
      depth,
      replies: [],
    };

    if (data.replies && data.replies.data?.children) {
      comment.replies = parseComments(data.replies.data.children, depth + 1);
    }

    comments.push(comment);
  }

  return comments;
}

function flattenComments(comments, flat = []) {
  for (const c of comments) {
    const { replies, ...comment } = c;
    flat.push(comment);
    if (replies.length) flattenComments(replies, flat);
  }
  return flat;
}

function decodeHtmlEntities(text) {
  if (!text) return "";
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function parsePost(postData) {
  return {
    id: postData.id,
    title: postData.title,
    author: postData.author,
    subreddit: postData.subreddit,
    score: postData.score,
    url: postData.url,
    selftext: postData.selftext,
    created: new Date(postData.created_utc * 1000).toISOString(),
    num_comments: postData.num_comments,
  };
}

module.exports = {
  parseComments,
  flattenComments,
  decodeHtmlEntities,
  parsePost,
};
