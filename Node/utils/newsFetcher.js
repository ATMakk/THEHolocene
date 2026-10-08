const axios = require("axios");
const { CATEGORY_TO_NEWS_QUERY } = require("../constants/categories");

let lastFetchTime = 0;
const RATE_LIMIT_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Fetch news from RapidAPI with 30-min rate limit.
 * @param {Object} options
 * @param {string} options.category - one of CATEGORIES
 * @param {string} [options.locale="en-US"]
 * @param {number} [options.page=1]
 */
const fetchNews = async ({ category = "headlines", locale = "en-US", page = 1 } = {}) => {
  const now = Date.now();
  if (now - lastFetchTime < RATE_LIMIT_MS) {
    const waitSec = Math.ceil((RATE_LIMIT_MS - (now - lastFetchTime)) / 1000);
    const err = new Error(`Rate limit reached. Try again in ${waitSec}s.`);
    err.statusCode = 429;
    throw err;
  }

  const query = CATEGORY_TO_NEWS_QUERY[category] || "top stories";

  try {
    const response = await axios.get(
      "https://real-time-news-data.p.rapidapi.com/search",
      {
        params: { query, locale, time_published: "anytime", limit: "10", page },
        headers: {
          "x-rapidapi-key": process.env.RAPID_API_KEY,
          "x-rapidapi-host": "real-time-news-data.p.rapidapi.com",
        },
      }
    );

    lastFetchTime = Date.now();

    return (response.data?.data || []).map((a) => ({
      title: a.title,
      snippet: a.snippet,
      url: a.link,
      image: a.photo_url,
      source: a.source_name,
      publishedAt: a.published_datetime_utc,
    }));
  } catch (error) {
    console.error("News fetch failed:", error.message);
    throw error;
  }
};

module.exports = { fetchNews };