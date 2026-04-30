# Changelog

## Session 24 -- 2026-04-30 -- Inline seed pattern overlay in OG Patch 1
- **Patch 1 in OG previews now carries the seed pattern**, not just the medium fill. Previously the pattern was omitted because Satori (the engine `ImageResponse` runs on) does not load external `<image href>` refs and does not parse `dangerouslySetInnerHTML` strings — Satori turns JSX into a tree at render time, so the only way in is real JSX children.
- **`app/api/og/route.tsx` `getPatternPaths(seedType, baseUrl)`**: edge-runtime async helper. Fetches `/patterns/${file}.svg` (the schema's `chance` literal maps to `pattern-dream.svg`, mirroring `components/Tracemark.tsx`), strips `<defs>...</defs>` (so the clipPath rect inside isn't picked up as a renderable element), then regex-extracts each `<path>` element's `d` / `stroke` / `stroke-width` / `stroke-miterlimit` / `fill` attributes into a `PatternPath[]`. Per-warm-instance `PATTERN_CACHE: Map<string, PatternPath[] | null>` — `null` is cached too, so a missing file doesn't re-fetch every request. All errors caught and logged; falls back to no pattern.
- **`buildOgBaseUrl()`**: same precedence as `result/page.tsx`'s `metadataBase` — `creativetrace.art` when `VERCEL_ENV === 'production'`, else `VERCEL_URL`, else `localhost:3000`.
- **`TracemarkSVG`**: signature now takes `patternPaths: PatternPath[] | null` alongside `data`. In the Patch 1 group, between the medium fill rect and the boundary stroke rect, the parsed paths render inside `<g transform="translate(-2.11,-2.11) scale(1.02344)">` — same oversize/offset trick the live `<image>` overlay uses. Pattern viewBox is 180×180 with a built-in 6px border at corner 2.06; scaling by 184.22/180 ≈ 1.02344 then translating by -2.11 lands the pattern border on Patch 1's boundary stroke center. The boundary stroke is drawn after the pattern, so it sits on top of any sub-pixel bleed at the edges (no clip-path needed).
- **Why parse instead of `dangerouslySetInnerHTML`**: Satori does not parse arbitrary HTML strings — it consumes the JSX tree React passes it. The user's brief flagged this as the documented fallback path; jumping straight to it.
- **GET handler**: derives `seedType` from `data.seed?.types?.[0]` (works for both real submissions and `SAMPLE_DATA`), awaits `getPatternPaths(seedType, buildOgBaseUrl())` before constructing the JSX, passes the result through to `TracemarkSVG`.
- **Error path unchanged**: failed pattern fetch logs and returns null; Patch 1 falls back to solid medium color (the previous behavior). Doesn't crash the OG handler.
- Build + lint clean.

## Session 23 -- 2026-04-29 -- Move OG image off file convention to /api/og
- **Root cause**: Next.js 16's `opengraph-image.tsx` file convention does NOT receive `searchParams` — only route params. Our handler was reading `searchParams.sid`, which was always `undefined`, so every request fell through to a 500 (or to the SAMPLE_DATA fallback with a blank piece description, depending on which guard hit). The convention is architecturally wrong for our case because the sid is a query string, not a path segment.
- **`app/api/og/route.tsx` (new)**: regular GET route handler with `export const runtime = 'edge'`. Reads `sid` via `new URL(request.url).searchParams.get('sid')` (the route-handler shape we own fully). Wraps the entire body in try/catch — inner catch handles a failed Tally fetch and falls back to `SAMPLE_DATA`; outer catch handles Satori or `ImageResponse` failures and returns a 500 with `console.error` logging the message + stack so Vercel logs show the underlying cause. All Tracemark constants, `TracemarkSVG`, and the OG layout are moved over verbatim from the old file (Satori shorthand fixes from session 22 preserved).
- **`app/api/og/route.tsx` is `.tsx`, not `.ts`**: the file contains JSX, so the Turbopack parser needs the `.tsx` extension. Next.js App Router accepts `route.tsx` for route handlers — same convention as `route.ts`, just with JSX support.
- **`app/result/opengraph-image.tsx` deleted**: the file-convention version was broken; removing it stops the framework from registering `/result/opengraph-image` as a route. Route table now shows `ƒ /api/og` instead.
- **`app/result/page.tsx` `generateMetadata`**:
  - `openGraph.images` and `twitter.images` URLs changed from `/result/opengraph-image?sid=…` to `/api/og?sid=…`.
  - Added `metadataBase` override that points at `https://creativetrace.art` when `VERCEL_ENV === 'production'`. Preview deploys still use `VERCEL_URL`; local dev still uses `http://localhost:3000`. The root layout's metadataBase uses VERCEL_URL even in prod (which would resolve to a deployment-specific subdomain instead of the apex), so this override is required for crawlers to see absolute creativetrace.art URLs.
  - Updated comment block to reflect the new architecture.
- **Verification**: `npm run build` route table shows `ƒ /api/og` and no `/result/opengraph-image`. After deploy, hitting `https://creativetrace.art/api/og?sid=X54LzlP` should return a PNG; `<meta property="og:image">` on `/result?sid=X` should be `https://creativetrace.art/api/og?sid=X`.
- Build + lint clean.

## Session 22 -- 2026-04-29 -- Kill self-fetch, harden OG image for Satori
- **Root cause**: the OG renderer at `/result/opengraph-image?sid=…` was 500ing on Vercel. Both it and `app/result/page.tsx`'s `generateMetadata` were doing internal HTTP hops back to `/api/tally-submission?sid=…` to read the submission. Internal self-fetch is fragile on Vercel — deployment-URL races, edge↔Node runtime gaps, missing auth on the inner request, and rate-limit interactions all surface as opaque 500s. The fix is to skip the HTTP hop entirely and call the Tally pipeline directly.
- **`lib/tally.ts`**: new `fetchAndMapSubmission(sid)` export that wraps `fetchSubmission` + `mapTallyToProvenance` into one call. Errors propagate (no internal try/catch) so the API route can preserve its 404-vs-500 distinction. Edge-safe — only uses `fetch`, `process.env`, and `console.warn`.
- **`app/api/tally-submission/route.ts`**: replaced the inline `fetchSubmission` + `mapTallyToProvenance` pair with a single call to `fetchAndMapSubmission`. Existing try/catch and 404/500 status handling unchanged from the client's perspective.
- **`app/result/opengraph-image.tsx`**: removed the `fetch(VERCEL_URL/api/tally-submission)` call and the `baseUrl` plumbing; now imports `fetchAndMapSubmission` directly. Wrapped the entire handler in an outer try/catch that `console.error`s the message + stack before rethrowing — so future failures show up in Vercel logs as the actual cause instead of a generic 500.
- **Satori-compatibility audit (same OG file)**: fixed two violations that could trigger silent rendering failures.
  - `padding: '80px 40px 40px 40px'` (CSS shorthand string) → `paddingTop / Right / Bottom / Left` individual properties.
  - `flex: 1` on the right column → explicit `width: 570` (1200 − 630 left col). Satori is happier with concrete pixel dimensions than flex-shorthand basis-0 inference.
  - Also broke `padding: 45` on the left column into individual properties for consistency.
  - Other Satori invariants verified: every multi-child container has `display: 'flex'`, all dimensions are pixels (no %, no `auto`), no `gap` on flex containers (margins used instead), and the inline `<svg>` only uses `<rect>`, `<line>`, `<polygon>` with attributes Satori supports.
- **`app/result/page.tsx`** (`generateMetadata`): same self-fetch pattern was here too — refactored to call `fetchAndMapSubmission` directly. Dropped `baseUrl` and the `ProvenanceResponse` type import (no longer needed). On failure, `console.error`s the sid + message so the dynamic-title degradation is at least visible.
- Build + lint clean.

## Session 21 -- 2026-04-29 -- Per-route tab titles, dark mode backlog entry
- **`app/layout.tsx` metadata**: title is now an object — `{ default: 'Creative Trace', template: '%s · Creative Trace' }`. Routes that export their own title get suffixed with " · Creative Trace" automatically; routes that don't fall back to the default. Description updated to "Map the full chain of influences behind your work." (matches the landing subtitle). Also hoisted `metadataBase` to root (was previously only on `/result`) — silences the "metadataBase not set" warning that fired during static prerender of `/`, `/_not-found`, and `/questionnaire`. Every route now inherits the absolute base URL.
- **`app/result/page.tsx`**: removed the now-redundant `metadataBase` from `generateMetadata` (inherited from root layout). Kept `baseUrl` as a local since the submission fetch still needs the absolute URL.
- **`app/page.tsx`**: no title export — uses the layout default, so the landing tab title stays "Creative Trace".
- **`app/questionnaire/page.tsx`**: dropped `'use client'` (no client-only hooks present; `next/script` works in server components in App Router) and added `export const metadata: Metadata = { title: 'Trace your work' }`. The tab now reads "Trace your work · Creative Trace".
- **`app/result/page.tsx` `generateMetadata`**: now fetches the submission via the same `/api/tally-submission?sid=` route the OG renderer uses (Node runtime here, edge there — different lifecycles, no shared cache). When `piece.description` resolves, title is `Tracemark for ${description}`; otherwise `Your Tracemark`. Both flow through the layout template, so the rendered tab is "Tracemark for … · Creative Trace" or "Your Tracemark · Creative Trace". Lifted `baseUrl` out so it's reused for the metadataBase URL and the fetch.
- **`docs/backlog.md`**: new "Dark mode support" entry under "Visual polish" section. Captures why dark mode is non-trivial (light fills disappearing on dark, pattern SVG black strokes, Grace box bg calibration, the stray `dark:bg-zinc-950` on the questionnaire iframe wrapper) and the implementation requirements (WCAG AA contrast testing, Tracemark inversion question, Grace box redesign, pattern SVG handling). Marked as deferred — multi-session pass, not symposium-scope.
- Build + lint clean.

## Session 20 -- 2026-04-29 -- Open Graph image for /result?sid={sid}
- **`app/result/opengraph-image.tsx` (new)**: Next.js 16 file-convention OG renderer using `next/og` `ImageResponse`. Edge runtime, 1200×630, content-type image/png. On a request, reads `sid` from `searchParams`; if present, fetches the submission via the existing `/api/tally-submission?sid=` endpoint and renders the actual Tracemark. On no-sid or fetch failure, falls back to a hardcoded `SAMPLE_DATA` (painted medium, traditional teachers, no AI) so the link preview still looks like a Creative Trace mark instead of a generic placeholder.
- **Inline `TracemarkSVG`**: the patch geometry, color constants, and per-patch JSX are duplicated into the OG file (rather than imported from `components/Tracemark.tsx`) because Satori — the engine `ImageResponse` runs on — works best with self-contained inline markup and doesn't share React's state/transition primitives. All 9 patches render with the same colors, strokes, and 1080-equivalent geometry as the live component.
- **Patch 1 pattern omitted in OG (TODO phase 2)**: Satori does not load external `<image href>` refs, so Patch 1 in the OG renders as a solid medium color without the seed-pattern overlay. The other 8 patches carry the visual identity at 540×540. Phase 2 path is to fetch the pattern SVG file as text at edge runtime, parse it, and inline its content; deferred behind a TODO comment.
- **OG layout**: 1200×630 white background, two-column flex. Left column (630×630) holds the Tracemark centered with 45px padding. Right column (~570 wide) shows the "Creative Trace" wordmark (48px, weight 700, `#37352F`), the tagline "Map the full chain of influences behind your work." (24px, `#666`), and — if the submission has a piece description — the description prefixed `for:` at the bottom (18px italic, `#999`). System font fallback (no custom font loading for v1).
- **`app/result/page.tsx` refactored from client to server**: previously was a `'use client'` file. Split into:
  - `app/result/result-content.tsx` — `'use client'`, contains all the existing fetch/grace/download/share logic and renders the page body.
  - `app/result/page.tsx` — server component, exports `generateMetadata` (sets `<title>`, description, `openGraph` image, and `twitter` card with `summary_large_image`), and the default `ResultPage` which renders `<SiteHeader />` + `<Suspense>` around `<ResultContent />`.
- **Metadata tags**: with `generateMetadata` the result page now emits explicit OG title/description/image and Twitter card meta tags into the document head before client hydration. The Next.js 16 `opengraph-image.tsx` file convention also auto-emits the `og:image` reference; the explicit `images` arrays cover Twitter and any consumer that doesn't follow the file convention.
- **Testing notes**: after deploy, force-refresh OG caches via opengraph.xyz / Twitter card validator / send to a fresh iMessage thread. The image is generated on-demand at the edge per request.
- Build + lint clean.

## Session 19 -- 2026-04-29 -- Cache bust, rate limit, log cleanup, seed-other fix, flex result layout
- **Grace cache bust**: `localStorage` key prefix in `app/result/page.tsx` is now `grace-v2-${sid}`. Existing pre-Session-18 cached graces (which still hold the older second-person voice and the longer intro copy) are stale by key, so every user gets a fresh fetch under the current voice rules without hand-clearing storage.
- **Rate limit on `/api/grace`**: added per-IP, in-memory sliding-window limiter (5 requests / 60s). On overflow returns `429 { error: 'Rate limited' }`. Backstop: when the rate-limit Map exceeds 1000 entries, the oldest half is dropped so it can't grow unbounded. IP resolution prefers `x-forwarded-for` (first hop), falls back to `x-real-ip`, then `'unknown'`.
- **Diagnostic log cleanup**: removed the `[tally] sid=… mapped:` `console.log` from `app/api/tally-submission/route.ts`. The `console.warn` calls in `lib/tally.ts` (unmapped option / matrix UUID / bucket text) are intentionally preserved — they fire only on Tally form drift and are the easiest way to catch silent data drops.
- **Seed-"Other" mapping** (`lib/tally.ts`): `SEED_TEXT_TO_SCHEMA` now accepts `Other`, `Other...`, `Other…`, and `Other (please specify)` so the option matches whatever Tally renders. Plus a defensive fallback in `mapTallyToProvenance`: if the seed text is non-empty but unmapped, the seed type falls back to `'other'` (via `?? 'other'`) instead of leaving `data.seed` undefined. The `mapOne` warn still fires so the unrecognized text shows up in logs. This was triggered by a real submission whose Q2 = "Other" came through with the seed field completely missing — the pattern overlay on Patch 1 silently dropped to "no pattern" instead of falling back to `pattern-other.svg`.
- **Result page layout** (`app/result/page.tsx`): replaced the 6fr/4fr grid with a flex layout. Outer `flex flex-col md:flex-row md:gap-12`. Left column gets `md:flex-shrink-0 md:w-fit` so it sizes to the Tracemark + button width and doesn't stretch. Right column gets `md:flex-1` to fill the remaining space, with grace content wrapped in `mx-auto max-w-[600px]` so it stays at a comfortable reading width and doesn't smear across wide viewports. Mobile (below md) keeps the existing stacked single-column behavior.
- Build + lint clean.

## Session 18 -- 2026-04-29 -- Landing rewrite, How it works + What to do sections, outlined CTA
- **Landing hero is now responsive**: replaced the single `w-max grid-cols-12` with two breakpoint-specific grids inside the same `bg-[#F5F5F5]` wrapper. Mobile renders 12 marks at `size={100}` in `grid-cols-4 gap-2` (3 rows); desktop renders 16 marks at `size={140}` in `grid-cols-8 gap-3` (2 rows). One uses `md:hidden`, the other `hidden md:grid`. Wrapper padding is `pt-20 pb-20 md:pt-24` so there's a clear 80px gap below the grid (still inside the gray bg) before the title.
- **Subtitle copy** changed: "This project maps the full chain of human, technological, and cultural influences that shape a work of art." → "Map the full chain of influences behind your work." Tighter, more imperative.
- **Body trimmed to two paragraphs** (was three). The third paragraph about "creative workers navigating contracts" was cut. The second paragraph now describes both outputs (Tracemark + Grace) instead of just the Tracemark.
- **New "How it works" section** between body and CTA: 3 columns on desktop (`flex md:flex-row gap-8`), stacked on mobile (`flex-col gap-10`). Each column has an `aspect-square bg-[#F5F5F5]` "Image" placeholder, an `text-base font-medium` title, and a `text-sm text-[#666]` subtitle. Three steps: Answer / Receive your Tracemark / Read your Grace. Section header `text-lg font-medium mb-8`.
- **CTA flipped to outlined**: was `bg-black text-white` filled, now `border-[3px] border-black bg-transparent text-black`, capped at `max-w-[500px]` and centered with `mx-auto flex`. On hover it inverts (`hover:bg-black hover:text-white`).
- **Data transparency** restyled as a quiet footnote: header `text-base font-medium text-[#666] mb-2`, body `text-sm text-[#999] leading-relaxed`. Inherits the page's `max-w-[800px]`. `mt-16` separates it from the CTA. Replaced "your grace" with "your Grace" (capitalized) to match the new framing as a named output.
- **Result page Grace intro** rewritten: "A grace is a prayer said before a meal — a moment to pause and name what was given to you before you take the first bite. This is yours. Read it, and sit with what fed this piece." → "You just named everything that fed this piece. A grace is what you say before a meal, when you pause to acknowledge what was given. This is yours."
- **Result page Download button** label trimmed: "Download PNG" → "Download" so the flex-1 button row is balanced with the equally short "Share" / "Copy link" sibling.
- **New "What to do with your Tracemark" section** below the two-column layout: `mt-16 md:mt-24`, `text-2xl font-medium` heading, three columns mirroring the landing pattern but with `aspect-video` image placeholders instead of `aspect-square`. Suggestions: portfolio/project page; social media watermark; gallery/exhibition.
- All existing functionality preserved (Tracemark rendering, Grace fetch, download to PNG, share, localStorage cache, dev block).
- Build + lint clean.

## Session 17.1 -- 2026-04-29 -- Hero density, layout balance, angular buttons, platform-aware share
- **Landing hero**: replaced the 6-mark tilted grid with a dense 12×3 grid of 36 generated samples at 100px each, gap-2 (8px), no rotation. Wrapped in a full-width `overflow-hidden` container with vertical padding (`py-8 md:py-12`); the hero now breaks out of the page's `max-w-[700px]` constraint. Inner grid uses `w-max` so it sits at its natural ~1288px width and the edges get clipped on viewports narrower than that — the "infinite field" effect kicks in on most laptops and all mobile. Samples are generated by `buildSample(i)` using prime-modulo cycling on each axis (medium / teachers / helpers / references / collaborators / AI fields) so adjacent cells rarely match.
- **Landing CTA**: reverted from `bg-[#3E51C0]` back to `bg-black`. Bumped to `h-12 px-6 text-lg` (48px tall, 24px horizontal padding, 18px text) with no border-radius — sharp corners to match the angular Tracemark language.
- **Landing data note**: removed the "How is your data used?" heading. The paragraph is now `text-base leading-relaxed` (16px, default body color `#37352F`, not muted gray) with `mt-12` from the CTA and `max-w-[600px]` centered. Reads as a continuation of the page, not as fine print.
- **Result page two-column balance**: grid template changed from `[minmax(0,440px)_1fr]` to `[6fr_4fr]` — left column is now ~60% on desktop. Tracemark's `max-w-[540px]` lets it grow to fill the wider column. Column gap unchanged at 12 (48px).
- **Result page Tracemark card**: the wrapping `ref` div now carries `bg-[#F5F5F5] p-6 md:p-8` for a subtle gray "card" backdrop. The bg is on the wrapper; the download function reads the inner SVG via `querySelector('svg')`, so the backdrop is display-only and never captured in the PNG.
- **Result page caption**: new line below the Tracemark and buttons — "This is your Tracemark. Each patch represents a different dimension of your creative process." (14px, `#666`, max-w-[440px] centered). On mobile it stacks between the buttons and the Grace section, matching the request to put it between Tracemark and Grace.
- **Result page spacing**: outer container `space-y-10` → `space-y-16`; `main` padding `py-10 md:py-16` → `py-12 md:py-20`. Grace lines now use `leading-[1.8]`.
- **Buttons** (CTA, Download, Share): all share the same shape — `h-12 px-6 text-lg`, no border-radius, `inline-flex items-center`. CTA + Download are filled (`bg-black text-white`); Share is outlined (`border-[3px] border-black bg-transparent text-black`). Toast pill also lost its rounded-full so the angular language stays consistent.
- **Share platform detection + icons**: `useState` initializer reads `navigator.userAgent` once at mount (Suspense fallback above means this is client-only). On iOS the icon is a square + up arrow; on Android it's three connected dots; on desktop it's a chain link. The label flips: `Share` on iOS/Android, `Copy link` on desktop. Replaced the literal "↗" character.
- Build + lint clean.

## Session 17 -- 2026-04-29 -- Symposium UX polish: hero, two-col result, download/share, grace styling
- **Landing hero**: added `HeroGrid` above the title — six hardcoded sample `Partial<ProvenanceResponse>` objects rendered as 120px Tracemarks in a 3×2 grid. Each sample is deliberately distinct (different mediums, teacher mixes, AI used or not, varying ownership scores) so the marks read as a visual sample rather than near-duplicates. Tilted via per-cell rotation/translate-y transforms (`-rotate-3`, `rotate-2 translate-y-2`, etc.) for a "stickers laid on a surface" look. Marked `aria-hidden` so screen readers skip the decorative grid.
- **CTA color**: landing CTA button background changed from `bg-black` to `bg-[#3E51C0]` (deep blue from the palette). White text preserved. The download button on the result page picks up the same color; the share button uses an outlined variant (`border-[#3E51C0]` + transparent fill + blue text).
- **Result page two-column layout**: at `md+`, the page becomes a grid (`md:grid md:grid-cols-[minmax(0,440px)_1fr] md:gap-12`). Left column holds the Tracemark (`max-w-[440px]`) plus the action buttons, and uses `md:sticky md:top-8 md:self-start` so it stays in view while the user scrolls the grace. Mobile keeps the existing single-column stack. Page max-width bumped from `700px` to `1000px` to accommodate the side-by-side layout.
- **Download Tracemark**: new button below the Tracemark. Click handler clones the live SVG, serializes it, draws it on an offscreen 1080×1080 canvas (white background) via `Image` + `URL.createObjectURL`, and triggers a `tracemark-${sid}.png` download via `canvas.toBlob`. All cleanup (revokeObjectURL) is in `finally` blocks.
- **Share**: new outlined button next to Download. Tries `navigator.share({ title: "My Creative Trace", text: "See the creative provenance of my work", url })` first; falls back to `navigator.clipboard.writeText(url)` with a "Link copied!" toast. Toast is a fixed-position pill at the bottom-center, auto-dismisses after 2s.
- **Grace box restyled**: removed the rounded all-around border. New treatment is a 3px left accent in `#3E51C0` plus a warm off-white fill `#F8F7F6`, padding `p-4 md:p-6`. Italic + bold-subjects rendering preserved.
- **Grace mobile sizing**: text steps from `text-sm` (mobile) to `text-base` (md+). Line spacing `space-y-1.5 md:space-y-2`. Ownership-line top spacing `pt-5 md:pt-6`. The grace intro paragraph and intro container padding are unchanged at mobile-friendly sizes.
- **"How is your data used?" removed from result page**: the section was duplicate copy with the landing-page footnote. Removed entirely from `app/result/page.tsx` so the result page is just Tracemark + grace.
- Build + lint clean.

## Session 16 -- 2026-04-29 -- Tracemark visualization (V1)
- Built `components/Tracemark.tsx`: a generative 18×18-unit (540×540px at 1u=30px) SVG grid that visualizes a `Partial<ProvenanceResponse>`.
- Layout follows the spec exactly — three 180px-tall rows, nine patches numbered 0/1/3/4/5/6/7/8/9 (no Patch 2). Each patch is a `<g transform="translate(x,y)">` with internal coords starting at (0,0); a 2px `#000000` `PatchBorder` rect outlines every patch boundary.
- Patches:
  - **Patch 0** — solid black anchor (60×180).
  - **Patch 1** — 180×180 fill in the medium's color (mapping in `MEDIUM_COLOR`); fallback `#B5DD35`. TODO comment in source notes the seed-pattern overlay is pending.
  - **Patch 3** — references collapsed into 5 vertical sections (60×180 each); base `#3E51C0`, fill `#99A5F9` rising from the bottom by `average(weight) × 180`.
  - **Patch 4** — 8-cell teacher grid (rows 3 and 5 split). Base `#CB7C2B`, selected `#7BD0FD`. Spec's "crit" label maps to schema literal `'critique'`.
  - **Patch 5** — AI-used boolean. Always solid `#8CBBA1`; if `used === false`, an additional `#567550` triangle covers the bottom-right half (`(210,0)→(0,180)→(210,180)`).
  - **Patch 6** — 12-slot AI-helpers grid (3 cols × 4 rows, 30×45 each). Base `#983153`, selected `#F87014`. The 12th slot (col 3, row 4) has no schema mapping and always renders the base color.
  - **Patch 7** — 16-cell AI-generator grid mixing kinds (rows 1–3, 60×30), stages (rows 3–4, 60×30), and awareness (rows 5–6, 90×30). Discriminated-union `Patch7Match` per cell drives selection. If `aiGenerator.used === false`, the whole patch fills `#E98FC6` with no cell highlights.
  - **Patch 8** — direction/execution bar. `Math.ceil(value / 2)` columns (capped at 6) of `#567550` over `#E6D4DA`. Bar y=60 h=60. Five 1px black dividers between columns (the spec called out 6 lines but 5 is what visually delineates 6 columns; outer 2px patch border handles the edges).
  - **Patch 9** — collaborators with the same row pattern as Patch 4. Base `#99A5F9`, selected `#FFAA00`. Last row has no schema mapping.
- `Tracemark` exports a default React component with props `{ data: Partial<ProvenanceResponse>; size?: number; className?: string }`. `viewBox` is fixed at `0 0 540 540`; `size` sets the SVG's `width`/`height` attributes (default 540). `className` lets callers scale responsively (e.g. `w-full h-auto max-w-[540px]`).
- Wired into `app/result/page.tsx`: when the submission fetch resolves, the placeholder card is replaced with `<Tracemark data={state.data} className="h-auto w-full max-w-[540px]" />`. During the fetch, a dashed-border placeholder shows "Tracemark — loading…". The Tracemark sits centered (`flex justify-center`) and shares the page's max-width.
- Build + lint clean.

## Session 15 -- 2026-04-29 -- Polished landing, result layout, footer, data transparency
- **Landing page (`app/page.tsx`)**: replaced the stub with the new long-form copy. Title "Creative Trace" (5xl, medium weight), large light-weight subtitle, three body paragraphs framing the project (binary refusal tools / mapping provenance / honoring everyone else's contribution), and a "Trace your work →" CTA styled to match Tally's button (h-9, bg-black, rounded-lg 8px, px-3.5 14px, text-base 16px). Centered, max-w-[700px].
- **Result page (`app/result/page.tsx`)**: title is now "Your Tracemark" (was "Your trace"). Strip placeholder relabeled "Tracemark — awaiting visual system" with `aria-label="Tracemark"`. Added a "How is your data used?" section below the grace box explaining Tally storage, Anthropic Claude generation, no training/ads, no PII collected. Switched layout to the same max-w-[700px], lighter borders (#eee / #ddd), removed `dark:` variants. All existing functionality preserved (submission fetch, grace generation, localStorage cache, dev debug block).
- **Footer (`app/layout.tsx`)**: new `<Footer>` component rendered on every page. Three author lines (Shoro Roy, Paola Machuca Hernández, Yash Pawar) each with LinkedIn and Portfolio links, plus "Created in Ethics of AI, Spring 2026" and "F(r)ictions: Creative Labor in the Age of AI · The New School". 14px, muted #666, links `target="_blank"` with `hover:underline`. The questionnaire page renders the footer too but Tally's `fixed inset-0` iframe overlays it visually — a no-op in practice.
- **Typography**: switched from Geist to Inter via `next/font/google`. Inter is wired through `--font-inter` → `--font-sans`, so Tailwind's `font-sans` resolves to Inter. Removed the unused `Geist_Mono` import.
- **Globals (`app/globals.css`)**: foreground color set to #37352F (matching Tally's text color), background #ffffff. Removed the `prefers-color-scheme: dark` block — the design is intentionally single-mode light. Removed `--font-mono` (no longer needed).
- **Metadata** description updated to the new framing: "An interactive questionnaire that maps the provenance of a creative work — the mentors, references, tools, and generative systems that shaped it."
- Body copy uses curly apostrophes (’) for typographic correctness and to sidestep React's unescaped-entities lint rule.
- Build + lint clean.

## Session 14.1 -- 2026-04-29 -- Cache the grace + bold the subjects
- **Client-side grace cache.** `/result?sid=X` now stores generated graces in `localStorage` under the key `grace-${sid}`. On page load, the initializer reads the cache and pre-populates `graceState` so the grace appears instantly on revisit. The fetch effect re-checks the cache and bails out before hitting `/api/grace` if a cached entry exists. After a successful generation, the new grace is written back to the cache. Same `sid` → same answers → same grace, so we only ever pay Anthropic once per submission. Stops spending API credits on every refresh and gives users a stable text.
- The cache reader/writer is SSR-safe (typeof window guard) and tolerates `localStorage` being disabled (private browsing) — silent fail, falls through to a fresh fetch.
- **Bold the subjects.** Added a rule to the system prompt in `app/api/grace/route.ts`: each line should bold the specific thing being thanked using `**markdown bold**`, with an explicit example (`Thank you to **your toxic ex**, …`).
- `GraceLines` in `app/result/page.tsx` now parses `**…**` markdown bold spans and renders them as `<strong>` tags. Everything else stays italic. The renderer is regex-based (no markdown library), splits each line into alternating text + strong fragments, and is forgiving — text without bold spans renders unchanged.

## Session 14 -- 2026-04-29 -- Grace generation wired end-to-end
- Implemented `/app/api/grace/route.ts`: POST handler that accepts `{ submission: Partial<ProvenanceResponse> }`, calls Anthropic's Messages API with model `claude-sonnet-4-6` (alias — tracks the latest 4.6 build, no pinned date suffix), max_tokens 500, and the new "thank you to..." grace system prompt. Returns `{ grace: string }`. 400 on missing submission, 500 on API errors.
- System prompt frames the grace as "a prayer said before a meal" — a moment to pause and name what was given to you before you take the first bite. Each line begins with "Thank you to..." or "Thank you for...", one per distinct contribution source. Ends with two ownership lines: `"You feel this piece is [natural language of feltOwnership 1-10]." / "Sit with that."` This closing exists to surface the Q10 tension — felt ownership is what the maker *feels*, not what fed the work; the submission may contradict the score.
- System prompt marked `cache_control: { type: "ephemeral" }` so repeat traffic only pays for the user-specific JSON tokens.
- Auth uses `x-api-key` (Anthropic's canonical header) rather than `Authorization: Bearer` — `sk-ant-…` keys aren't OAuth bearer tokens.
- Updated `/app/result/page.tsx`:
  - Added the static grace-intro paragraph above the grace area (the "A grace is a prayer said before a meal…" text).
  - On successful submission load, the page POSTs the mapped submission to `/api/grace` and tracks a separate `graceState` (idle / loading / ok / error).
  - "Composing your grace…" loading state, italic styling on the rendered grace.
  - `<GraceLines>` splits the grace by `\n`, renders each line as its own `<p>`, and bumps `pt-6` on the second-to-last line so the ownership closing visibly steps away from the body.
- Updated CLAUDE.md's Grace Generation section to match the new framing (prayer-before-a-meal, system prompt inlined in the route, max tokens 500, x-api-key, ephemeral caching, rate limiting deferred to V2). Updated "What to Prioritize" to drop the "implement /api/grace" item.
- Build + lint clean.

## Session 13.3 -- 2026-04-29 -- Bugfix: mapTallyToProvenance was reading the wrong layer of the envelope
- Symptom: even after Session 13.2's `value`/`answer` fallback, `/result?sid=X54L4bg` still rendered the schema's empty defaults for every field.
- Cause: Tally's REST single-submission endpoint actually returns `{ questions: [...], submission: { id, responses: [...] } }` — the responses array is **one level deeper** than `mapTallyToProvenance` was reading. The function parameter was named `submission` but it was really the envelope; my code looked for `envelope.responses` and `envelope.submissions[0].responses`, but never `envelope.submission.responses`. Every `findAnswer` call ran against an empty array, and every mapped field collapsed to its default.
- Fix in `lib/tally.ts`: split the type into `TallyInnerSubmission` (the actual submission with `id`/`responses`) and `TallySubmission` (the envelope, which has the inner `submission` field plus tolerated alternates). New `extractInnerSubmission(env)` finds the inner submission via `env.submission.responses`, falling back to `env.responses`, then `env.submissions[0]`. The mapper now reads metadata (`id`, `submittedAt`) from the inner submission too.
- Added temporary diagnostic logs at the top of `mapTallyToProvenance`: envelope top-level keys, whether `.submission` and `.submission.responses` exist, the first three response items (questionId + answer only), and `Object.keys(QUESTION_IDS)`. These are explicitly tagged "temporary; remove once mapping is stable" — leave them through symposium prep so Vercel logs show what mapped on every real submission, then delete.
- Build + lint clean.

## Session 13.2 -- 2026-04-29 -- Bugfix: mapTallyToProvenance returned empty values
- Symptom: `/result?sid=...` rendered the schema's default/empty shape (e.g. `piece.description=""`, `aiHelpers=[]`, `aiGenerator.used=false`) for every field, even on submissions with real answers like sid `X54L4bg` (`piece="Test"`, `medium=["Something woven, sewn, or made of fiber"]`, `ghost="My toxic ex"`, `direction=7`, `ownership=7`).
- Cause: the response items returned by Tally's REST API hold the answer payload under `value` in some shapes and under `answer` in others; `findAnswer` was only reading `answer`. When the field was `value`, every lookup returned `undefined` and every mapped field collapsed to its default.
- Fix in `lib/tally.ts`: `TallyResponseItem` now declares both `answer?: unknown` and `value?: unknown`. `findAnswer` prefers `answer` and falls back to `value`. Added `extractResponses(submission)` to also handle the wrapped shape `submission.submissions[0].responses` (some Tally endpoints nest the array there). Added a `console.warn` when no responses are extracted, listing the top-level submission keys, so future shape drift is obvious in the logs.
- Verification hook: `app/api/tally-submission/route.ts` now logs the mapped output (`[tally] sid=... mapped: {...}`) so you can confirm against sid `X54L4bg` in dev/server logs after this deploy.
- The QUESTION_IDS table itself was already keyed by the short Tally questionIds (`NVk1pG`, `qB6142`, etc.) — that part wasn't the bug.

## Session 13.1 -- 2026-04-29 -- Exact UUID-based Tally → schema mapping
- Replaced the heuristic substring-matching `mapTallyToProvenance` in `lib/tally.ts` with an exact mapping pinned to the Tally form (RGZO7p).
- Added `QUESTION_IDS` lookup keyed by the form's known question UUIDs (NVk1pG = piece, qB6142 = medium, QrLlKg = seed, 91VjNG = references, eA4W5q = teachers, WoyVJJ = ghost, axVqO9 = aiHelpers, 6koEDe = aiUsed gate, 7DGrXL = aiKinds, bkPQZe = aiStage, AJZerB = aiAwareness, B1NWE7 = directionExecution, kAqBb6 = collaborators, vBk5XA = feltOwnership, KobKpM = ownership.why).
- Added per-question `TEXT_TO_SCHEMA` constants that map each option's exact Tally text to the schema literal (medium, seed, teacher, aiHelper, aiKind, aiStage, aiAwareness, collaborator). `null` values mark intentional opt-outs ("None of these", "Nobody — just me") that resolve to empty arrays. Anything not in the table emits a `console.warn` and is skipped.
- Q3 references mapped via the matrix row UUIDs (twelve fixed UUIDs → the schema's ReferenceTileId enum). Each row's bucket text ("Barely" / "A little" / "A lot") maps to weight 0.2 / 0.5 / 0.85. Only rows the respondent actually selected are included.
- Q7 gate logic: if aiUsed answer is `["Yes"]`, branch fields (kinds, stage, awareness) are mapped; otherwise `aiGenerator = { used: false }` and the branch fields are omitted entirely.
- Removed the "first submission" `console.log` from `fetchSubmission` and the `loggedRawShapeOnce` flag that gated it.
- Removed the substring-matching helpers (`findField`, `resolveChoices`, `matchSlug`, `bucketFromLabel`) and the schema-literal constants they relied on. Replaced with `findAnswer(responses, questionId)` plus small `mapOne` / `mapMany` helpers.
- Updated CLAUDE.md's "Tally integration" and "What to Prioritize" sections to reflect the REST fetch + UUID-pinned mapping (no more `parseTallyParams` references).
- Build passes cleanly.

## Session 13 -- 2026-04-29 -- Tally REST fetch via /result?sid={submissionId}
- Tally now redirects to `/result?sid={submissionId}` on completion. The result page fetches the full submission server-side via the Tally REST API instead of reading every answer from URL params.
- Added `TALLY_API_KEY` to `.env.local` and `.env.example` (both as empty placeholders).
- Created `lib/tally.ts`:
  - `fetchSubmission(submissionId)` — GETs `https://api.tally.so/forms/RGZO7p/submissions/{submissionId}` with `Authorization: Bearer ${TALLY_API_KEY}`. Throws a 404 error (with `.status` flag) if the submission isn't found, otherwise propagates a generic error.
  - On the first successful call per process, logs the raw response shape to the server console so we can inspect it and refine the mapping.
  - `mapTallyToProvenance(submission)` — best-effort map from Tally's `fields`/`responses` array to `Partial<ProvenanceResponse>`. Uses label/key substring heuristics to find each question, resolves option IDs to text via the field's `options` table, and matches against the schema's literal unions. TODO comments mark fields whose exact Tally shape can't be confirmed without a real submission (notably Q3's per-tile bucket fields and Q7's branch presence).
- Created `app/api/tally-submission/route.ts` — GET handler. Reads `sid` from the query string, calls `fetchSubmission` + `mapTallyToProvenance`, returns the mapped response as JSON. 400 if `sid` is missing, 404 if the submission isn't found, 500 for other errors.
- Updated `app/result/page.tsx`:
  - Removed `parseTallyParams`. The result page no longer reads form answers from URL params — only `sid`.
  - On mount, fetches `/api/tally-submission?sid={sid}` and renders loading/error/ok states.
  - Added strip and Grace placeholder sections (still stubs; visual system + Grace generation are separate tasks).
  - Dev-only debug block now shows the `sid` and the mapped `ProvenanceResponse` returned by the API route.
- Build passes cleanly.

## Session 12.1 -- 2026-04-29 -- Rename to Creative Trace
- Project renamed from "Creative Provenance" to "Creative Trace" after securing the domain creativetrace.art.
- Production now lives at https://creativetrace.art/. The previous Vercel URL (https://creative-provenance.vercel.app/) is intentionally preserved as a live redirect to the new domain, handled at the Vercel/DNS level — references to it should not be removed from code or docs.
- Renamed in code: package.json `name`, root layout `metadata.title`, landing page heading, iframe `title` attribute on the Tally embed, localStorage key in lib/storage.ts (creative-provenance-response → creative-trace-response), filename pattern in requirements (creative-provenance-{timestamp}.png → creative-trace-{timestamp}.png), share-payload title.
- Updated documentation: README, CLAUDE.md, /docs/requirements.md, /docs/questionnaire-draft.md, /docs/backlog.md.
- Past changelog entries (Sessions 1a–11.2 and the Deploy entry) were intentionally NOT rewritten — they describe the project as it was named at the time.
- The opening prompt at /docs/opening-prompt.md was also left untouched as a historical artifact.
- The Tally form's title is edited inside Tally itself (not part of this codebase) and was not touched here.
- Build passes cleanly.

## Session 12 -- 2026-04-29 -- Pivot to Tally + result page stub
- Abandoned the custom-coded questionnaire. The survey now lives in Tally at https://tally.so/r/RGZO7p, embedded as a full-viewport iframe at /questionnaire.
- Tally is configured (separately, in the Tally dashboard) to redirect to /result with answers as URL parameters on submit.
- /app/questionnaire/page.tsx replaced with a single client component that loads tally.so/widgets/embed.js via next/script (strategy="afterInteractive") and renders the iframe.
- /app/result/page.tsx scaffolded as a client component: reads useSearchParams(), passes them to a parseTallyParams() stub (returns {} for now), shows a placeholder + dev-only debug block listing raw params and parsed output. Does NOT call /api/grace yet.
- /api/grace/route.ts stub kept; now imports ProvenanceResponse type to keep it in sync with the schema. No generation logic yet.
- /app/page.tsx: removed "your answers stay on your device" line (no longer accurate with Tally hosting). Kept the rest.
- Schema updates in /lib/schema.ts:
  - Q3 references: dropped position; weight is now one of {0.2, 0.5, 0.85} (Tally produces three buckets, not a continuous canvas value)
  - Q6 aiHelpers: removed 'none' from AIHelperType union; empty array signals "no helpers used"
  - Q8 directionExecution: changed from {x, y} normalized 0-1 to a single integer 1-10
  - Q9 collaborators: removed 'just-me' from CollaboratorType union; empty array signals "just me"
  - Q10 ownership.feltOwnership: integer 1-10 instead of normalized 0-1
  - Header comment notes these are the target shapes Tally params will be mapped into
- Deleted (no longer needed):
  - /app/questionnaire/[step]/ (the per-step routing)
  - /app/questionnaire/layout.tsx (QuestionnaireProvider wrapper + footer hint)
  - /components/questions/ (all 9 question components)
  - /components/shared/StepNav.tsx, MultiSelectCard.tsx
  - /lib/context.tsx, /lib/steps.ts, /lib/hooks/useRovingTabIndex.ts
- Build passes cleanly with the new schema and stubs.

## Session 11.2 -- 2026-04-25 -- Q3 canvas layout balance
- Tightened pool tile padding (py-1, text-[11px]) so 12 tiles take less vertical space
- Canvas min-height 360px, max-height 600px (no aspect-ratio lock) so it stretches to match pool height
- Moved zone labels outside the canvas to a left-side column, no longer overlapping the drop zone
- Capped max canvas tile size at 64px (was 80px) for better proportion with pool tiles

## Session 11.1 -- 2026-04-25 -- Q3 canvas: radial to inverted pyramid
- Refactored desktop canvas weight model from radial (distance-from-center) to vertical (y-axis)
- weight = max(0.1, 1 - y): top of canvas = most influential, bottom = least
- Added three zone dividers (dashed lines at 33% and 67%) with zone labels: "Really shaped it" / "Shaped it some" / "Barely there"
- Added directional labels: "Most influential" at top, "Barely there" at bottom
- Canvas aspect ratio changed to 4:5 (taller) to better accommodate vertical encoding
- Tile sizing still driven by weight (40-80px), now consistently mapped to vertical position
- X-axis is cosmetic only (horizontal spread for visual clarity, not encoded)
- Pool and drag interactions unchanged

## Session 11 -- 2026-04-25 -- Revert auto-advance + Q3 two-mode implementation
- Reverted form-wide auto-advance (Q1 medium, Q7 gate/stage/awareness) for consistency -- all questions now use explicit Next
- Deleted useAutoAdvance.ts and AutoAdvanceIndicator.tsx
- MultiSelectCard checkbox indicators preserved (visual differentiation still useful)
- Built Q3 rapid-fire tile-by-tile fallback: 12 tiles shown one at a time with weight buttons (Barely there / Shaped it some / Really shaped it) + Skip
- Q3 auto-advances per tile on tap (the only structurally-justified auto-advance in the form)
- Q3 shows internal Back, Done button (appears once >= 1 tile weighted), section headers on section transitions
- Layout nav hidden on step 3 (Q3 renders its own)
- Removed section category headers from Q3 fallback (inconsistent visual)
- Added Next button to Q3 fallback for sequential navigation without re-answering
- Built Q3 desktop spatial canvas (>= 768px): pool of 12 tiles on left, drop canvas on right
- Canvas: drag tiles from pool onto canvas, weight derived from distance to center (center = high, edge = low)
- Tiles on canvas sized by weight (40-80px), repositionable, removable via X button or drag-back-to-pool
- Drag ghost follows pointer during drag with setPointerCapture
- "Use simple version" toggle for keyboard users switches to fallback on desktop
- Mode detection via matchMedia; state shared between modes via references array

## Session 10.1 -- 2026-04-25 -- Bug fixes: auto-advance first-click + Q3 bucket order
- Fixed auto-advance triggering only on second click: removed interactedSinceMount guard from useAutoAdvance (unnecessary since triggerAdvance is only called from user handlers)
- Fixed Q3 fallback bucket order: reversed to [Barely there] [Shaped it some] [Really shaped it] for natural left-to-right intensity mapping

## Session 10 -- 2026-04-25 -- MultiSelectCard + auto-advance
- Extracted MultiSelectCard component with visible checkbox indicator (14px square, checkmark on select)
- Refactored Q2, Q4, Q6, Q9, Q7 Kinds to use MultiSelectCard -- visual differentiation from single-select
- Single-select cards (Q1 medium, Q7 gate/stage/awareness) remain clean, no indicator
- Standardized "Check all that apply." subtitle across all multi-select questions
- Built useAutoAdvance hook with interactedSinceMount suppression and 550ms delay
- Built AutoAdvanceIndicator component (pulsing "Next" badge)
- Wired auto-advance to Q1 medium (suppressed for "Something else"), Q7 gate, Q7 stage, Q7 awareness
- Auto-advance suppressed on revisit until new user interaction

## Session 9 -- 2026-04-25 -- PositionDot subtitle fix, Q1 sub-step refactor, shared StepNav
- Fixed PositionDot subtitle: always visible now, no layout jump on first interaction
- Refactored Q1 into sub-step flow matching Q7's pattern (sub-step 0: description, sub-step 1: medium)
- Q1 renders its own internal Back/Next via shared StepNav; layout nav hidden on step 1
- Extracted StepNav into components/shared/StepNav.tsx, used by both Q1 and Q7
- Removed Q7's internal Q7Nav in favor of shared StepNav
- Sub-step derived from data on mount (if medium is set, start on sub-step 1)
- Updated requirements.md Q1 format to describe sub-step flow

## Session 8 -- 2026-04-25 -- PositionDot for Q8 and Q10
- Built real PositionDot component with Pointer Events drag, click-on-track, and keyboard nav (arrow keys, Home/End)
- Dot renders at 50% with reduced opacity when unset; first interaction sets the value and enables Next
- setPointerCapture for smooth drag even when pointer leaves the dot
- touch-none on track to prevent mobile scroll interception
- role="slider" with aria-valuenow/aria-valuetext for qualitative position descriptions
- Wired Q8 (Direction vs. execution) and Q10 (The verdict) to the new component
- Q10 includes optional "Why?" textarea via optionalText prop
- Deleted VerdictQuestion.tsx (replaced by PositionDot with optionalText)

## Deploy -- 2026-04-25 -- First production deploy
- Vercel project linked to GitHub repo
- Production URL: https://creative-provenance.vercel.app/
- ANTHROPIC_API_KEY configured in Vercel environment variables (all three environments)
- Auto-deploy on push to main; preview deploys on feature branches
- Anthropic API usage cap set to $20/month

## Session 7 -- 2026-04-25 -- Q7 restructured as internal sub-step flow
- Restructured Q7 from stacked progressive disclosure to a forked sub-step flow (4 sub-steps: Gate, Kinds, Stage, Awareness)
- Each sub-step is one decision per screen, matching the rest of the questionnaire's pacing
- Q7 renders its own Back/Next buttons; the layout's nav is hidden on step 7
- False at Gate skips directly to Q8; True advances through sub-steps 1-3
- Sub-step derived from data state on mount (first incomplete field), so refresh lands on the right sub-step
- Sub-step indicator ("1 of 4") shown on True branch sub-steps
- State preserved across True/False toggles and sub-step navigation

## Session 6 -- 2026-04-25 -- Q7 (AI as generator) initial build
- Built Q7 with True/False gate and three sub-questions (Kinds, Stage, Awareness)
- Tightened Q7 validation: False is always valid; True requires all three sub-answers plus kindOther when "other" is selected
- Extracted shared card class names (cardBase, cardSelected, cardUnselected) within the component

## Session 5 -- 2026-04-25 -- Q1 (the piece) and Q5 (the ghost)
- Built Q1 with text input for piece description and card-style radio selector for 9 medium types
- Q1 "Something else" reveals text input, blocks Next when empty (consistent with Q2 "Other" pattern)
- Built Q5 with contemplative prompt, multi-line textarea, and "Skip" link that advances immediately
- Q5 auto-sets ghost.present based on whether textarea has content; Skip sets present=false and advances
- Slightly elevated typography on Q5 prompt (text-lg) to honor the question's emotional weight
- Q1 progressive disclosure: medium section hidden until description has content, fades in with CSS transition

## Session 4 -- 2026-04-25 -- Hook extraction, global hint, Q4/Q6/Q9
- Relocated keyboard hint from Q2 into global questionnaire layout footer (visible on all steps)
- Extracted roving tabindex logic into reusable lib/hooks/useRovingTabIndex.ts
- Refactored Q2 to use the new hook (no behavior change)
- Built Q4 (teachers) -- 8-option multi-select with questionnaire-draft.md copy
- Built Q6 (AI helpers) -- 12-option multi-select with mutually exclusive "None of these"
- Built Q9 (collaborators) -- 8-option multi-select with mutually exclusive "Nobody -- just me"
- Updated CLAUDE.md file structure to include lib/hooks/

## Session 3 -- 2026-04-25 -- Arrow key nav fix + docs infrastructure
- Fixed arrow key navigation in Q2 after radio-to-checkbox conversion (roving tabindex pattern)
- Added keyboard navigation hint text to Q2 to improve discoverability of the roving tabindex pattern
- Created /docs directory and moved project documentation into it
- Created backlog.md, bugs.md, changelog.md as living project documents
- Added "Project Documentation" and "Documentation Discipline" sections to CLAUDE.md

## Session 2 -- 2026-04-25 -- Q2 SeedQuestion + multi-select pivot
- Built Q2 (the seed) as the first real question component with 12 options, "Other" fallback, full keyboard nav
- Restructured Q2 from single-select to multi-select after testing revealed creative origins are often plural
- Fixed bug: first option focus ring missing (switched to has-[:focus-visible] with explicit offset colors)
- Stable "Other" label: card always reads "Other", text input appears below when checked
- Tightened validation in lib/steps.ts: Q1 and Q2 now require "Other" text when "other" is selected

## Session 1b -- 2026-04-25 -- State plumbing
- QuestionnaireProvider context with localStorage persistence
- Step routing via /questionnaire/[step] with back/next navigation
- Validation gating to prevent skipping required fields
- All 10 question components scaffolded as placeholders

## Session 1a -- 2026-04-25 -- Project setup
- Next.js 16 + TypeScript strict + Tailwind 4
- Full data schema in lib/schema.ts (9 union types, 77 string literals)
- File structure matching CLAUDE.md spec
- Vercel-ready, .env handling configured
- Fixed Turbopack workspace root resolution
