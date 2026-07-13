import { NextRequest, NextResponse } from 'next/server';
import type { ProvenanceResponse } from '@/lib/schema';
import { summarizeProvenance } from '@/lib/provenance-stats';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ProvenanceResponse;

    console.log('stats request:', JSON.stringify(body));

    const stats = summarizeProvenance(body);

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json(
      { error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}
