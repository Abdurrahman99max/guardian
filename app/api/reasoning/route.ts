import { NextResponse } from 'next/server';

import { OpenAIReasoningProvider } from '@/features/guardian-intelligence/openai-reasoning-provider';
import { reasoningRequestSchema } from '@/features/guardian-intelligence/reasoning-schemas';
import type { ReasoningResult } from '@/features/guardian-intelligence/types';

export const runtime = 'nodejs';

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

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
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
    const provider = new OpenAIReasoningProvider(
      apiKey,
      process.env.OPENAI_REASONING_MODEL ?? 'gpt-5.6-sol',
    );
    const output = await provider.reason(parsedRequest.data);

    return NextResponse.json<ReasoningResult>({ status: 'ready', output });
  } catch {
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
