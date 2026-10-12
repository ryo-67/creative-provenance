// Site identity shared by metadata, robots, sitemap and structured data.
//
// SITE_URL is the canonical origin: the apex domain, no www. Canonical
// links, the sitemap and the JSON-LD always point here, whatever host
// served the request (www, the legacy creative-provenance.vercel.app
// URL, or a preview deploy).

export const SITE_URL = 'https://creativetrace.art';

export const SITE_NAME = 'Creative Trace';

// Search-result title for the landing page. Leads with the name, then
// the phrase people search for. Kept under ~60 characters so Google
// shows it whole.
export const SITE_TITLE = 'Creative Trace · Map the creative provenance of your art';

// Search-result and link-preview description. Kept under ~160
// characters so Google shows it whole.
export const SITE_DESCRIPTION =
  'Answer ten questions about one piece of your art. Get a Tracemark, a visual mark of its creative provenance, and a Grace naming everything that fed it.';

// metadataBase resolves relative URLs in metadata (og:image, canonical,
// favicons) to absolute ones. Production uses the canonical origin so
// crawlers see creativetrace.art; preview deploys use VERCEL_URL so
// per-branch shares preview the right deploy; local dev uses localhost.
export function metadataBase(): URL {
  return new URL(
    process.env.VERCEL_ENV === 'production'
      ? SITE_URL
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000',
  );
}

// The symposium Creative Trace was built for and shown at. url is the
// original New School event listing; archive is the Lab for AI, Ethics,
// & Creative Labor's project page, which outlives the listing.
export const FRICTIONS = {
  name: 'F(r)ictions: Creative Work in an Age of AI',
  url: 'https://event.newschool.edu/frictionscreativeworkinanageof',
  archive: 'https://www.aicreativelabor.com/project/frictions',
  date: '2026-05-01',
};

// The three makers, as schema.org Persons. Shoro's @id matches the
// Person node on shoro.space, so search engines can join the two sites.
export const CREATORS = [
  {
    '@type': 'Person',
    '@id': 'https://shoro.space/#person',
    name: 'Shoro Roy',
    url: 'https://shoro.space',
    sameAs: ['https://www.linkedin.com/in/royshoro/'],
  },
  {
    '@type': 'Person',
    name: 'Paola Machuca Hernández',
    sameAs: [
      'https://www.linkedin.com/in/pmachuca/',
      'https://www.behance.net/pmachucahdc16',
    ],
  },
  {
    '@type': 'Person',
    name: 'Yash Pawar',
    sameAs: ['https://www.linkedin.com/in/yash-pawar-94913b121/'],
  },
];

// Landing-page structured data: the site, and the tool as a free web
// application made at Parsons / The New School.
export function siteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        inLanguage: 'en',
      },
      {
        '@type': 'WebApplication',
        '@id': `${SITE_URL}/#app`,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        description: SITE_DESCRIPTION,
        image: `${SITE_URL}/api/og?landing=1`,
        applicationCategory: 'DesignApplication',
        operatingSystem: 'Any',
        browserRequirements: 'Requires JavaScript',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        inLanguage: 'en',
        dateCreated: '2026-04',
        keywords:
          'creative provenance, attribution, AI in art, creative labor, artists',
        creator: CREATORS,
        sourceOrganization: {
          '@type': 'CollegeOrUniversity',
          name: 'Parsons School of Design, The New School',
        },
        subjectOf: {
          '@type': 'Event',
          name: FRICTIONS.name,
          startDate: FRICTIONS.date,
          url: FRICTIONS.url,
          sameAs: [FRICTIONS.archive],
          eventStatus: 'https://schema.org/EventScheduled',
          location: {
            '@type': 'Place',
            name: 'The New School',
            address: 'New York, NY',
          },
          organizer: {
            '@type': 'Organization',
            name: 'Lab for AI, Ethics, & Creative Labor, Parsons School of Design',
            url: 'https://www.aicreativelabor.com',
          },
        },
        isBasedOn: {
          '@type': 'SoftwareSourceCode',
          codeRepository: 'https://github.com/ryo-67/creative-provenance',
        },
        isPartOf: { '@id': `${SITE_URL}/#website` },
      },
    ],
  };
}
