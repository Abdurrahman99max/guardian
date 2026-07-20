import 'server-only';

import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';

import type { ReasoningProvider } from './reasoning-provider';
import { reasoningOutputSchema } from './reasoning-schemas';
import type { ReasoningOutput, ReasoningRequest } from './types';

const reasoningInstructions = `You are Guardian's reasoning layer for founders. You do not give recommendations.

Transform founder evidence into a transparent strategic model using this sequence:
Evidence -> Understanding -> Competing Hypotheses -> Current Strategic View -> Decision Context.

Rules:
- Use only the supplied evidence. Never invent facts, evidence, metrics, customers, or outcomes.
- Treat founder_response and added_context as confirmed evidence. Treat understanding_summary as an inference, not a confirmed fact.
- Preserve uncertainty. Confidence means confidence in the current explanation, not certainty about objective truth.
- Produce exactly three competing hypotheses and exactly one Leading hypothesis. The other hypotheses must remain plausible alternatives when evidence allows.
- Every evidence reference must use an ID from the supplied evidence. Do not create evidence IDs.
- Supporting and conflicting evidence must be genuinely relevant. Leave either list empty when the supplied evidence does not support it.
- Unknowns must stay unknown. Do not fill gaps with assumptions.
- Current Strategic View is a working interpretation, never a recommendation or definitive conclusion.
- Perspective Shift is optional. Include it only when the combined evidence genuinely changes which explanation is most plausible. Keep it calm and explain why.
- Decision Context chooses one next cognitive action: ask, clarify, challenge, explain, or ready_for_guidance. Do not provide strategic guidance or recommendations. If more understanding would materially improve the view, choose ask or clarify and provide one precise question.
- Use clear, calm, founder-facing language. Do not mention models, prompts, APIs, or implementation details.`;

export class OpenAIReasoningProvider implements ReasoningProvider {
  private readonly client: OpenAI;

  constructor(
    apiKey: string,
    private readonly model: string,
  ) {
    this.client = new OpenAI({ apiKey });
  }

  async reason({ evidence }: ReasoningRequest): Promise<ReasoningOutput> {
    const response = await this.client.responses.parse({
      model: this.model,
      input: [
        { role: 'system', content: reasoningInstructions },
        {
          role: 'user',
          content: JSON.stringify({ evidence }),
        },
      ],
      text: {
        format: zodTextFormat(reasoningOutputSchema, 'guardian_reasoning'),
      },
    });

    const output = response.output_parsed;

    if (!output) {
      throw new Error('Guardian did not receive a structured reasoning output.');
    }

    const evidenceIds = new Set(evidence.map((item) => item.id));
    const references = [
      ...output.hypotheses.flatMap((hypothesis) => [
        ...hypothesis.supportingEvidence,
        ...hypothesis.conflictingEvidence,
      ]),
      ...output.currentStrategicView.supportingEvidence,
      ...output.currentStrategicView.conflictingEvidence,
      ...(output.perspectiveShift?.evidence ?? []),
    ];

    if (
      output.hypotheses.filter((hypothesis) => hypothesis.status === 'Leading').length !== 1 ||
      references.some((reference) => !evidenceIds.has(reference.evidenceId))
    ) {
      throw new Error(
        'Guardian received reasoning that could not be traced to the supplied evidence.',
      );
    }

    return { ...output, evidence };
  }
}
