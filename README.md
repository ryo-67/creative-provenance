# Creative Provenance

A web-based interactive questionnaire that helps visual artists trace the chain of human, organizational, and AI contributions in a single piece of their work. The output is a unique abstract "fingerprint" visualization plus an AI-generated "Grace" — a prayer-style text listing everyone and everything that shaped the piece.

Built for the **F(r)ictions: Creative Work in an Age of AI** symposium, May 1, 2026, at The New School.

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

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS**
- **Zod** for schema validation
- **Anthropic Claude API** for Grace generation

## Project Structure

```
app/                    # Next.js App Router pages and API routes
components/
  questions/            # One component per questionnaire question
  fingerprint/          # SVG fingerprint visualization
  share/                # Share sheet and download
lib/
  schema.ts             # ProvenanceResponse type + Zod schema
  fingerprint-config.ts # Answer-to-visual-primitive mapping
  grace-prompt.ts       # System prompt for Grace generation
  storage.ts            # localStorage helpers
```

## Team

- Shoro Roy (technical lead)
- Paola Machuca Hernandez (visual system)
- Yash Pawar (visual system)

Ethics of AI, Parsons / The New School
