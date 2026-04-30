import { NextResponse } from 'next/server';
import { fetchAndMapSubmission } from '@/lib/tally';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sid = searchParams.get('sid');

  if (!sid) {
    return NextResponse.json(
      { error: 'Missing sid query parameter' },
      { status: 400 },
    );
  }

  try {
    const mapped = await fetchAndMapSubmission(sid);
    return NextResponse.json(mapped);
  } catch (err) {
    const status =
      typeof err === 'object' &&
      err !== null &&
      'status' in err &&
      (err as { status?: unknown }).status === 404
        ? 404
        : 500;
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(
      '[tally-submission] sid=%s failed:',
      sid,
      err instanceof Error ? `${err.message}\n${err.stack}` : String(err),
    );
    return NextResponse.json({ error: message }, { status });
  }
}
