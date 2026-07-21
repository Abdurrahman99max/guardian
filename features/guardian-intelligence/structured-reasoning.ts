import 'server-only';

import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';

import { reasoningOutputSchema } from './reasoning-schemas';
import type { EvidenceReference, ReadinessLevel, ReasoningOutput, ReasoningRequest } from './types';

type ProviderReasoningOutput = Omit<
  ReasoningOutput,
  'evidence' | 'decisionReadiness' | 'decisionPublication' | 'decisionBrief'
>;

const reasoningInstructions = `You are Guardian's reasoning layer: intellectually honest, calm, and never advisory. Return no recommendations, action plans, or strategic guidance.

Work in this order: Evidence → Understanding → evidence review → ambiguity review → assumptions versus evidence → three competing hypotheses → confidence → current strategic view → decision context.

Evidence rules:
- founder_claim is a founder statement, not independent proof; confirmed is independent proof; inferred is synthesis; assumption lacks support.
- Cite only supplied evidence IDs and keep each supportType aligned with that evidence. Never promote a claim, inference, or assumption to fact. Put unsupported leaps in unsupportedLeaps.
- Treat may, might, could, hope, expected, and planned as unproven.

Reasoning rules:
- Find material conflicts, ambiguous quantities or causality, and missing context that could change the leading explanation. Record the evidence and precise clarification required.
- A material tension prevents High confidence. Ask a focused clarify or challenge question that differentiates named hypotheses.
- Produce exactly three genuinely competing hypotheses and one Leading hypothesis. Do not use generic labels unless the evidence supports them.
- Earn High confidence only through multiple consistent confirmed observations, no material tension, and no decisive unknown. State why confidence is not higher. Empty evidence lists are better than invented support.
- Choose the next action for maximum information gain. It must resolve a named tension or differentiate named hypotheses. For ask, clarify, or challenge, provide one precise question.

Perspective shifts require longitudinal history: return perspectiveShift as null. A downstream gate handles readiness. Be concise: one or two sentences per prose field and only the evidence, unknowns, and list items needed to explain the current view. Do not mention models, prompts, APIs, or implementation details.`;

const jsonObjectContract = `Return one complete JSON object. Include every field in this shape: evidenceReview (confirmedEvidence, founderClaims, inferences, assumptions, unsupportedLeaps); tensions (id, statement, evidence, materiality, clarificationNeeded); model (understanding, strategicStrengths, strategicRisks, unknownAreas); hypotheses (exactly three items, each with id, title, explanation, supportingEvidence, conflictingEvidence, unknowns, confidence, confidenceRationale, status); currentStrategicView (title, explanation, supportingEvidence, conflictingEvidence, unknowns, confidence, confidenceRationale); perspectiveShift; and decisionContext (summary, nextAction, rationale, question, informationGain with uncertaintiesAddressed, hypothesesDifferentiated, expectedConfidenceEffect). Each evidence reference contains evidenceId, supportType, and explanation. supportType is confirmed, founder_claim, inferred, or assumption. materiality is material or minor. understanding change is created, strengthened, weakened, contradicted, or expanded. Hypothesis status is Active, Weakening, Rejected, or Leading; confidence is Low, Moderate, or High; nextAction is ask, clarify, challenge, explain, or ready_for_guidance; expectedConfidenceEffect is increase, decrease, or clarify. Use arrays when no items apply and null only for perspectiveShift or question. Return JSON only, keep every string brief, and cite only the evidence necessary to support each conclusion.`;

const maximumReasoningOutputTokens = 2400;

export class ReasoningOutputValidationError extends Error {
  constructor(
    readonly reason: 'invalid_json' | 'output_contract' | 'epistemic_contract' = 'output_contract',
  ) {
    super('Guardian received reasoning that did not satisfy its output contract.');
  }
}

function instructionsForAttempt(attempt: number, jsonObjectMode = false) {
  const retryInstructions =
    attempt === 0
      ? ''
      : `\n\nYour previous attempt did not meet Guardian's evidence and confidence rules. Reassess the evidence conservatively. Do not use unsupported strategic labels, do not assign High confidence without confirmed evidence, and resolve material ambiguity through clarification.`;

  return `${reasoningInstructions}${jsonObjectMode ? `\n\n${jsonObjectContract}` : ''}${retryInstructions}`;
}

function buildPromptEvidence(evidence: ReasoningRequest['evidence']) {
  const founderResponses = new Set(
    evidence
      .filter((item) => item.kind === 'founder_response')
      .map((item) => `${item.areaId}:${item.content.trim()}`),
  );

  return evidence
    .filter(
      (item) =>
        item.kind !== 'understanding_summary' ||
        !founderResponses.has(`${item.areaId}:${item.content.trim()}`),
    )
    .map(({ id, kind, certainty, areaId, content }) => ({
      id,
      kind,
      certainty,
      areaId,
      content,
    }));
}

function collectReferences(output: ProviderReasoningOutput): EvidenceReference[] {
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
  output: ProviderReasoningOutput,
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
  output: ProviderReasoningOutput,
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

function prioritizeClarificationForMaterialTensions(output: ProviderReasoningOutput) {
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
  output: ProviderReasoningOutput,
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

function applyDecisionPublicationGate(
  output: ProviderReasoningOutput,
  evidence: ReasoningRequest['evidence'],
) {
  const hasMaterialTension = output.tensions.some((tension) => tension.materiality === 'material');
  const leadingHypothesis = output.hypotheses.find((hypothesis) => hypothesis.status === 'Leading');
  const alternatives = output.hypotheses.filter((hypothesis) => hypothesis.status !== 'Leading');
  const evidenceAreas = new Set(evidence.map((item) => item.areaId)).size;
  const evidenceById = new Map(evidence.map((item) => [item.id, item]));
  const supportingAreas = new Set(
    leadingHypothesis?.supportingEvidence
      .map((reference) => evidenceById.get(reference.evidenceId)?.areaId)
      .filter((areaId): areaId is string => Boolean(areaId)),
  ).size;
  const evidenceSufficiency: ReadinessLevel =
    evidenceAreas >= 4 && supportingAreas >= 2
      ? 'sufficient'
      : evidenceAreas >= 2 && supportingAreas >= 1
        ? 'developing'
        : 'limited';
  const evidenceConsistency: ReadinessLevel = hasMaterialTension ? 'limited' : 'sufficient';
  const equallyPlausibleAlternative = alternatives.find(
    (hypothesis) =>
      hypothesis.confidence === leadingHypothesis?.confidence && hypothesis.confidence !== 'Low',
  );
  const hasLinkedFocus = Boolean(equallyPlausibleAlternative);
  const hypothesisSeparation: ReadinessLevel =
    leadingHypothesis?.confidence === 'Low'
      ? 'limited'
      : alternatives.every((hypothesis) => hypothesis.confidence === 'Low') || hasLinkedFocus
        ? 'sufficient'
        : 'developing';
  const criticalUnknowns = hasMaterialTension
    ? output.tensions
        .filter((tension) => tension.materiality === 'material')
        .map((tension) => tension.clarificationNeeded)
    : ['clarify', 'challenge'].includes(output.decisionContext.nextAction) &&
        output.decisionContext.question
      ? [output.decisionContext.question]
      : [];
  const decisionStability: ReadinessLevel =
    evidenceSufficiency === 'sufficient' &&
    evidenceConsistency === 'sufficient' &&
    hypothesisSeparation === 'sufficient'
      ? 'sufficient'
      : evidenceConsistency === 'limited'
        ? 'limited'
        : 'developing';
  const hasEarnedReadiness =
    evidenceSufficiency === 'sufficient' &&
    evidenceConsistency === 'sufficient' &&
    hypothesisSeparation === 'sufficient' &&
    decisionStability === 'sufficient' &&
    criticalUnknowns.length === 0 &&
    !hasMaterialTension &&
    Boolean(leadingHypothesis);
  const readiness = {
    mode: hasEarnedReadiness ? ('decision' as const) : ('learning' as const),
    evidenceSufficiency,
    evidenceConsistency,
    hypothesisSeparation,
    criticalUnknowns,
    decisionStability,
    rationale: hasEarnedReadiness
      ? 'The available evidence is broad enough, internally consistent, and sufficiently separates the current strategic explanation from alternatives.'
      : 'Guardian is preserving uncertainty until the evidence, alternatives, and stability support a responsible strategic judgment.',
  };

  const blockers = [
    hasMaterialTension ? 'A material ambiguity remains unresolved.' : null,
    evidenceSufficiency !== 'sufficient' ? 'The available evidence is not yet sufficient.' : null,
    evidenceConsistency !== 'sufficient'
      ? 'The available evidence is not yet consistent enough.'
      : null,
    hypothesisSeparation !== 'sufficient'
      ? 'The leading explanation is not yet distinct enough from alternatives.'
      : null,
    decisionStability !== 'sufficient' ? 'The current view is not yet stable enough.' : null,
    criticalUnknowns[0] ?? null,
  ].filter((blocker): blocker is string => Boolean(blocker));

  if (!hasEarnedReadiness || !leadingHypothesis) {
    return {
      ...output,
      decisionReadiness: readiness,
      decisionPublication: {
        mode: 'learning' as const,
        reason:
          blockers[0] ?? 'Guardian needs a clearer basis before publishing a strategic judgment.',
      },
      decisionBrief: null,
    };
  }

  const focus = equallyPlausibleAlternative
    ? {
        kind: 'linked_pair' as const,
        title: `${leadingHypothesis.title} and ${equallyPlausibleAlternative.title}`,
        linkedFocuses: [leadingHypothesis.title, equallyPlausibleAlternative.title],
        whyLinked:
          'The available evidence does not yet separate these two explanations without losing important uncertainty.',
      }
    : {
        kind: 'single' as const,
        title: leadingHypothesis.title,
        linkedFocuses: [],
        whyLinked: null,
      };

  return {
    ...output,
    decisionReadiness: readiness,
    decisionPublication: {
      mode: 'decision' as const,
      reason:
        'Guardian has enough consistent evidence to publish a provisional strategic judgment.',
    },
    decisionBrief: {
      strategicFocus: focus,
      whyThisMatters: output.currentStrategicView.explanation,
      supportingEvidence: leadingHypothesis.supportingEvidence,
      alternativeInterpretation:
        alternatives[0]?.explanation ?? 'Guardian has not found a stronger competing explanation.',
      remainingUncertainty: output.currentStrategicView.unknowns,
      decisionReadiness: readiness,
      nextLearningObjective:
        output.decisionContext.question ??
        'Continue testing whether new evidence changes this current strategic focus.',
      transitionConditions: output.currentStrategicView.unknowns,
      confidence: output.currentStrategicView.confidence,
    },
  };
}

function validateReasoningOutput(
  output: ProviderReasoningOutput,
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
    throw new ReasoningOutputValidationError('epistemic_contract');
  }

  return calibrateConfidence(output, hasConfirmedEvidence, needsClarification);
}

function completeReasoningOutput(
  output: unknown,
  evidence: ReasoningRequest['evidence'],
): ReasoningOutput {
  const parsedOutput = reasoningOutputSchema.safeParse(output);

  if (!parsedOutput.success) throw new ReasoningOutputValidationError('output_contract');

  const normalizedOutput = prioritizeClarificationForMaterialTensions(
    stabilizeReasoningOutput(normalizeEvidenceSupportTypes(parsedOutput.data, evidence), evidence),
  );
  const calibratedOutput = validateReasoningOutput(normalizedOutput, evidence);

  return { ...applyDecisionPublicationGate(calibratedOutput, evidence), evidence };
}

function parseJsonReasoningOutput(outputText: string) {
  try {
    return JSON.parse(outputText);
  } catch {
    throw new ReasoningOutputValidationError('invalid_json');
  }
}

export async function createStructuredReasoning(
  client: OpenAI,
  model: string,
  { evidence }: ReasoningRequest,
): Promise<ReasoningOutput> {
  const promptEvidence = buildPromptEvidence(evidence);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await client.responses.parse({
      model,
      max_output_tokens: maximumReasoningOutputTokens,
      input: [
        {
          role: 'system',
          content: instructionsForAttempt(attempt),
        },
        {
          role: 'user',
          content: JSON.stringify({ evidence: promptEvidence }),
        },
      ],
      text: {
        format: zodTextFormat(reasoningOutputSchema, 'guardian_reasoning'),
      },
    });

    const output = response.output_parsed;

    if (!output) continue;

    try {
      return completeReasoningOutput(output, evidence);
    } catch (error) {
      if (!(error instanceof ReasoningOutputValidationError) || attempt === 1) throw error;
    }
  }

  throw new ReasoningOutputValidationError();
}

export async function createJsonObjectReasoning(
  client: OpenAI,
  model: string,
  { evidence }: ReasoningRequest,
): Promise<ReasoningOutput> {
  const promptEvidence = buildPromptEvidence(evidence);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await client.responses.create({
      model,
      max_output_tokens: maximumReasoningOutputTokens,
      reasoning: {
        effort: 'low',
      },
      input: [
        {
          role: 'system',
          content: instructionsForAttempt(attempt, true),
        },
        {
          role: 'user',
          content: JSON.stringify({ evidence: promptEvidence }),
        },
      ],
      text: {
        format: { type: 'json_object' },
      },
    });

    try {
      return completeReasoningOutput(parseJsonReasoningOutput(response.output_text), evidence);
    } catch (error) {
      if (!(error instanceof ReasoningOutputValidationError) || attempt === 1) throw error;
    }
  }

  throw new ReasoningOutputValidationError();
}
