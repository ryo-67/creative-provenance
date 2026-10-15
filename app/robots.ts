import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

// AI search and assistant crawlers, allowed by name: being read and cited
// by them is how a small tool gets found. Each fetches pages to answer a
// question or build a search index, not to train a model.
const AI_SEARCH_CRAWLERS = [
  'OAI-SearchBot',
  'ChatGPT-User',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
];

// AI training crawlers, blocked from the whole site. A tool about
// artists' consent and credit doesn't hand its own pages to training
// pipelines. Google-Extended and Applebot-Extended are opt-out tokens,
// not separate bots: blocking them keeps pages out of Gemini and Apple
// model training without touching Google Search or Applebot.
const AI_TRAINING_CRAWLERS = [
  'GPTBot',
  'ClaudeBot',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
  'Meta-ExternalAgent',
  'Bytespider',
];

// The grace route is private plumbing. /api/og stays crawlable:
// link-preview bots (Twitterbot among them) obey robots.txt and need the
// share image. /result and /questionnaire stay crawlable too; they opt
// out of the index with a noindex meta tag, which a crawler can only
// read if it is allowed to fetch the page.
const disallow = ['/api/grace'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow },
      { userAgent: AI_SEARCH_CRAWLERS, allow: '/', disallow },
      { userAgent: AI_TRAINING_CRAWLERS, disallow: '/' },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
