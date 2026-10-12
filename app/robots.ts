import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

// AI search and assistant crawlers, allowed by name: being read and cited
// by them is how a small tool gets found. Same list as shoro.space.
const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
];

// The two data routes are private plumbing. /api/og stays crawlable:
// link-preview bots (Twitterbot among them) obey robots.txt and need the
// share image. /result and /questionnaire stay crawlable too; they opt
// out of the index with a noindex meta tag, which a crawler can only
// read if it is allowed to fetch the page.
const disallow = ['/api/grace', '/api/tally-submission'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow },
      { userAgent: AI_CRAWLERS, allow: '/', disallow },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
