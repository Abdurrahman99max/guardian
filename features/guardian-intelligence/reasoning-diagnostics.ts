import 'server-only';

import OpenAI from 'openai';

import { ReasoningOutputValidationError } from './structured-reasoning';

export type ReasoningFailureCategory =
  | 'authentication'
  | 'quota'
  | 'rate_limit'
  | 'model_access'
  | 'invalid_request'
  | 'network'
  | 'timeout'
  | 'provider_unavailable'
  | 'schema_validation'
  | 'unknown';

export function classifyReasoningFailure(error: unknown): ReasoningFailureCategory {
  if (error instanceof ReasoningOutputValidationError) return 'schema_validation';

  if (error instanceof OpenAI.APIConnectionTimeoutError) return 'timeout';
  if (error instanceof OpenAI.APIConnectionError) return 'network';

  if (error instanceof OpenAI.APIError) {
    if (error.status === 401) return 'authentication';
    if (error.status === 403) return 'model_access';
    if (error.status === 404) return 'model_access';
    if (error.status === 400 || error.status === 422) return 'invalid_request';
    if (error.status === 429) {
      return error.code === 'insufficient_quota' ? 'quota' : 'rate_limit';
    }
    if (error.status >= 500) return 'provider_unavailable';
  }

  return 'unknown';
}

export function isTransientReasoningFailure(error: unknown) {
  const category = classifyReasoningFailure(error);
  return (
    category === 'network' ||
    category === 'timeout' ||
    category === 'rate_limit' ||
    category === 'provider_unavailable'
  );
}

export function logReasoningRetry(provider: string, error: unknown) {
  console.warn('Guardian reasoning provider will retry a transient failure', {
    provider,
    category: classifyReasoningFailure(error),
  });
}

export function logReasoningFailure(provider: string, error: unknown) {
  const apiError = error instanceof OpenAI.APIError ? error : null;

  console.error('Guardian reasoning provider failed', {
    provider,
    category: classifyReasoningFailure(error),
    status: apiError?.status ?? null,
    code: apiError?.code ?? null,
    type: apiError?.type ?? null,
    requestId: apiError?.requestID ?? null,
  });
}
