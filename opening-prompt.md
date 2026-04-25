# Opening Prompt for Claude Code

Copy and paste this into your first Claude Code session to set up the project. After this initial setup, every subsequent session should start by referencing CLAUDE.md.

---

## The Prompt

```
I'm building a project called Creative Provenance — a web-based interactive questionnaire that helps visual artists trace the chain of contributions in their work and produces a unique abstract "fingerprint" plus an AI-generated "Grace" prayer. It will be displayed at the F(r)ictions symposium at The New School on May 1, 2026.

I've prepared two key documents that should drive every decision in this project:

1. CLAUDE.md — persistent context and architectural principles (read this at the start of every session)
2. requirements.md — detailed feature spec, data schema, and constraints

Both files are in the project root. Please read them in full before doing anything else.

For this first session, I need you to:

1. Read CLAUDE.md and requirements.md carefully
2. Set up the Next.js 15 project with TypeScript, Tailwind CSS, and App Router
3. Initialize a git repository
4. Create the file structure described in CLAUDE.md (just the directories and empty placeholder files for now)
5. Create /lib/schema.ts with the full ProvenanceResponse type and a Zod schema validator
6. Create a minimal /app/page.tsx as the landing page with placeholder copy
7. Configure the project for Vercel deployment (no actual deploy yet — just make sure the config is right)
8. Set up environment variable handling for ANTHROPIC_API_KEY (in .env.local, not committed)
9. Add a README.md with quick-start instructions
10. Verify everything builds with `npm run build`

Constraints:
- Do not install any packages beyond what's in CLAUDE.md (Next.js, TypeScript, Tailwind, Zod, Framer Motion when needed)
- Do not start building questions or the fingerprint yet — that's the next session
- Do not add analytics, auth, or any tracking
- Use TypeScript strict mode
- Tailwind config should be minimal — just the defaults, no custom theme yet

When you're done, give me a checklist of what's working, what's not, and what I need to do manually (like creating a Vercel project or getting an Anthropic API key).

Tell me if anything in CLAUDE.md or requirements.md is unclear or contradictory before you start writing code.
```

---

## What to Expect After This First Session

Claude Code should produce:

1. A working Next.js project that builds successfully
2. The data schema as the first real code (everything else depends on it)
3. A landing page placeholder
4. A README explaining how to run the project
5. A clear list of next steps and any open questions

## Follow-Up Prompts (For Subsequent Sessions)

After the initial setup, structure your sessions around one feature at a time. Good prompts look like:

**Session 2 — Page routing and state:**
```
Read CLAUDE.md. Today I want to build the questionnaire page navigation and global state management. The state should hold a partial ProvenanceResponse object, persist to localStorage on every change, and let any component update it via a context provider. Build:
1. /app/questionnaire/page.tsx that renders the current question based on state
2. A QuestionnaireProvider context in /lib/context.tsx
3. localStorage persistence helpers in /lib/storage.ts
4. Navigation buttons (back/next) that move through questions

Don't build any actual question components yet — use placeholder divs that show which question would render. I'll review before we add the real questions.
```

**Session 3 — First simple question:**
```
Read CLAUDE.md and /lib/schema.ts. Build the Q2 (seed) component as a single-select radio group with an "other" text fallback. Match the design pattern we'll use for all single-select questions. Make it mobile-responsive. Make it keyboard-navigable. Test it by wiring it into the questionnaire flow.
```

**Session 4 — The harder questions:**
```
Read CLAUDE.md and the requirements.md section on Q3. Build the spatial canvas for Q3. Use Pointer Events for cross-platform touch/mouse support. Implement the three-bucket fallback for screens under 600px. The output must match the schema in /lib/schema.ts.
```

And so on. One feature, one session. Always start with "Read CLAUDE.md."

## Important Setup Steps You Need to Do Manually

These are not things Claude Code can do for you:

1. **Create an Anthropic API key**
   - Go to https://console.anthropic.com
   - Generate an API key
   - Add it to `.env.local` as `ANTHROPIC_API_KEY=sk-ant-...`
   - Never commit `.env.local` to git

2. **Create a Vercel project**
   - Sign up at https://vercel.com (free tier is fine)
   - Connect your GitHub repo when ready
   - Add `ANTHROPIC_API_KEY` as an environment variable in Vercel dashboard

3. **Decide on a domain**
   - Default: `creative-provenance.vercel.app` (free)
   - Custom: register through Vercel or any registrar (~$12/year)

4. **Set up a GitHub repo**
   - Create a private repo
   - Push the initial commit after Claude Code finishes setup

## Cost Tracking

Keep an eye on:
- Anthropic API usage (https://console.anthropic.com — set a usage cap of $20/month)
- Vercel bandwidth (free tier is 100GB/month — plenty for the symposium)
- Domain renewal (annual)

## When Things Go Wrong

If Claude Code is doing something wrong, the fastest fix is usually:
1. Stop the session
2. Roll back to the last working commit (`git reset --hard HEAD~1`)
3. Start a new session with a tighter, more specific prompt
4. Reference the exact file and behavior you want changed

Don't try to argue Claude Code out of a bad path mid-session. It's faster to start fresh.

If you hit a real bug you can't solve, isolate it: create a minimal reproduction, paste it into a new Claude Code session, and ask for that specific bug to be fixed. Don't ask Claude Code to debug the whole app.

## Calibration After This First Session

After Claude Code finishes setup, evaluate:

- Does the project build cleanly with `npm run build`?
- Is the schema in `/lib/schema.ts` correct (check against requirements.md)?
- Is the file structure clean and matching CLAUDE.md?
- Are there any unexpected dependencies in `package.json`?

If all four are yes, you're ready for Session 2. If any are no, send a tightly-scoped follow-up prompt to fix exactly that issue before moving on.
