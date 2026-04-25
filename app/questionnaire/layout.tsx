import { QuestionnaireProvider } from '@/lib/context';

export default function QuestionnaireLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <QuestionnaireProvider>{children}</QuestionnaireProvider>;
}
