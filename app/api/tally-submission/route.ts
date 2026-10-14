import { NextResponse } from 'next/server';
import { describeError, errorMessage } from '@/lib/errors';
import { fetchAndMapSubmission, TallyNotFoundError } from '@/lib/tally';

export async function GET(request: Request) {
  const sid = new URL(request.url).searchParams.get('sid');
  if (!sid) {
    return NextResponse.json(
      { error: 'Missing sid query parameter' },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(await fetchAndMapSubmission(sid));
  } catch (err) {
    console.error('[tally-submission] sid=%s failed:', sid, describeError(err));
    return NextResponse.json(
      { error: errorMessage(err, 'Unknown error') },
      { status: err instanceof TallyNotFoundError ? 404 : 500 },
    );
  }
}
