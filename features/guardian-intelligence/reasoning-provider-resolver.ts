import 'server-only';

import { GroqReasoningProvider } from './groq-reasoning-provider';
import { OpenAIReasoningProvider } from './openai-reasoning-provider';
import type { ReasoningProvider } from './reasoning-provider';

export type ReasoningProviderName = 'openai' | 'groq';

type ProviderResolution =
  | { ok: true; name: ReasoningProviderName; provider: ReasoningProvider }
  | { ok: false; name: string; failure: 'missing_key' | 'unsupported_provider' };

export function resolveReasoningProvider(
  environment: NodeJS.ProcessEnv = process.env,
): ProviderResolution {
  const name = environment.REASONING_PROVIDER ?? 'openai';

  if (name === 'openai') {
    const apiKey = environment.OPENAI_API_KEY;

    if (!apiKey) return { ok: false, name, failure: 'missing_key' };

    return {
      ok: true,
      name,
      provider: new OpenAIReasoningProvider(
        apiKey,
        environment.OPENAI_REASONING_MODEL ?? 'gpt-5.6-sol',
      ),
    };
  }

  if (name === 'groq') {
    const apiKey = environment.GROQ_API_KEY;

    if (!apiKey) return { ok: false, name, failure: 'missing_key' };

    return {
      ok: true,
      name,
      provider: new GroqReasoningProvider(
        apiKey,
        environment.GROQ_REASONING_MODEL ?? 'openai/gpt-oss-120b',
      ),
    };
  }

  return { ok: false, name, failure: 'unsupported_provider' };
}
