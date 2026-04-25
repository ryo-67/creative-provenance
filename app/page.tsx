import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <div className="max-w-lg space-y-8">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Creative Provenance
        </h1>
        <p className="text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          Trace the chain of hands, eyes, and algorithms that shaped your work.
          Answer ten questions about a single piece, and receive a fingerprint
          of everything that went into making it — and a grace for everyone who
          did.
        </p>
        <Link
          href="/questionnaire"
          className="inline-block rounded-full bg-zinc-900 px-8 py-3 text-base font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Begin
        </Link>
        <p className="text-sm text-zinc-400 dark:text-zinc-500">
          No accounts. No tracking. Your answers stay on your device.
        </p>
      </div>
    </main>
  );
}
