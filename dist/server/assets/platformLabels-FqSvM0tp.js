const MENTION_PLATFORM_LABELS = {
  chat_gpt: "ChatGPT",
  google: "Google AI Overview"
};
const MODEL_LABELS = {
  chat_gpt: "ChatGPT",
  claude: "Claude",
  gemini: "Gemini",
  perplexity: "Perplexity"
};
const MODEL_ACCENTS = {
  chat_gpt: {
    border: "border-l-emerald-500",
    dot: "bg-emerald-500"
  },
  claude: {
    border: "border-l-orange-500",
    dot: "bg-orange-500"
  },
  gemini: {
    border: "border-l-sky-500",
    dot: "bg-sky-500"
  },
  perplexity: {
    border: "border-l-violet-500",
    dot: "bg-violet-500"
  }
};
function formatPlatformLabel(platform) {
  return MENTION_PLATFORM_LABELS[platform];
}
const PLATFORM_DOT_CLASS = {
  chat_gpt: "bg-emerald-500",
  google: "bg-sky-500"
};
const PLATFORM_SHORT_LABEL = {
  chat_gpt: "ChatGPT",
  google: "Google"
};
function formatModelLabel(model) {
  return MODEL_LABELS[model];
}
function getModelAccent(model) {
  return MODEL_ACCENTS[model];
}
const COUNTRY_LABELS = {
  US: "United States",
  GB: "United Kingdom",
  CA: "Canada",
  AU: "Australia",
  IE: "Ireland",
  DE: "Germany",
  FR: "France",
  ES: "Spain",
  IT: "Italy",
  NL: "Netherlands",
  PT: "Portugal",
  PL: "Poland",
  SE: "Sweden",
  NO: "Norway",
  DK: "Denmark",
  BR: "Brazil",
  MX: "Mexico",
  IN: "India",
  JP: "Japan",
  KR: "South Korea",
  SG: "Singapore",
  HK: "Hong Kong",
  TW: "Taiwan",
  ZA: "South Africa"
};
function formatCountryLabel(code) {
  return COUNTRY_LABELS[code];
}
const NUMBER_FORMATTER = new Intl.NumberFormat("en-US");
function formatCount(value) {
  if (value == null) return "—";
  return NUMBER_FORMATTER.format(value);
}
export {
  PLATFORM_DOT_CLASS as P,
  formatPlatformLabel as a,
  formatModelLabel as b,
  formatCountryLabel as c,
  PLATFORM_SHORT_LABEL as d,
  formatCount as f,
  getModelAccent as g
};
