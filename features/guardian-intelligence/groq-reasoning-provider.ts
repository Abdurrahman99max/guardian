import 'server-only';

import OpenAI from 'openai';

import type { ReasoningProvider } from './reasoning-provider';
import { createStructuredReasoning } from './structured-reasoning';
import type { ReasoningOutput, ReasoningRequest } from './types';

const groqBaseUrl = 'https://api.groq.com/openai/v1';

export class GroqReasoningProvider implements ReasoningProvider {
  private readonly client: OpenAI;

  constructor(
    apiKey: string,
    private readonly model: string,
  ) {
    this.client = new OpenAI({ apiKey, baseURL: groqBaseUrl });
  }

  reason(request: ReasoningRequest): Promise<ReasoningOutput> {
    return createStructuredReasoning(this.client, this.model, request);
  }
}
