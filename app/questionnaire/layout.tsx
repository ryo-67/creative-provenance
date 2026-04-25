import { QuestionnaireProvider } from '@/lib/context';

export default function QuestionnaireLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QuestionnaireProvider>
      {children}
      <footer className="py-3 text-center text-xs italic text-zinc-400 dark:text-zinc-500">
        Use arrow keys to move, Space to select. Tab to continue.
      </footer>
    </QuestionnaireProvider>
  );
}
