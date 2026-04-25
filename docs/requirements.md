# Creative Provenance — Requirements

## Project Summary

A web-based interactive questionnaire that helps visual artists trace the chain of human, organizational, and AI contributions in a single piece of their work. Output: a unique abstract "fingerprint" visualization plus an AI-generated "Grace" — a prayer-style text listing every contributor.

Built for the F(r)ictions: Creative Work in an Age of AI symposium on May 1, 2026.

## Core User Flow

1. **Landing page** — sets context, names the project, has one CTA: "Begin"
2. **Questionnaire** — 10 questions, ~5–7 minutes, mobile-responsive
3. **Loading state** — fingerprint composition + Grace generation (~3–8 seconds)
4. **Result page** — fingerprint, Grace, download/share, "begin again" option

## Target Audience

- **Primary**: working visual artists (illustrators, painters, sculptors, 3D artists, animators, mixed-media, fiber artists, printmakers)
- **Secondary**: symposium attendees (AIGA, SAG-AFTRA, Authors Guild, legal scholars, students)
- **Excluded scope**: commercial design (branding, logos, packaging, publication design)

## The 10 Questions

All questions anchor to one specific recent piece the user picks at Q1.

The questionnaire moves through three time horizons: the moment of starting (Q2), the period of making (Q3), and the years of training that shaped how the artist works (Q4). Each asks about different scales of contribution.

### Q1 — The piece
- **Format**: open text (1 sentence) + medium tag
- **Required**: yes
- **Schema**: `piece: { description: string, medium: MediumType, mediumOther?: string }`

Medium categories cover materially distinct ways of making:
- `painted` — drawn or painted on paper or canvas (illustration, watercolor, oil, acrylic, ink, gouache)
- `digital-2d` — digital illustration, photo manipulation, design
- `3d-digital` — CGI, modeling, digital sculpture, VR/AR
- `sculpted` — carved, sculpted, or built (clay, wood, metal, stone, found objects)
- `printed` — printmaking, risograph, screen print, letterpress, photography in print
- `fiber` — woven, sewn, or made of fiber (textile art, embroidery, weaving, soft sculpture)
- `motion` — animation, video, motion graphics, GIFs, interactive
- `mixed-media` — layered or hybrid (collage, assemblage)
- `other` — fallback with open text

### Q2 — The seed
- **Format**: multi-select with open fallback
- **Required**: yes (at least one)
- **Schema**: `seed: { types: SeedType[], other?: string }`

Twelve seed categories covering inner, structural, and external origins:
- `body` — something I needed to get out of my body
- `memory` — a memory that wouldn't leave me alone
- `image` — an image I saw that stuck
- `conversation` — a conversation that lit something up
- `obsession` — an obsession I keep returning to
- `technique` — a craving to try a new technique or material
- `constraint` — a brief, deadline, or leftover material
- `problem` — a problem to solve or answer to find
- `critique` — anger, grief, or critique of something in the world
- `chance` — a dream, accident, coincidence
- `unknown` — I honestly can't trace it
- `other` — open text fallback

### Q3 — The reference shelf
- **Format**: drag-to-stack on a spatial canvas (desktop) / three-bucket fallback (mobile + a11y)
- **Required**: yes
- **Schema**: `references: Array<{ id: ReferenceTileId, weight: number, position: { x: number, y: number } }>`
  - `weight`: 0 (not placed) to 1 (center, large)
  - `position`: normalized 0–1 canvas coordinates

Reference tiles are grouped (visually distinct sections in the UI) but data-flat:

*Other artists, attributed:*
- `artist-portfolios` — ArtStation, Behance, personal websites, monographs
- `curated-channels` — Are.na, Cosmos, mood boards, art books

*Algorithmic feeds:*
- `algorithmic-feeds` — Pinterest, Instagram, TikTok, explore tabs
- `search-results` — Google Images, visual search, hunting for something specific

*The world outside art:*
- `music` — what I was listening to
- `film-literature` — film, TV, theater, novels, poetry
- `built-environment` — architecture, the city, the built world
- `natural-world` — landscape, plants, animals, weather, light
- `heritage` — family, culture, inheritance
- `everyday-life` — daily life and the people in it

*Inside the artist's head:*
- `imagination` — mostly my own imagination

*AI-mediated:*
- `ai-moodboards` — AI-generated mood boards

### Q4 — The teachers
- **Format**: multi-select
- **Required**: yes (at least one)
- **Schema**: `teachers: Array<TeacherType>`

Teacher categories:
- `formal-education` — school or program
- `self-taught` — figured it out alone, internet as teacher
- `mentor` — specific mentor or master
- `copying` — copied artists until their moves became mine
- `critique` — crit room, group chat, the friend who never lies
- `apprenticeship` — apprenticeship or studio job
- `workshops` — workshops, residencies, intensives
- `ai-teacher` — AI tools that showed me technique by demonstrating it

### Q5 — The unintended ghosts
- **Format**: open text, optional
- **Required**: no (skippable)
- **Schema**: `ghost: { present: boolean, description?: string }`

### Q6 — AI as quiet helper
- **Format**: rapid yes/no checklist
- **Required**: yes (at least one option, including "none of these")
- **Schema**: `aiHelpers: Array<AIHelperType>`

Twelve quiet-helper categories:
- `background-removal` — background removal or smart subject selection
- `generative-fill` — generative fill, content-aware fill, or smart heal
- `auto-correction` — auto color correction, exposure, noise cleanup
- `upscaling` — upscaling or detail enhancement
- `search` — Google Images, visual search, "find similar"
- `autosuggest` — spell check, smart guides, snap-to, auto-align
- `retouching` — AI-assisted retouching (skin, sky, face)
- `rotoscoping` — object isolation or rotoscoping in video
- `transcription` — voice-to-text, auto-transcription, captions
- `recommendations` — generative font/palette/composition suggestions
- `auto-tagging` — auto-tagging or auto-organization in asset library
- `none` — none of these

### Q7 — AI as generator
- **Format**: branched sub-step flow (True/False gate, then 3 sub-steps if True). Each sub-step is one screen. URL stays at /questionnaire/7; Q7 renders its own Back/Next buttons.
- **Required**: yes (the branch is required if "true")
- **Schema**:
  ```typescript
  aiGenerator: {
    used: boolean;
    kinds?: Array<AIGenerationKind>;
    stage?: AIGenerationStage;
    trainingDataAwareness?: TrainingDataAwareness;
  }
  ```

AI generation kinds (multi-select, only if `used: true`):
- `text-to-image` — Midjourney, DALL-E, Stable Diffusion, Firefly
- `image-to-image` — style transfer, img2img, ControlNet (using my own work as a base)
- `3d-generation` — Meshy, Luma, CSM, generated textures
- `motion` — Runway, Pika, Kling
- `audio` — Suno, Udio, ElevenLabs
- `text` — concepts, titles, statements
- `other` — open text

AI generation stage (single-select, only if `used: true`):
- `concept-only` — starting point I didn't actually use in the file
- `reference` — drew over or used as base layer
- `composited` — composited, modified, or reworked into final
- `mostly-as-is` — generated and kept mostly as-is
- `all-ai` — whole piece started as AI output

Training data awareness (single-select, only if `used: true`):
- `no-idea` — haven't thought about it
- `artists-like-me` — suspect artists like me, without consent
- `specific-artists` — could name specific artists in there
- `licensed` — chose model trained on licensed/consenting data

### Q8 — Direction vs. execution
- **Format**: drag a dot on a 2D field between two illustrated poles
- **Required**: yes
- **Schema**: `directionExecution: { x: number, y: number }` — both normalized 0–1
  - Y-axis is reserved for V2 use; default to 0.5 in V1

### Q9 — The other hands
- **Format**: multi-select
- **Required**: yes (at least one, including "just-me")
- **Schema**: `collaborators: Array<CollaboratorType>`

Collaborator categories:
- `assistant` — studio assistant who handled what I couldn't get to
- `fabricator` — fabricator, printer, technician who turned my file into a thing
- `editor` — retoucher, colorist, editor who refined what I made
- `peer` — peer whose offhand comment changed direction
- `mentor` — mentor or teacher whose voice was in my head
- `model` — model, performer, person whose likeness is in this
- `commissioned-creator` — photographer, illustrator, or designer whose stock or commissioned work I built on
- `just-me` — nobody, just me

### Q10 — The verdict
- **Format**: drag a dot on a 2D field between two poles + optional text
- **Required**: yes for the dot, no for the text
- **Schema**: `ownership: { feltOwnership: number, why?: string }` — `feltOwnership` normalized 0–1

## Full Data Schema

```typescript
type MediumType =
  | 'painted'
  | 'digital-2d'
  | '3d-digital'
  | 'sculpted'
  | 'printed'
  | 'fiber'
  | 'motion'
  | 'mixed-media'
  | 'other';

type SeedType =
  | 'body'
  | 'memory'
  | 'image'
  | 'conversation'
  | 'obsession'
  | 'technique'
  | 'constraint'
  | 'problem'
  | 'critique'
  | 'chance'
  | 'unknown'
  | 'other';

type ReferenceTileId =
  | 'artist-portfolios'
  | 'curated-channels'
  | 'algorithmic-feeds'
  | 'search-results'
  | 'music'
  | 'film-literature'
  | 'built-environment'
  | 'natural-world'
  | 'heritage'
  | 'everyday-life'
  | 'imagination'
  | 'ai-moodboards';

type TeacherType =
  | 'formal-education'
  | 'self-taught'
  | 'mentor'
  | 'copying'
  | 'critique'
  | 'apprenticeship'
  | 'workshops'
  | 'ai-teacher';

type AIHelperType =
  | 'background-removal'
  | 'generative-fill'
  | 'auto-correction'
  | 'upscaling'
  | 'search'
  | 'autosuggest'
  | 'retouching'
  | 'rotoscoping'
  | 'transcription'
  | 'recommendations'
  | 'auto-tagging'
  | 'none';

type AIGenerationKind =
  | 'text-to-image'
  | 'image-to-image'
  | '3d-generation'
  | 'motion'
  | 'audio'
  | 'text'
  | 'other';

type AIGenerationStage =
  | 'concept-only'
  | 'reference'
  | 'composited'
  | 'mostly-as-is'
  | 'all-ai';

type TrainingDataAwareness =
  | 'no-idea'
  | 'artists-like-me'
  | 'specific-artists'
  | 'licensed';

type CollaboratorType =
  | 'assistant'
  | 'fabricator'
  | 'editor'
  | 'peer'
  | 'mentor'
  | 'model'
  | 'commissioned-creator'
  | 'just-me';

type ProvenanceResponse = {
  // Metadata
  id: string;                    // UUID v4, generated client-side
  createdAt: string;             // ISO 8601 timestamp
  version: '1.0.0';              // Schema version

  // Q1
  piece: {
    description: string;
    medium: MediumType;
    mediumOther?: string;
  };

  // Q2
  seed: {
    types: SeedType[];
    other?: string;
  };

  // Q3
  references: Array<{
    id: ReferenceTileId;
    weight: number;              // 0 to 1
    position: { x: number; y: number };  // 0 to 1, normalized
  }>;

  // Q4
  teachers: Array<TeacherType>;

  // Q5
  ghost: {
    present: boolean;
    description?: string;
  };

  // Q6
  aiHelpers: Array<AIHelperType>;

  // Q7
  aiGenerator: {
    used: boolean;
    kinds?: Array<AIGenerationKind>;
    kindOther?: string;
    stage?: AIGenerationStage;
    trainingDataAwareness?: TrainingDataAwareness;
  };

  // Q8
  directionExecution: {
    x: number;                   // 0 (director) to 1 (maker)
    y: number;                   // reserved, default 0.5
  };

  // Q9
  collaborators: Array<CollaboratorType>;

  // Q10
  ownership: {
    feltOwnership: number;       // 0 (not mine) to 1 (completely mine)
    why?: string;
  };
};
```

Validate with Zod at every boundary (form submission, API request, fingerprint generation).

## Fingerprint Visualization (V1)

A hardcoded symbolic system. Each answer maps to a visual primitive composed deterministically. No generative randomness in V1 — same answers produce same fingerprint.

### Composition Order (back to front)

1. **Background field** — affected by Q10 (felt ownership) clarity modifier
2. **Outer perimeter** — collaborator marks from Q9 (each type = one mark)
3. **Outer field** — references from Q3 positioned by their canvas coordinates, sized by weight
4. **Mid-layer textures** — teacher marks from Q4 as background marks
5. **Surface texture** — Q6 affects polish, Q7 (kinds + stage) affects pixelation/dithering
6. **Center core** — seed primitive from Q2
7. **Off-center ghost** — Q5 if present, faint, drifting
8. **Modifiers** — Q8 affects line quality, Q10 affects overall coherence

### Visual Primitives (placeholder until Paola/Yash deliver the real system)

The expanded categories require more visual primitives than the V1 placeholder list. Below is a placeholder mapping; the real visual system will be designed separately.

*Reference shelf primitives (Q3):*

| Source | Placeholder primitive |
|---|---|
| `artist-portfolios` | Soft organic blob, clean outline |
| `curated-channels` | Stacked rectangles |
| `algorithmic-feeds` | Scattered dot cluster |
| `search-results` | Crosshair / target shape |
| `music` | Wave form / ripple |
| `film-literature` | Rectangular frame, cinematic ratio |
| `built-environment` | Angular geometric form |
| `natural-world` | Organic curved shape |
| `heritage` | Symbolic motif (placeholder pattern) |
| `everyday-life` | Soft cloud shape |
| `imagination` | Solid filled core |
| `ai-moodboards` | Pixelated patch |

*Teacher primitives (Q4):*

| Teacher | Placeholder primitive |
|---|---|
| `formal-education` | Grid lines |
| `self-taught` | Hand-drawn squiggle |
| `mentor` | Single bold stroke |
| `copying` | Repeating motif |
| `critique` | Erasure marks |
| `apprenticeship` | Linked chain marks |
| `workshops` | Dense burst marks |
| `ai-teacher` | Faint vector outline |

*Seed primitives (Q2):*

| Seed | Placeholder primitive |
|---|---|
| `body` | Pulsing organic dot |
| `memory` | Blurred photographic blob |
| `image` | Sharp eye-shape or aperture |
| `conversation` | Speech bubble outline |
| `obsession` | Concentric rings |
| `technique` | Wireframe cube |
| `constraint` | Square stamp |
| `problem` | Question mark form |
| `critique` | Sharp angular spike |
| `chance` | Scattered dust marks |
| `unknown` | Empty circle outline |

### Output Format

- Rendered as inline SVG
- Exportable as PNG (1200x1200 default for social, 2400x2400 for print)
- Aspect ratio: 1:1 (square, works on Instagram and as a badge)

## Grace Generation

### System Prompt (working draft)

The Grace prompt should:

1. Frame Claude as composing a personal prayer-style acknowledgment
2. Provide all 10 answers as structured input
3. Instruct on tone: prayer-cadenced, specific, acknowledging the unattributed
4. Constrain length: 80–150 words
5. Forbid: religious doctrine, mockery, generic acknowledgments

A draft system prompt:

```
You compose a personal "Grace" — a prayer-style acknowledgment for a visual artist who has just traced the contributors to one piece of their work. The Grace lists, in cadenced language inspired by Catholic table grace, the people, organizations, tools, references, phenomena, and concepts that shaped the piece.

Constraints:
- Length: 80–150 words
- Tone: contemplative, specific, acknowledging the unattributed (training data, algorithmic feeds, the unnamed person in Q5's "ghost" if present)
- Cadence: rhythmic, prayer-like, but not religiously doctrinal
- Avoid: generic acknowledgments ("thank you to all the artists"), mockery of religion, AI-product language

Name specifics where the user provided them. Where the user named a category, render it concretely (e.g., "Pinterest" not "social media"). Hold the tension of Q10 — if the user feels the piece is barely theirs, the Grace should reflect that uncertainty. If they feel it is wholly theirs, the Grace should still surface the silent contributors.

Begin: "For [the piece description from Q1], thanks be given..." or similar.

End: a single line that holds the felt ownership tension.
```

The actual prompt will be tuned heavily during Week 13.

### API Implementation

- Endpoint: `/api/grace` (Next.js API route)
- Method: POST with `ProvenanceResponse` body
- Returns: `{ grace: string }`
- Model: `claude-sonnet-4-6`
- Max tokens: 400
- API key: `process.env.ANTHROPIC_API_KEY`

### Anti-Abuse

- Rate limit: 1 Grace per IP per 5 minutes
- Implementation: in-memory Map for V1, Vercel KV for V2
- Cache the Grace in localStorage so repeat visits don't regenerate
- If the API call fails, show a fallback Grace (a generic but still meaningful version)

## Sharing and Export

### Download
- PNG export of the fingerprint at 2400x2400
- File name: `creative-provenance-{timestamp}.png`
- Always visible as primary CTA

### Native Share (mobile)
- Web Share API (`navigator.share()`)
- Share payload: `{ title: "My Creative Provenance", text: "[Grace excerpt]", files: [PNG] }`
- Falls back to download if share API unavailable

### Copy Link (V2)
- Generates unique URL with response ID
- Requires Supabase or Vercel KV backend
- Not in V1 scope

## Mobile Responsiveness

Required on:
- iOS Safari (latest 2 versions)
- Android Chrome (latest 2 versions)
- Mobile breakpoints: 375px, 414px, 768px

Specific concerns:
- Q3 canvas: touch events differ from mouse; use Pointer Events API or polyfill
- Q3 has many tiles (~12) — on mobile, the canvas is replaced with the three-bucket multi-select fallback
- Q8/Q10 dots: must work with thumb-drag on small screens
- Fingerprint render: must be readable at 375px wide
- Grace text: must be selectable and copyable on mobile

Fallbacks:
- Q3 falls back to three-bucket selection on screens under 600px wide OR for keyboard-only users

## Accessibility (WCAG 2.1 AA)

- Keyboard navigation throughout
- Screen reader compatibility (aria-labels, semantic HTML)
- Color contrast ≥ 4.5:1 for text, 3:1 for UI elements
- Focus indicators visible
- No flashing content
- Alternative input for Q3 (drag) and Q8/Q10 (drag)
- Grace text rendered as native HTML, not embedded in image

## Privacy

V1: no accounts, no analytics, no tracking. Responses live in localStorage only.

V2 (when shareable URLs ship): clear consent screen explaining that the response will be stored anonymously to enable URL sharing.

Privacy policy required before launch even for V1, since the Claude API call sends user input to Anthropic. Brief, plain-language statement on landing page.

## Browser Support

- Chrome 110+
- Safari 16+ (iOS and macOS)
- Firefox 110+
- Edge 110+

No IE support. No older mobile browser support.

## Performance Targets

- Time to interactive on 4G: < 3 seconds
- Questionnaire completion: ~5–7 minutes
- Fingerprint render: < 1 second after submission
- Grace generation: < 8 seconds (network-dependent)
- Lighthouse score: ≥ 90 on all metrics

## Out of Scope for V1

- User accounts and login
- Saved sessions across devices
- Shareable URLs to specific fingerprints
- Multiple language support
- Email-the-result functionality
- Embeddable widget
- Print-on-demand integration
- Comparing fingerprints across users
- Aggregate data analysis
- Adobe Content Authenticity Initiative integration
- Generative variation in fingerprint composition

These are V2+ ideas worth tracking but not building now.

## Symposium-Specific Considerations

The site will be displayed at the F(r)ictions symposium on May 1, 2026.

- Display setup: laptop or iPad on a table, plus printed fingerprints from test users as wall display
- QR code on the printed display links to the live site
- Need a brief project label/placard: title, group members, 2–3 sentence description
- Site must work on slow venue WiFi (test offline behavior — fingerprint should still render even if Grace API fails)

## Open Questions to Resolve Before Launch

1. Final visual system from Paola and Yash — replaces the placeholder primitives. The expanded reference and seed categories require more primitives than V1 originally accounted for.
2. Domain name decision (creativeprovenance.art, .io, or .vercel.app subdomain)
3. Privacy policy text — needs legal review or template
4. Symposium display format — physical printouts? Live demo only? Both?
5. Whether to include a brief intro animation or land directly on "Begin" CTA
6. Whether Q3's reference tiles should appear visually grouped (sections with labels) or as a flat set on the canvas
