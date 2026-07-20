import type { ReasoningRequest, ReasoningResult } from './types';

export async function requestReasoning(request: ReasoningRequest): Promise<ReasoningResult> {
  const response = await fetch('/api/reasoning', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const result = (await response.json()) as ReasoningResult;

  if (!response.ok && result.status !== 'unavailable') {
    return {
      status: 'unavailable',
      message:
        'Guardian could not form a reliable view yet. Your understanding is still preserved.',
    };
  }

  return result;
}
