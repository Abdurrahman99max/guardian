export type ConfidenceLevel = 'Low' | 'Moderate' | 'High';
export type HypothesisStatus = 'Active' | 'Weakening' | 'Rejected' | 'Leading';
export type EvidenceKind = 'founder_response' | 'understanding_summary' | 'added_context';
export type EvidenceCertainty = 'confirmed' | 'inferred' | 'assumption';
export type NextCognitiveAction =
  'ask' | 'clarify' | 'challenge' | 'explain' | 'ready_for_guidance';

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
  explanation: string;
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
};

export type StrategicModel = {
  understanding: UnderstandingUpdate[];
  strategicStrengths: string[];
  strategicRisks: string[];
  unknownAreas: string[];
};

export type ReasoningOutput = {
  evidence: FounderEvidence[];
  model: StrategicModel;
  hypotheses: StrategicHypothesis[];
  currentStrategicView: CurrentStrategicView;
  perspectiveShift: PerspectiveShift | null;
  decisionContext: DecisionContext;
};

export type ReasoningRequest = {
  evidence: FounderEvidence[];
};

export type ReasoningResult =
  { status: 'ready'; output: ReasoningOutput } | { status: 'unavailable'; message: string };
