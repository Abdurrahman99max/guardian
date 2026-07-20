import type { ReasoningOutput, ReasoningRequest } from './types';

export interface ReasoningProvider {
  reason(request: ReasoningRequest): Promise<ReasoningOutput>;
}
