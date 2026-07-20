import { NextResponse } from 'next/server';

import {
  isTransientReasoningFailure,
  logReasoningFailure,
  logReasoningRetry,
} from '@/features/guardian-intelligence/reasoning-diagnostics';
import type { ReasoningProvider } from '@/features/guardian-intelligence/reasoning-provider';
import { resolveReasoningProvider } from '@/features/guardian-intelligence/reasoning-provider-resolver';
import { reasoningRequestSchema } from '@/features/guardian-intelligence/reasoning-schemas';
import type { ReasoningRequest, ReasoningResult } from '@/features/guardian-intelligence/types';

export const runtime = 'nodejs';

const transientRetryDelayMs = 250;

function pause(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function reasonWithTransientRetry(
  providerName: string,
  provider: ReasoningProvider,
  request: ReasoningRequest,
) {
  try {
    return await provider.reason(request);
  } catch (error) {
    if (!isTransientReasoningFailure(error)) throw error;

    logReasoningRetry(providerName, error);
    await pause(transientRetryDelayMs);
    return provider.reason(request);
  }
}

export async function POST(request: Request) {
  const parsedRequest = reasoningRequestSchema.safeParse(await request.json());

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
    const output = await reasonWithTransientRetry(
      resolution.name,
      resolution.provider,
      parsedRequest.data,
    );

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
