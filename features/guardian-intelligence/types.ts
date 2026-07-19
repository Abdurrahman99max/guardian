export type ReasoningConfidence = 'Low' | 'Moderate' | 'High';
export type HypothesisStatus = 'Active' | 'Weakening' | 'Rejected' | 'Leading';
export type RecommendationReadiness = 'Not Ready' | 'Almost Ready' | 'Ready';

export type UnderstandingSnapshot = {
  areaId: string;
  summary: string;
};

export type StrategicHypothesis = {
  id: string;
  title: string;
  explanation: string;
  supportingObservations: string[];
  confidence: ReasoningConfidence;
  status: HypothesisStatus;
};

export type PerspectiveShift = {
  title: string;
  explanation: string;
  confidenceChange: string;
};

export type MissingUnderstanding = {
  id: string;
  statement: string;
  whyItMatters: string;
};

export type StrategicModel = {
  understanding: UnderstandingSnapshot[];
  strategicStrengths: string[];
  strategicRisks: string[];
  unknownAreas: string[];
};

export type ReasoningOutput = {
  model: StrategicModel;
  hypotheses: StrategicHypothesis[];
  perspectiveShift: PerspectiveShift;
  missingUnderstanding: MissingUnderstanding[];
  recommendationReadiness: {
    status: RecommendationReadiness;
    explanation: string;
  };
};
