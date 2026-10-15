import {
  COURSE,
  DATA_USE,
  FRICTIONS,
  PROJECT_RECORD_URL,
  SCHOOL,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
  SOURCE_REPO_URL,
  TEAM,
} from '@/lib/site';

// /llms.txt: a Markdown summary of the site for AI assistants and answer
// engines (the llmstxt.org format: a title, a one-line summary, then
// sections of links). Built from lib/site.ts so it never drifts from the
// metadata, footer and JSON-LD. Static: rendered once at build time.
export const dynamic = 'force-static';

const symposiumDate = new Date(`${FRICTIONS.date}T00:00:00Z`).toLocaleDateString(
  'en-US',
  { dateStyle: 'long', timeZone: 'UTC' },
);

const makers = TEAM.map(
  (person) => `- [${person.name}](${person.portfolio}) ([LinkedIn](${person.linkedin}))`,
).join('\n');

const LLMS_TXT = `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

${SITE_TAGLINE} ${SITE_NAME} is a free questionnaire for visual artists: illustrators, painters, sculptors, 3D artists, animators, printmakers, fiber and mixed-media artists. It asks ten questions about one finished piece: the medium, where the idea came from, the references and teachers behind it, any AI tools used to help or to generate, who else worked on it, and how much of it feels like the artist's own.

The answers produce two things:

- A Tracemark: an abstract square mark that encodes where the piece came from. The same answers always produce the same mark, so artists can post it beside the work, on a portfolio, or in an exhibition label.
- A Grace: a short text, written by Claude from the answers and framed like a grace said before a meal, thanking each person, reference, tool and AI system that fed the piece. It ends with how much of the piece the artist feels is theirs.

${SITE_NAME} is not a refusal tool like Glaze, Nightshade or NoAI tags, and not a detector that labels work as AI or not AI. It gives artists words for what's theirs in a piece that people, references and AI all touched, where other AI disclosure is a yes-or-no label.

${DATA_USE}

## Use it

- [${SITE_NAME}](${SITE_URL}/): what it is and how it works
- [Trace your work](${SITE_URL}/questionnaire): the questionnaire (a Tally form)

## Made by

Made with equal credit by:

${makers}

Created in ${COURSE}, at ${SCHOOL}, for ${FRICTIONS.name}, a symposium at The New School on ${symposiumDate}.

## More

- [Project record](${PROJECT_RECORD_URL}): ${SITE_NAME} on Shoro Roy's portfolio
- [Source code](${SOURCE_REPO_URL})
- [${FRICTIONS.name}](${FRICTIONS.archive}): the symposium's archive page
`;

export function GET() {
  return new Response(LLMS_TXT, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
