import { NextResponse } from 'next/server';
import { fetchSubmission, mapTallyToProvenance } from '@/lib/tally';

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
    const submission = await fetchSubmission(sid);
    const mapped = mapTallyToProvenance(submission);
    console.log(
      `[tally] sid=${sid} mapped:`,
      JSON.stringify(mapped, null, 2),
    );
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
    return NextResponse.json({ error: message }, { status });
  }
}
