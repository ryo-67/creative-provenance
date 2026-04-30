'use client';

// TracemarkLegend — wraps <Tracemark> with an interactive overlay.
//
// Each of the 9 patches gets an invisible <button> region positioned
// over it (by percentage of the rendered SVG, so it stays aligned at
// any breakpoint). Hover / focus / click activates a patch; a label
// panel below the mark surfaces what the patch maps to and the user's
// own answer.
//
// The legend is purely additive — it does not modify the Tracemark
// SVG. The download flow in app/result/result-content.tsx queries
// `tracemarkRef.current.querySelector('svg')` and finds the inner
// Tracemark; the overlay sits absolute over the SVG (not inside it),
// so PNG exports are untouched by the legend.

import { useState } from 'react';
import Tracemark from '@/components/Tracemark';
import type {
  AIGenerationKind,
  AIGenerationStage,
  AIHelperType,
  CollaboratorType,
  MediumType,
  ProvenanceResponse,
  ReferenceTileId,
  SeedType,
  TeacherType,
  TrainingDataAwareness,
} from '@/lib/schema';

// --- Patch coordinates (Tracemark viewBox is 540×540) ---

interface PatchInfo {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  q: string;
}

const PATCHES: PatchInfo[] = [
  {
    id: 'patch0',
    x: 0,
    y: 0,
    w: 60,
    h: 180,
    label: 'Anchor',
    q: 'Constant — every Tracemark carries this black square.',
  },
  {
    id: 'patch1',
    x: 60,
    y: 0,
    w: 180,
    h: 180,
    label: 'Medium + seed',
    q: 'What is the piece, and how did it begin?',
  },
  {
    id: 'patch3',
    x: 240,
    y: 0,
    w: 300,
    h: 180,
    label: 'References',
    q: 'What were you soaking in?',
  },
  {
    id: 'patch4',
    x: 0,
    y: 180,
    w: 240,
    h: 180,
    label: 'Teachers',
    q: 'Where did you learn to make this?',
  },
  {
    id: 'patch5',
    x: 240,
    y: 180,
    w: 210,
    h: 180,
    label: 'AI as generator',
    q: 'Did you use AI to generate part of this?',
  },
  {
    id: 'patch6',
    x: 450,
    y: 180,
    w: 90,
    h: 180,
    label: 'AI as helper',
    q: 'What quiet AI tools did you use?',
  },
  {
    id: 'patch7',
    x: 0,
    y: 360,
    w: 180,
    h: 180,
    label: 'AI generator details',
    q: 'What kind, what stage, whose training data?',
  },
  {
    id: 'patch8',
    x: 180,
    y: 360,
    w: 180,
    h: 180,
    label: 'Direction vs execution',
    q: 'Were you the director, the maker, or somewhere between?',
  },
  {
    id: 'patch9',
    x: 360,
    y: 360,
    w: 180,
    h: 180,
    label: 'Collaborators',
    q: 'Whose hands and eyes shaped this besides yours?',
  },
];

// --- Slug → human-readable mappings ---
//
// Local to this file so the legend stays self-contained; the schema
// stays the source of truth for the literal values.

const MEDIUM_LABEL: Record<MediumType, string> = {
  painted: 'Painted on paper or canvas',
  'digital-2d': 'Digital 2D',
  '3d-digital': 'Rendered in 3D',
  sculpted: 'Sculpted or built',
  printed: 'Printed or pressed',
  fiber: 'Fiber',
  motion: 'Motion',
  'mixed-media': 'Mixed media',
  other: 'Something else',
};

const SEED_LABEL: Record<SeedType, string> = {
  body: 'something you needed to get out of your body',
  memory: "a memory that wouldn't leave you alone",
  image: 'an image that stuck',
  conversation: 'a conversation that lit something up',
  obsession: 'an obsession you keep returning to',
  technique: 'a craving for a new technique or material',
  constraint: 'a constraint',
  problem: 'a problem to solve',
  critique: 'anger, grief, or critique of something in the world',
  chance: 'a dream, an accident, a coincidence',
  unknown: "something you can't trace",
  other: 'something else',
};

const REFERENCE_LABEL: Record<ReferenceTileId, string> = {
  'artist-portfolios': 'artist portfolios',
  'curated-channels': 'curated channels',
  'algorithmic-feeds': 'algorithmic feeds',
  'search-results': 'search results',
  music: 'music',
  'film-literature': 'film and literature',
  'built-environment': 'the built environment',
  'natural-world': 'the natural world',
  heritage: 'heritage',
  'everyday-life': 'everyday life',
  imagination: 'imagination',
  'ai-moodboards': 'AI moodboards',
};

const WEIGHT_LABEL: Record<number, string> = {
  0.85: 'a lot',
  0.5: 'some',
  0.2: 'a little',
};

const TEACHER_LABEL: Record<TeacherType, string> = {
  'formal-education': 'school or a program',
  'self-taught': 'self-taught with the internet',
  mentor: 'a mentor',
  copying: 'copying artists',
  critique: 'the crit room',
  apprenticeship: 'an apprenticeship',
  workshops: 'workshops or residencies',
  'ai-teacher': 'AI tools as teachers',
};

const HELPER_LABEL: Record<AIHelperType, string> = {
  'background-removal': 'background removal',
  'generative-fill': 'generative fill',
  'auto-correction': 'auto color correction',
  upscaling: 'upscaling',
  search: 'visual search',
  autosuggest: 'spell check and smart guides',
  retouching: 'AI retouching',
  rotoscoping: 'rotoscoping',
  transcription: 'voice-to-text',
  recommendations: 'generative suggestions',
  'auto-tagging': 'auto-tagging',
};

const AI_KIND_LABEL: Record<AIGenerationKind, string> = {
  'text-to-image': 'Text-to-image',
  'image-to-image': 'Image-to-image',
  '3d-generation': '3D generation',
  motion: 'Animation/motion',
  audio: 'Audio',
  text: 'Text',
  other: 'Something else',
};

const AI_STAGE_LABEL: Record<AIGenerationStage, string> = {
  'concept-only': 'a starting point only',
  reference: 'a reference layer',
  composited: 'composited into the final',
  'mostly-as-is': 'kept mostly as-is',
  'all-ai': 'the whole piece',
};

const AI_AWARENESS_LABEL: Record<TrainingDataAwareness, string> = {
  'no-idea': 'no idea about training data',
  'artists-like-me': 'artists like you, without consent',
  'specific-artists': 'specific artists in there',
  licensed: 'licensed or consenting data',
};

const COLLABORATOR_LABEL: Record<CollaboratorType, string> = {
  assistant: 'studio assistant',
  fabricator: 'fabricator',
  editor: 'retoucher or editor',
  peer: 'peer',
  mentor: 'mentor',
  model: 'the model or performer',
  'commissioned-creator': 'commissioned creator',
};

function readAnswer(
  patchId: string,
  data: Partial<ProvenanceResponse>,
): string {
  switch (patchId) {
    case 'patch0':
      return 'This square is constant — every Tracemark carries it.';
    case 'patch1': {
      const medium = data.piece?.medium;
      const seed = data.seed?.types?.[0];
      const m = medium ? MEDIUM_LABEL[medium] : null;
      const s = seed ? SEED_LABEL[seed] : null;
      if (!m && !s) return 'No answer';
      if (!s) return m ?? 'No answer';
      if (!m) return `Started as ${s}`;
      return `${m}, started as ${s}`;
    }
    case 'patch3': {
      const refs = data.references ?? [];
      if (refs.length === 0) return 'No answer';
      return refs
        .map((r) => `${REFERENCE_LABEL[r.id]} (${WEIGHT_LABEL[r.weight]})`)
        .join(', ');
    }
    case 'patch4': {
      const teachers = data.teachers ?? [];
      if (teachers.length === 0) return 'No answer';
      return teachers.map((t) => TEACHER_LABEL[t]).join(', ');
    }
    case 'patch5':
      if (data.aiGenerator === undefined) return 'No answer';
      return data.aiGenerator.used ? 'Yes' : 'No';
    case 'patch6': {
      const helpers = data.aiHelpers;
      if (helpers === undefined) return 'No answer';
      if (helpers.length === 0) return 'None';
      return helpers.map((h) => HELPER_LABEL[h]).join(', ');
    }
    case 'patch7': {
      const gen = data.aiGenerator;
      if (gen?.used !== true)
        return 'Not applicable — no AI generator was used';
      const parts: string[] = [];
      if (gen.kinds?.length) {
        parts.push(gen.kinds.map((k) => AI_KIND_LABEL[k]).join(' / '));
      }
      if (gen.stage) parts.push(AI_STAGE_LABEL[gen.stage]);
      if (gen.trainingDataAwareness)
        parts.push(AI_AWARENESS_LABEL[gen.trainingDataAwareness]);
      return parts.length
        ? parts.join(', ')
        : 'AI was used; no further details given';
    }
    case 'patch8': {
      const v = data.directionExecution;
      if (typeof v !== 'number') return 'No answer';
      if (v <= 3) return 'Mostly directing';
      if (v <= 7) return 'A mix of directing and making';
      return 'Mostly making';
    }
    case 'patch9': {
      const collabs = data.collaborators;
      if (collabs === undefined) return 'No answer';
      if (collabs.length === 0) return 'Just you';
      return collabs.map((c) => COLLABORATOR_LABEL[c]).join(', ');
    }
    default:
      return 'No answer';
  }
}

// --- Component ---

interface TracemarkLegendProps {
  data: Partial<ProvenanceResponse>;
  className?: string;
}

export default function TracemarkLegend({
  data,
  className,
}: TracemarkLegendProps) {
  const [activePatch, setActivePatch] = useState<string | null>(null);
  const isSkeleton = !data || Object.keys(data).length === 0;

  const activeInfo = activePatch
    ? (PATCHES.find((p) => p.id === activePatch) ?? null)
    : null;

  return (
    <>
      {/* Tracemark + invisible interactive overlay.
          Wrapper is `w-full` on mobile and `md:w-fit` on desktop so it
          shrink-wraps to the SVG's effective rendered size — overlay
          regions positioned via percentage of the wrapper then line
          up exactly with the patches at any breakpoint. */}
      <div className="relative w-full md:w-fit">
        <Tracemark data={data} className={className} />
        {!isSkeleton && (
          <div className="absolute inset-0">
            {PATCHES.map((patch) => {
              const isActive = activePatch === patch.id;
              return (
                <button
                  key={patch.id}
                  type="button"
                  aria-label={patch.label}
                  onMouseEnter={() => setActivePatch(patch.id)}
                  onMouseLeave={() => setActivePatch(null)}
                  onFocus={() => setActivePatch(patch.id)}
                  onBlur={() => setActivePatch(null)}
                  onClick={() =>
                    setActivePatch((prev) =>
                      prev === patch.id ? null : patch.id,
                    )
                  }
                  className={`absolute cursor-pointer border-0 bg-transparent p-0 transition-colors hover:bg-black/5 focus:outline-2 focus:-outline-offset-2 focus:outline-black ${
                    isActive ? 'bg-black/5' : ''
                  }`}
                  style={{
                    left: `${(patch.x / 540) * 100}%`,
                    top: `${(patch.y / 540) * 100}%`,
                    width: `${(patch.w / 540) * 100}%`,
                    height: `${(patch.h / 540) * 100}%`,
                  }}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Label panel — always rendered with min-height so the layout
          doesn't jump as activePatch changes. aria-live="polite" lets
          screen readers announce the swap. Same warm off-white as the
          Grace box but no left-border accent: this is informational,
          not a quote. */}
      <div
        aria-live="polite"
        className="mt-4 min-h-[112px] bg-[#F8F7F6] p-4 md:mt-6 md:p-6"
      >
        {isSkeleton ? null : activeInfo === null ? (
          <p className="text-sm italic text-[#999]">
            Tap a patch to see what it maps to.
          </p>
        ) : (
          <>
            <p className="text-base font-semibold text-[#37352F]">
              {activeInfo.label}
            </p>
            <p className="mt-1 text-sm italic text-[#666]">{activeInfo.q}</p>
            <p className="mt-3 text-sm break-words text-[#37352F]">
              <span className="text-[#999]">Your answer: </span>
              {readAnswer(activeInfo.id, data)}
            </p>
          </>
        )}
      </div>
    </>
  );
}
