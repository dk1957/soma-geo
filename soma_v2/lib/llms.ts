export interface Statistic {
  id: number;
  value: string;
  label: string;
  source: string;
  citationIndex: number;
}

export const presentationStatistics: Statistic[] = [
  {
    id: 1,
    value: "4.4x",
    label: "more valuable are AI search visitors than traditional search visitors",
    source: "https://www.semrush.com/blog/ai-search-seo-traffic-study/",
    citationIndex: 1,
  },
  {
    id: 2,
    value: "75%",
    label: "of knowledge workers use AI at work today.",
    source: "https://www.microsoft.com/en-us/worklab/work-trend-index/ai-at-work-is-here-now-comes-the-hard-part",
    citationIndex: 2,
  },
    {
    id: 3,
    value: "165x",
    label: "faster than traditional search",
    source: "https://www.webfx.com/blog/seo/gen-ai-search-trends/",
    citationIndex: 3,
  },
  {
    id: 4,
    value: "67%",
    label: "of people in emerging economies use AI regularly",
    source: "https://www.reuters.com/business/emerging-economies-lead-way-ai-trust-survey-shows-2025-04-28?utm_source=chatgpt.com",
    citationIndex: 4,
  },
  {
    id: 5,
    value: "40%",
    label: "visibility gain possible with proper GEO strategies",
    source: "https://generative-engines.com/GEO/",
    citationIndex: 5,
  },
  {
    id: 6,
    value: "25%",
    label: "decline in traditional search by 2026",
    source: "https://www.semrush.com/blog/ai-search-seo-traffic-study/",
    citationIndex: 6,
  },
];
