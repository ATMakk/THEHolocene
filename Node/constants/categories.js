// Central source of truth for blog categories.
// Use everywhere: model enum, validation, news API mapping, etc.

const CATEGORIES = [
  "headlines",      
  "politics",
  "sports",
  "entertainment",
  "technology",     
  "education",
  "fintech",
  "business",
  "health",
  "world",
];

// News API query mapping: our category → search query for RapidAPI
const CATEGORY_TO_NEWS_QUERY = {
  headlines: "top stories",
  politics: "politics",
  sports: "sports",
  entertainment: "entertainment",
  technology: "technology",
  education: "education",
  fintech: "fintech",
  business: "business",
  health: "health",
  world: "world news",
};

module.exports = { CATEGORIES, CATEGORY_TO_NEWS_QUERY };