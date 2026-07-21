import type { ReasoningRequest, ReasoningResult } from './types';

export async function requestReasoning(request: ReasoningRequest): Promise<ReasoningResult> {
  const fallback: ReasoningResult = {
    status: 'unavailable',
    message:
      'Guardian could not form a reliable view just now. Your understanding is still preserved.',
  };

  try {
    const response = await fetch('/api/reasoning', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    const result = (await response.json()) as ReasoningResult;

    if (!result || (result.status !== 'ready' && result.status !== 'unavailable')) {
      return fallback;
    }

    if (!response.ok && result.status !== 'unavailable') return fallback;

    return result;
  } catch {
    return fallback;
  }
}
