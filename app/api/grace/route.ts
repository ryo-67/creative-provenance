import { NextResponse } from 'next/server';
import type { ProvenanceResponse } from '@/lib/schema';

export async function POST(request: Request) {
  // TODO: Implement Grace generation via Claude API once Tally redirect flow
  // is wired and parseTallyParams produces real ProvenanceResponse data.
  const _body = (await request.json()) as Partial<ProvenanceResponse>;
  void _body;
  return NextResponse.json({ grace: '' });
}
