import 'server-only';

import OpenAI from 'openai';

import { ReasoningOutputValidationError } from './structured-reasoning';

export type ReasoningFailureCategory =
  | 'authentication'
  | 'quota'
  | 'rate_limit'
  | 'model_access'
  | 'provider_unavailable'
  | 'schema_validation'
  | 'unknown';

export function classifyReasoningFailure(error: unknown): ReasoningFailureCategory {
  if (error instanceof ReasoningOutputValidationError) return 'schema_validation';

  if (error instanceof OpenAI.APIError) {
    if (error.status === 401) return 'authentication';
    if (error.status === 404) return 'model_access';
    if (error.status === 429) {
      return error.code === 'insufficient_quota' ? 'quota' : 'rate_limit';
    }
    if (error.status >= 500) return 'provider_unavailable';
  }

  return 'unknown';
}

export function logReasoningFailure(provider: string, error: unknown) {
  console.error('Guardian reasoning provider failed', {
    provider,
    category: classifyReasoningFailure(error),
  });
}
