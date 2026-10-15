// Site identity shared by metadata, robots, sitemap and structured data.
//
// SITE_URL is the canonical origin: the apex domain, no www. Canonical
// links, the sitemap and the JSON-LD always point here, whatever host
// served the request (www, the legacy creative-provenance.vercel.app
// URL, or a preview deploy).

export const SITE_URL = 'https://creativetrace.art';

export const SITE_NAME = 'Creative Trace';

// The one-line pitch under the wordmark, on the landing page and in
// both OG cards.
export const SITE_TAGLINE = 'Map the full chain of influences behind your work.';

// What a person sees when they share their result: the link preview's
// title and description, and the native share sheet.
export const SHARE_TITLE = 'My Creative Trace';
export const SHARE_TEXT = 'See the creative provenance of my work.';

// The result page's heading (and tab title when the piece has no
// description), and the line under it, which is also its meta description.
export const RESULT_TITLE = 'Your Tracemark';
export const RESULT_SUBTITLE = 'A visual map of everything that shaped this piece.';

// For pages that stay out of search: personal results and the Tally
// iframe. `follow` stays on so crawlers still reach the landing page.
export const NOINDEX = { index: false, follow: true };

// Search-result and link-preview title for the landing page. Leads with
// the name, then the words artists search with ("AI disclosure",
// "disclose AI use in my art"); nobody searches "creative provenance".
// "Beyond yes or no" is the difference from every other AI label. Kept
// under ~60 characters so Google shows it whole.
export const SITE_TITLE = 'Creative Trace · AI disclosure for art, beyond yes or no';

// Search-result and link-preview description. Opens with the search
// phrase, says what the tool credits, and ends on who made it, for
// visitors arriving from a portfolio. Kept under ~160 characters so
// Google shows it whole.
export const SITE_DESCRIPTION =
  'Disclose AI use in your art without a yes-or-no label. Ten questions credit the people, references, tools and AI behind one piece. Free, made at Parsons.';

// The landing page's link-preview image (app/api/og) and its size, also
// the size of every OG card.
export const LANDING_OG_IMAGE = '/api/og?landing=1';
export const OG_IMAGE_SIZE = { width: 1200, height: 630 };

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

// Where Creative Trace was made. The JSON-LD and llms.txt name the
// school; the footer and llms.txt name the course.
export const SCHOOL = 'Parsons School of Design, The New School';
export const COURSE = 'Ethics of AI, Spring 2026';

// The public source code, linked from the JSON-LD and llms.txt.
export const SOURCE_REPO_URL = 'https://github.com/ryo-67/creative-provenance';

// What happens to a person's answers, on the landing page and in
// llms.txt.
export const DATA_USE =
  'Your questionnaire responses are stored by Tally, our form provider. To generate your Grace, your responses are sent to Anthropic’s Claude. Your data is not used for model training, advertising, or any purpose beyond generating your Tracemark. We do not collect your name, email, or any contact information.';

// Creative Trace's entry on shoro.space. It is a record of the shared
// project, filed on Shoro's portfolio, not a team write-up. Link by
// slug and never print its record number: shoro.space numbers records
// by date and renumbers them when an older one is added.
export const PROJECT_RECORD_URL = 'https://shoro.space/records/creative-trace';

// The three makers, in credit order. The footer and the structured data
// (siteJsonLd) are both built from this list. The order and the equal credit
// change only with all three makers' agreement.
export const TEAM = [
  {
    name: 'Shoro Roy',
    linkedin: 'https://www.linkedin.com/in/royshoro/',
    portfolio: 'https://shoro.space',
    // The Person node shoro.space publishes, so search engines can join
    // the two sites.
    schemaId: 'https://shoro.space/#person',
  },
  {
    name: 'Paola Machuca Hernández',
    linkedin: 'https://www.linkedin.com/in/pmachuca/',
    portfolio: 'https://www.behance.net/pmachucahdc16',
  },
  {
    name: 'Yash Pawar',
    linkedin: 'https://www.linkedin.com/in/yash-pawar-94913b121/',
    portfolio:
      'https://drive.google.com/file/d/14z5NZuvuJO-m2JSc6l4Nv3llfhFfjmLV/view?usp=share_link',
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
        image: `${SITE_URL}${LANDING_OG_IMAGE}`,
        applicationCategory: 'DesignApplication',
        operatingSystem: 'Any',
        browserRequirements: 'Requires JavaScript',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        inLanguage: 'en',
        dateCreated: '2026-04',
        keywords:
          'AI disclosure, AI in art, AI-assisted art, art attribution, crediting influences, creative provenance, creative labor, artists',
        creator: TEAM.map((person) => ({
          '@type': 'Person',
          ...('schemaId' in person && { '@id': person.schemaId }),
          name: person.name,
          url: person.portfolio,
          sameAs: [person.linkedin],
        })),
        sourceOrganization: {
          '@type': 'CollegeOrUniversity',
          name: SCHOOL,
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
          codeRepository: SOURCE_REPO_URL,
        },
        isPartOf: { '@id': `${SITE_URL}/#website` },
      },
    ],
  };
}
