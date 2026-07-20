import 'server-only';

import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';

import { reasoningOutputSchema } from './reasoning-schemas';
import type { EvidenceReference, ReasoningOutput, ReasoningRequest } from './types';

const reasoningInstructions = `You are Guardian's reasoning layer for founders. Your purpose is intellectual honesty, not persuasive analysis. You do not give recommendations, action plans, or strategic advice.

Transform founder evidence using this sequence:
Evidence -> Understanding -> Evidence Review -> Contradiction and Ambiguity Review -> Assumption versus Evidence Classification -> Competing Hypotheses -> Confidence Calibration -> Current Strategic View -> Decision Context -> Next Cognitive Action.

Evidence discipline:
- founder_claim means the founder stated it, not that it is independently confirmed.
- confirmed is independently established evidence. inferred is Guardian's synthesis. assumption is a possibility that lacks enough support.
- Every evidence reference must use an ID from the supplied evidence and must set supportType to that evidence item's certainty exactly.
- Do not turn a founder claim, an inference, or an assumption into a fact.
- Add unsupported reasoning leaps to evidenceReview.unsupportedLeaps instead of using them as conclusions.

Contradiction and ambiguity review:
- Search actively for conflicting statements, ambiguous quantities, unclear causal claims, and missing context that would change the leading explanation.
- Record every material tension with the relevant evidence IDs and the exact clarification needed.
- If a material tension exists, confidence cannot be High. Prefer clarify or challenge, ask a precise question, and explain which hypotheses the answer would differentiate.
- Do not treat words such as may, might, could, hope, expected, or planned as proof of a current capability or outcome.

Hypotheses and confidence:
- Produce exactly three genuinely competing explanations and exactly one Leading hypothesis. Do not reuse generic adoption, pricing, or execution templates unless the supplied evidence makes them relevant.
- High confidence requires multiple mutually consistent confirmed observations, no material unresolved tension, and no important unknown that could plausibly change the view. Moderate is the normal early-stage state.
- Confidence must be earned by resolving uncertainty. State why it is not higher.
- Every hypothesis and the current strategic view must use supporting and conflicting evidence honestly. Empty lists are preferable to invented support.

Decision context:
- Choose the next cognitive action that maximizes information gain: it must reduce uncertainty between named competing hypotheses or resolve a named tension.
- When asking, clarifying, or challenging, provide one question and identify the uncertainties and hypotheses it can differentiate.
- Stop at Decision Context. Do not recommend, advise, prescribe, prioritize, propose a pivot, or present an action plan.
- Perspective shifts require longitudinal comparison and are unavailable in this single-pass reasoning request. Always return perspectiveShift as null.

Use calm, clear founder-facing language. Do not mention models, prompts, APIs, or implementation details.`;

export class ReasoningOutputValidationError extends Error {
  constructor() {
    super('Guardian received reasoning that did not satisfy its output contract.');
  }
}

function collectReferences(output: Omit<ReasoningOutput, 'evidence'>): EvidenceReference[] {
  return [
    ...output.evidenceReview.confirmedEvidence,
    ...output.evidenceReview.founderClaims,
    ...output.evidenceReview.inferences,
    ...output.evidenceReview.assumptions,
    ...output.tensions.flatMap((tension) => tension.evidence),
    ...output.hypotheses.flatMap((hypothesis) => [
      ...hypothesis.supportingEvidence,
      ...hypothesis.conflictingEvidence,
    ]),
    ...output.currentStrategicView.supportingEvidence,
    ...output.currentStrategicView.conflictingEvidence,
  ];
}

function calibrateConfidence(
  output: Omit<ReasoningOutput, 'evidence'>,
  hasConfirmedEvidence: boolean,
  hasMaterialTension: boolean,
) {
  if (hasConfirmedEvidence && !hasMaterialTension) return output;

  const rationale = hasMaterialTension
    ? 'This cannot be higher while a material ambiguity remains unresolved.'
    : 'This cannot be higher because the current view relies on founder claims rather than independently confirmed evidence.';
  const calibrate = <T extends { confidence: string; confidenceRationale: string }>(item: T): T =>
    item.confidence === 'High'
      ? { ...item, confidence: 'Moderate', confidenceRationale: rationale }
      : item;

  return {
    ...output,
    hypotheses: output.hypotheses.map(calibrate),
    currentStrategicView: calibrate(output.currentStrategicView),
  };
}

function normalizeEvidenceSupportTypes(
  output: Omit<ReasoningOutput, 'evidence'>,
  evidence: ReasoningRequest['evidence'],
) {
  const evidenceById = new Map(evidence.map((item) => [item.id, item]));
  const normalizeReference = (reference: EvidenceReference): EvidenceReference => {
    const source = evidenceById.get(reference.evidenceId);
    return source ? { ...reference, supportType: source.certainty } : reference;
  };

  return {
    ...output,
    evidenceReview: {
      ...output.evidenceReview,
      confirmedEvidence: output.evidenceReview.confirmedEvidence.map(normalizeReference),
      founderClaims: output.evidenceReview.founderClaims.map(normalizeReference),
      inferences: output.evidenceReview.inferences.map(normalizeReference),
      assumptions: output.evidenceReview.assumptions.map(normalizeReference),
    },
    tensions: output.tensions.map((tension) => ({
      ...tension,
      evidence: tension.evidence.map(normalizeReference),
    })),
    hypotheses: output.hypotheses.map((hypothesis) => ({
      ...hypothesis,
      supportingEvidence: hypothesis.supportingEvidence.map(normalizeReference),
      conflictingEvidence: hypothesis.conflictingEvidence.map(normalizeReference),
    })),
    currentStrategicView: {
      ...output.currentStrategicView,
      supportingEvidence: output.currentStrategicView.supportingEvidence.map(normalizeReference),
      conflictingEvidence: output.currentStrategicView.conflictingEvidence.map(normalizeReference),
    },
  };
}

function prioritizeClarificationForMaterialTensions(output: Omit<ReasoningOutput, 'evidence'>) {
  if (!output.tensions.some((tension) => tension.materiality === 'material')) return output;

  return {
    ...output,
    decisionContext: {
      ...output.decisionContext,
      nextAction: 'clarify' as const,
      informationGain: {
        ...output.decisionContext.informationGain,
        expectedConfidenceEffect: 'clarify' as const,
      },
    },
  };
}

function stabilizeReasoningOutput(
  output: Omit<ReasoningOutput, 'evidence'>,
  evidence: ReasoningRequest['evidence'],
) {
  const evidenceIds = new Set(evidence.map((item) => item.id));
  const keepKnownReferences = (references: EvidenceReference[]) =>
    references.filter((reference) => evidenceIds.has(reference.evidenceId));
  const tensions = output.tensions
    .map((tension) => ({ ...tension, evidence: keepKnownReferences(tension.evidence) }))
    .filter((tension) => tension.evidence.length > 0);
  const leadingIndex = output.hypotheses.findIndex((hypothesis) => hypothesis.status === 'Leading');
  const selectedLeadingIndex = leadingIndex >= 0 ? leadingIndex : 0;
  const hypotheses = output.hypotheses.map((hypothesis, index) => ({
    ...hypothesis,
    status: index === selectedLeadingIndex ? ('Leading' as const) : ('Active' as const),
    supportingEvidence: keepKnownReferences(hypothesis.supportingEvidence),
    conflictingEvidence: keepKnownReferences(hypothesis.conflictingEvidence),
  }));
  const materialTensions = tensions.filter((tension) => tension.materiality === 'material');
  const defaultQuestion = materialTensions[0]?.clarificationNeeded ?? null;
  const actionNeedsQuestion = ['ask', 'clarify', 'challenge'].includes(
    output.decisionContext.nextAction,
  );

  return {
    ...output,
    evidenceReview: {
      ...output.evidenceReview,
      confirmedEvidence: keepKnownReferences(output.evidenceReview.confirmedEvidence),
      founderClaims: keepKnownReferences(output.evidenceReview.founderClaims),
      inferences: keepKnownReferences(output.evidenceReview.inferences),
      assumptions: keepKnownReferences(output.evidenceReview.assumptions),
    },
    tensions,
    hypotheses,
    currentStrategicView: {
      ...output.currentStrategicView,
      supportingEvidence: keepKnownReferences(output.currentStrategicView.supportingEvidence),
      conflictingEvidence: keepKnownReferences(output.currentStrategicView.conflictingEvidence),
    },
    decisionContext: {
      ...output.decisionContext,
      question:
        output.decisionContext.question ??
        (actionNeedsQuestion || materialTensions.length > 0 ? defaultQuestion : null),
      informationGain: {
        ...output.decisionContext.informationGain,
        uncertaintiesAddressed:
          output.decisionContext.informationGain.uncertaintiesAddressed.length > 0
            ? output.decisionContext.informationGain.uncertaintiesAddressed
            : materialTensions.map((tension) => tension.statement),
        hypothesesDifferentiated:
          output.decisionContext.informationGain.hypothesesDifferentiated.length > 0
            ? output.decisionContext.informationGain.hypothesesDifferentiated
            : hypotheses.map((hypothesis) => hypothesis.id),
      },
    },
  };
}

function validateReasoningOutput(
  output: Omit<ReasoningOutput, 'evidence'>,
  evidence: ReasoningRequest['evidence'],
) {
  const evidenceIds = new Set(evidence.map((item) => item.id));
  const references = collectReferences(output);
  const hasUnknownEvidenceReference = references.some(
    (reference) => !evidenceIds.has(reference.evidenceId),
  );
  const hasOneLeadingHypothesis =
    output.hypotheses.filter((hypothesis) => hypothesis.status === 'Leading').length === 1;
  const materialTensions = output.tensions.filter((tension) => tension.materiality === 'material');
  const hasConfirmedEvidence = evidence.some((item) => item.certainty === 'confirmed');
  const needsClarification = materialTensions.length > 0;
  const actionRequiresQuestion = ['ask', 'clarify', 'challenge'].includes(
    output.decisionContext.nextAction,
  );
  const hasInformationGain =
    output.decisionContext.informationGain.uncertaintiesAddressed.length > 0 &&
    output.decisionContext.informationGain.hypothesesDifferentiated.length > 0;

  if (
    hasUnknownEvidenceReference ||
    !hasOneLeadingHypothesis ||
    (needsClarification &&
      (!['clarify', 'challenge'].includes(output.decisionContext.nextAction) ||
        !output.decisionContext.question ||
        !hasInformationGain ||
        output.decisionContext.informationGain.expectedConfidenceEffect !== 'clarify')) ||
    (actionRequiresQuestion && (!output.decisionContext.question || !hasInformationGain))
  ) {
    throw new ReasoningOutputValidationError();
  }

  return calibrateConfidence(output, hasConfirmedEvidence, needsClarification);
}

export async function createStructuredReasoning(
  client: OpenAI,
  model: string,
  { evidence }: ReasoningRequest,
): Promise<ReasoningOutput> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await client.responses.parse({
      model,
      max_output_tokens: 6000,
      input: [
        {
          role: 'system',
          content:
            attempt === 0
              ? reasoningInstructions
              : `${reasoningInstructions}\n\nYour previous attempt did not meet Guardian's evidence and confidence rules. Reassess the evidence conservatively. Do not use unsupported strategic labels, do not assign High confidence without confirmed evidence, and resolve material ambiguity through clarification.`,
        },
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

    if (!output) continue;

    try {
      const normalizedOutput = prioritizeClarificationForMaterialTensions(
        stabilizeReasoningOutput(normalizeEvidenceSupportTypes(output, evidence), evidence),
      );
      const calibratedOutput = validateReasoningOutput(normalizedOutput, evidence);
      return { ...calibratedOutput, evidence };
    } catch (error) {
      if (!(error instanceof ReasoningOutputValidationError) || attempt === 1) throw error;
    }
  }

  throw new ReasoningOutputValidationError();
}
