'use client';
import { Component, type ReactNode } from 'react';
import Link from 'next/link';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

export default class ResultErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(
      '[result] error boundary caught:',
      error.message,
      error.stack,
      info.componentStack,
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
          <h1 className="text-3xl font-medium tracking-tight md:text-4xl">
            Something went wrong loading your Tracemark
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-[#666]">
            This result might be temporarily unavailable. Try again in a moment, or start a new trace.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex h-12 items-center justify-center border-[3px] border-black bg-transparent px-6 text-lg text-black transition-colors hover:bg-black hover:text-white"
          >
            Start a new trace
          </Link>
        </main>
      );
    }
    return this.props.children;
  }
}
