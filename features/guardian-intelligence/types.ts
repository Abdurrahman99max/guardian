export type ConfidenceLevel = 'Low' | 'Moderate' | 'High';
export type HypothesisStatus = 'Active' | 'Weakening' | 'Rejected' | 'Leading';
export type EvidenceKind = 'founder_response' | 'understanding_summary' | 'added_context';
export type EvidenceCertainty = 'confirmed' | 'founder_claim' | 'inferred' | 'assumption';
export type NextCognitiveAction =
  'ask' | 'clarify' | 'challenge' | 'explain' | 'ready_for_guidance';
export type GuardianMode = 'learning' | 'decision';
export type ReadinessLevel = 'limited' | 'developing' | 'sufficient';
export type StrategicFocusKind = 'single' | 'linked_pair';
export type DecisionBriefStatus = 'current' | 'superseded' | 'archived';
export type StrategicChangeStatus = 'proposed' | 'deferred' | 'accepted';
export type StrategicMilestoneKind = 'automatic' | 'founder_pinned';
export type StrategicJournalQuery =
  | 'why_did_this_change'
  | 'what_evidence_changed'
  | 'what_did_this_replace'
  | 'how_confidence_evolved';

export type FounderEvidence = {
  id: string;
  kind: EvidenceKind;
  certainty: EvidenceCertainty;
  areaId: string;
  areaLabel: string;
  content: string;
};

export type EvidenceReference = {
  evidenceId: string;
  supportType: EvidenceCertainty;
  explanation: string;
};

export type EvidenceReview = {
  confirmedEvidence: EvidenceReference[];
  founderClaims: EvidenceReference[];
  inferences: EvidenceReference[];
  assumptions: EvidenceReference[];
  unsupportedLeaps: string[];
};

export type ReasoningTension = {
  id: string;
  statement: string;
  evidence: EvidenceReference[];
  materiality: 'material' | 'minor';
  clarificationNeeded: string;
};

export type UnderstandingUpdate = {
  areaId: string;
  areaLabel: string;
  summary: string;
  change: 'created' | 'strengthened' | 'weakened' | 'contradicted' | 'expanded';
};

export type StrategicHypothesis = {
  id: string;
  title: string;
  explanation: string;
  supportingEvidence: EvidenceReference[];
  conflictingEvidence: EvidenceReference[];
  unknowns: string[];
  confidence: ConfidenceLevel;
  confidenceRationale: string;
  status: HypothesisStatus;
};

export type CurrentStrategicView = {
  title: string;
  explanation: string;
  supportingEvidence: EvidenceReference[];
  conflictingEvidence: EvidenceReference[];
  unknowns: string[];
  confidence: ConfidenceLevel;
  confidenceRationale: string;
};

export type PerspectiveShift = {
  title: string;
  explanation: string;
  evidence: EvidenceReference[];
};

export type DecisionContext = {
  summary: string;
  nextAction: NextCognitiveAction;
  rationale: string;
  question: string | null;
  informationGain: {
    uncertaintiesAddressed: string[];
    hypothesesDifferentiated: string[];
    expectedConfidenceEffect: 'increase' | 'decrease' | 'clarify';
  };
};

export type DecisionReadiness = {
  mode: GuardianMode;
  evidenceSufficiency: ReadinessLevel;
  evidenceConsistency: ReadinessLevel;
  hypothesisSeparation: ReadinessLevel;
  criticalUnknowns: string[];
  decisionStability: ReadinessLevel;
  rationale: string;
};

export type StrategicFocus = {
  kind: StrategicFocusKind;
  title: string;
  linkedFocuses: string[];
  whyLinked: string | null;
};

export type DecisionBriefDraft = {
  strategicFocus: StrategicFocus;
  whyThisMatters: string;
  supportingEvidence: EvidenceReference[];
  alternativeInterpretation: string;
  remainingUncertainty: string[];
  decisionReadiness: DecisionReadiness;
  nextLearningObjective: string;
  transitionConditions: string[];
  confidence: ConfidenceLevel;
};

export type DecisionPublication = {
  mode: GuardianMode;
  reason: string;
};

export type DecisionBrief = DecisionBriefDraft & {
  id: string;
  version: number;
  sessionId: string;
};

export type JournalDecisionBrief = DecisionBrief & {
  status: DecisionBriefStatus;
  predecessorId: string | null;
  supersededById: string | null;
};

export type StrategicTransition = {
  id: string;
  fromBriefId: string;
  toBriefId: string;
  observation: string;
  supportingEvidence: EvidenceReference[];
  confidenceChange: string;
  rationale: string;
};

export type StrategicChangeProposal = {
  id: string;
  status: StrategicChangeStatus;
  currentBriefId: string;
  candidate: DecisionBrief;
  observation: string;
  supportingEvidence: EvidenceReference[];
  rationale: string;
  proposedNextStep: string;
};

export type StrategicMilestone = {
  id: string;
  briefId: string;
  kind: StrategicMilestoneKind;
  title: string;
  description: string;
};

export type StrategicJournalAnswer = {
  query: StrategicJournalQuery;
  answer: string;
  evidence: EvidenceReference[];
  relatedBriefId: string | null;
};

export type StrategicModel = {
  understanding: UnderstandingUpdate[];
  strategicStrengths: string[];
  strategicRisks: string[];
  unknownAreas: string[];
};

export type ReasoningOutput = {
  evidence: FounderEvidence[];
  evidenceReview: EvidenceReview;
  tensions: ReasoningTension[];
  model: StrategicModel;
  hypotheses: StrategicHypothesis[];
  currentStrategicView: CurrentStrategicView;
  perspectiveShift: PerspectiveShift | null;
  decisionContext: DecisionContext;
  decisionReadiness: DecisionReadiness;
  decisionPublication: DecisionPublication;
  decisionBrief: DecisionBriefDraft | null;
};

export type ReasoningRequest = {
  evidence: FounderEvidence[];
};

export type ReasoningResult =
  { status: 'ready'; output: ReasoningOutput } | { status: 'unavailable'; message: string };
