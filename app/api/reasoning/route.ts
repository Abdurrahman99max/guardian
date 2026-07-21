import { NextResponse } from 'next/server';

import { logReasoningFailure } from '@/features/guardian-intelligence/reasoning-diagnostics';
import { resolveReasoningProvider } from '@/features/guardian-intelligence/reasoning-provider-resolver';
import { reasoningRequestSchema } from '@/features/guardian-intelligence/reasoning-schemas';
import type { ReasoningResult } from '@/features/guardian-intelligence/types';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json<ReasoningResult>(
      {
        status: 'unavailable',
        message: 'Guardian needs complete, usable evidence before it can form a working view.',
      },
      { status: 400 },
    );
  }

  const parsedRequest = reasoningRequestSchema.safeParse(payload);

  if (!parsedRequest.success) {
    return NextResponse.json<ReasoningResult>(
      {
        status: 'unavailable',
        message: 'Guardian needs complete, usable evidence before it can form a working view.',
      },
      { status: 400 },
    );
  }

  const resolution = resolveReasoningProvider();

  if (!resolution.ok) {
    console.error('Guardian reasoning provider is unavailable', {
      provider: resolution.name,
      category: resolution.failure,
    });

    return NextResponse.json<ReasoningResult>(
      {
        status: 'unavailable',
        message:
          'Guardian cannot review this understanding yet because its reasoning service is not configured.',
      },
      { status: 503 },
    );
  }

  try {
    const output = await resolution.provider.reason(parsedRequest.data);

    return NextResponse.json<ReasoningResult>({ status: 'ready', output });
  } catch (error) {
    logReasoningFailure(resolution.name, error);

    return NextResponse.json<ReasoningResult>(
      {
        status: 'unavailable',
        message:
          'Guardian could not form a reliable view just now. Your understanding is still preserved.',
      },
      { status: 503 },
    );
  }
}
