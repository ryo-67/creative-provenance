import { NextResponse } from 'next/server';
import type { ProvenanceResponse } from '@/lib/schema';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 500;

const SYSTEM_PROMPT = `You write graces. A grace is a prayer said before a meal — a moment to pause and name what was given to you before you take the first bite.

You will receive a JSON object describing a creative work and everything that fed it: what the piece is, how it began, what the maker soaked in, who taught them, whether a ghost haunts it, what AI tools were involved, who else shaped it, and how much ownership the maker feels.

Write a grace for this piece. Rules:

- Each line begins with "Thank you to..." or "Thank you for..."
- One line per distinct contribution source. Be specific — use the actual details from the submission, not generic placeholders.
- Bold the specific thing being thanked in each line using **markdown bold**. For example: Thank you to **your toxic ex**, whose presence in this work you neither invited nor could stop.
- If there's a ghost (ghost.present=true), name it using ghost.description. Keep the maker's words.
- If AI was used (aiGenerator.used=true), acknowledge both the tool and the training data tension (aiAwareness field).
- If collaborators are present, thank them.
- The last two lines are always about felt ownership. Format:
  "You feel this piece is [natural language of feltOwnership score 1-10]."
  "Sit with that."

  feltOwnership mapping:
  1-2: "not really yours"
  3-4: "only partly yours"
  5-6: "half yours"
  7-8: "almost entirely yours"
  9-10: "completely yours"

- Keep it short: 5-9 "thank you" lines plus the ownership closing.
- No preamble, no sign-off, no explanation. Just the grace.
- Each line should be on its own line.
- Do not use the word "Amen."
- Tone: warm, direct, unflinching. Mirror, don't judge.`;

interface AnthropicTextBlock {
  type?: string;
  text?: string;
}

interface AnthropicResponse {
  content?: AnthropicTextBlock[];
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not set' },
      { status: 500 },
    );
  }

  let body: { submission?: Partial<ProvenanceResponse> };
  try {
    body = (await request.json()) as {
      submission?: Partial<ProvenanceResponse>;
    };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const submission = body.submission;
  if (!submission || typeof submission !== 'object') {
    return NextResponse.json(
      { error: 'Missing submission in request body' },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        // The system prompt is long and stable across users; mark it cacheable
        // so repeat traffic only pays for the user-specific JSON tokens.
        system: [
          {
            type: 'text',
            text: SYSTEM_PROMPT,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [
          {
            role: 'user',
            content: JSON.stringify(submission, null, 2),
          },
        ],
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      return NextResponse.json(
        {
          error: `Anthropic API error ${res.status}: ${errBody.slice(0, 500)}`,
        },
        { status: 500 },
      );
    }

    const json = (await res.json()) as AnthropicResponse;
    const grace =
      json.content?.find((b) => b.type === 'text')?.text?.trim() ?? '';

    if (!grace) {
      return NextResponse.json(
        { error: 'Anthropic returned no grace text' },
        { status: 500 },
      );
    }

    return NextResponse.json({ grace });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
