import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

// Only the landing page is indexable. /questionnaire is a Tally iframe
// with nothing for a crawler to read, and /result pages are personal
// submissions; both carry noindex and stay out of the sitemap.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${SITE_URL}/` }];
}
