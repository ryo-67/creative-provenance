# Creative Trace

A web-based interactive questionnaire that helps visual artists trace the chain of human, organizational, and AI contributions in a single piece of their work. The output is a unique abstract "fingerprint" visualization plus an AI-generated "Grace" — a prayer-style text listing everyone and everything that shaped the piece.

Built for the **F(r)ictions: Creative Work in an Age of AI** symposium, May 1, 2026, at The New School.

## Live Deployment

**Production:** [creativetrace.art](https://creativetrace.art/)

The old Vercel URL [creative-provenance.vercel.app](https://creative-provenance.vercel.app/) is intentionally preserved as a live redirect to creativetrace.art (handled at the Vercel/DNS level).

- Push to `main` triggers a production deploy automatically
- Push to any other branch creates a preview deploy with its own URL
- `ANTHROPIC_API_KEY` must be set in Vercel environment variables (Production, Preview, and Development) for Grace generation to work

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Add your Anthropic API key to .env.local
# (required for Grace generation, not needed for development of other features)

# Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS**
- **Zod** for schema validation
- **Anthropic Claude API** for Grace generation
- **Lucide React** for icons

## Project Structure

```
app/
  page.tsx                # Landing page
  questionnaire/          # Tally embed
  result/                 # Tracemark + Grace result page
  api/grace/              # Claude API proxy
  api/tally-submission/   # Tally REST fetch + mapping
  api/og/                 # OG image renderer
components/
  Tracemark.tsx           # SVG grid visualization
lib/
  schema.ts              # ProvenanceResponse type + Zod
  tally.ts               # Tally API integration + mapping
public/patterns/          # 12 seed pattern SVGs
docs/                     # Project documentation
```

## Team

- Shoro Roy (technical lead)
- Paola Machuca Hernandez (visual system)
- Yash Pawar (visual system)

Ethics of AI, Parsons / The New School
