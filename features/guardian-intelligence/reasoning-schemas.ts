import { z } from 'zod';

export const founderEvidenceSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['founder_response', 'understanding_summary', 'added_context']),
  certainty: z.enum(['confirmed', 'founder_claim', 'inferred', 'assumption']),
  areaId: z.string().min(1),
  areaLabel: z.string().min(1),
  content: z.string().min(1),
});

export const reasoningRequestSchema = z.object({
  evidence: z.array(founderEvidenceSchema).min(1).max(30),
});

const evidenceReferenceSchema = z.object({
  evidenceId: z.string().min(1),
  supportType: z.enum(['confirmed', 'founder_claim', 'inferred', 'assumption']),
  explanation: z.string().min(1),
});

const hypothesisSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  explanation: z.string().min(1),
  supportingEvidence: z.array(evidenceReferenceSchema),
  conflictingEvidence: z.array(evidenceReferenceSchema),
  unknowns: z.array(z.string().min(1)),
  confidence: z.enum(['Low', 'Moderate', 'High']),
  confidenceRationale: z.string().min(1),
  status: z.enum(['Active', 'Weakening', 'Rejected', 'Leading']),
});

export const reasoningOutputSchema = z.object({
  evidenceReview: z.object({
    confirmedEvidence: z.array(evidenceReferenceSchema),
    founderClaims: z.array(evidenceReferenceSchema),
    inferences: z.array(evidenceReferenceSchema),
    assumptions: z.array(evidenceReferenceSchema),
    unsupportedLeaps: z.array(z.string().min(1)),
  }),
  tensions: z.array(
    z.object({
      id: z.string().min(1),
      statement: z.string().min(1),
      evidence: z.array(evidenceReferenceSchema).min(1),
      materiality: z.enum(['material', 'minor']),
      clarificationNeeded: z.string().min(1),
    }),
  ),
  model: z.object({
    understanding: z.array(
      z.object({
        areaId: z.string().min(1),
        areaLabel: z.string().min(1),
        summary: z.string().min(1),
        change: z.enum(['created', 'strengthened', 'weakened', 'contradicted', 'expanded']),
      }),
    ),
    strategicStrengths: z.array(z.string().min(1)),
    strategicRisks: z.array(z.string().min(1)),
    unknownAreas: z.array(z.string().min(1)),
  }),
  hypotheses: z.array(hypothesisSchema).length(3),
  currentStrategicView: z.object({
    title: z.string().min(1),
    explanation: z.string().min(1),
    supportingEvidence: z.array(evidenceReferenceSchema),
    conflictingEvidence: z.array(evidenceReferenceSchema),
    unknowns: z.array(z.string().min(1)),
    confidence: z.enum(['Low', 'Moderate', 'High']),
    confidenceRationale: z.string().min(1),
  }),
  perspectiveShift: z
    .object({
      title: z.string().min(1),
      explanation: z.string().min(1),
      evidence: z.array(evidenceReferenceSchema),
    })
    .nullable(),
  decisionContext: z.object({
    summary: z.string().min(1),
    nextAction: z.enum(['ask', 'clarify', 'challenge', 'explain', 'ready_for_guidance']),
    rationale: z.string().min(1),
    question: z.string().min(1).nullable(),
    informationGain: z.object({
      uncertaintiesAddressed: z.array(z.string().min(1)),
      hypothesesDifferentiated: z.array(z.string().min(1)),
      expectedConfidenceEffect: z.enum(['increase', 'decrease', 'clarify']),
    }),
  }),
});
