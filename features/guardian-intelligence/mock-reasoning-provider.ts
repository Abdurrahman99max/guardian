import type { ReasoningProvider } from './reasoning-provider';
import type { ReasoningOutput, ReasoningRequest } from './types';

/** A deterministic provider for isolated UI development. It is never used as a silent production fallback. */
export class MockReasoningProvider implements ReasoningProvider {
  async reason({ evidence }: ReasoningRequest): Promise<ReasoningOutput> {
    const supportingEvidence = evidence.slice(0, 2).map((item) => ({
      evidenceId: item.id,
      supportType: item.certainty,
      explanation: `This is grounded in what you shared about ${item.areaLabel.toLowerCase()}.`,
    }));

    return {
      evidence,
      evidenceReview: {
        confirmedEvidence: [],
        founderClaims: supportingEvidence.filter(
          (reference) => reference.supportType === 'founder_claim',
        ),
        inferences: supportingEvidence.filter((reference) => reference.supportType === 'inferred'),
        assumptions: supportingEvidence.filter(
          (reference) => reference.supportType === 'assumption',
        ),
        unsupportedLeaps: [],
      },
      tensions: [],
      model: {
        understanding: evidence
          .filter((item) => item.kind === 'understanding_summary')
          .map((item) => ({
            areaId: item.areaId,
            areaLabel: item.areaLabel,
            summary: item.content,
            change: 'created',
          })),
        strategicStrengths: ['Guardian has an initial view of the company’s central problem.'],
        strategicRisks: ['The path from value to repeatable adoption is still uncertain.'],
        unknownAreas: ['How customers discover and decide to adopt the company.'],
      },
      hypotheses: [
        {
          id: 'distribution',
          title: 'A repeatable route to the right customer may be the immediate constraint.',
          explanation: 'The available evidence points toward an adoption question worth testing.',
          supportingEvidence,
          conflictingEvidence: [],
          unknowns: ['How customers currently discover the company.'],
          confidence: 'Moderate',
          confidenceRationale:
            'This fits the current evidence, but it has not been tested against customer acquisition data.',
          status: 'Leading',
        },
        {
          id: 'positioning',
          title: 'The offer may need sharper positioning for a defined customer.',
          explanation:
            'This remains plausible if the value is real but not immediately clear to the right audience.',
          supportingEvidence,
          conflictingEvidence: [],
          unknowns: ['Which message currently resonates with the intended customer.'],
          confidence: 'Low',
          confidenceRationale:
            'There is not yet enough direct evidence about customer language or conversion.',
          status: 'Active',
        },
        {
          id: 'product',
          title: 'Product capability may still be limiting early momentum.',
          explanation:
            'The evidence does not rule this out, although it is less supported at this stage.',
          supportingEvidence: [],
          conflictingEvidence: supportingEvidence,
          unknowns: ['Where customers experience the most friction in the current product.'],
          confidence: 'Low',
          confidenceRationale: 'Guardian does not yet have direct product-usage evidence.',
          status: 'Weakening',
        },
      ],
      currentStrategicView: {
        title: 'The clearest current question is how value becomes repeatable adoption.',
        explanation:
          'Based on what Guardian currently understands, customer access is a more useful area to investigate than a single fixed conclusion.',
        supportingEvidence,
        conflictingEvidence: [],
        unknowns: ['How customers find, evaluate, and choose the company.'],
        confidence: 'Moderate',
        confidenceRationale:
          'The view reflects available founder evidence and remains open to correction.',
      },
      perspectiveShift: null,
      decisionContext: {
        summary:
          'Guardian has enough context to hold useful hypotheses, but not enough to guide a decision responsibly.',
        nextAction: 'clarify',
        rationale:
          'A clearer view of customer discovery would distinguish the strongest competing explanations.',
        question: 'How do your most promising customers currently discover your company?',
        informationGain: {
          uncertaintiesAddressed: ['How prospective customers discover the company.'],
          hypothesesDifferentiated: ['distribution', 'positioning'],
          expectedConfidenceEffect: 'clarify',
        },
      },
    };
  }
}
