export type Confidence = 'High' | 'Medium' | 'Low';

export type UnderstandingArea = {
  id: string;
  label: string;
  description: string;
  confidence: Confidence;
};

export type LearningPrompt = {
  id: string;
  areaId: string;
  prompt: string;
  supportingText: string;
  reflection: string;
  synthesize: (response: string) => string;
};

export type UnderstandingCard = {
  id: string;
  areaId: string;
  response: string;
  summary: string;
  context: string[];
};

export const understandingAreas: UnderstandingArea[] = [
  {
    id: 'problem',
    label: 'Problem',
    description: 'What deserves to be solved.',
    confidence: 'High',
  },
  {
    id: 'customer',
    label: 'Customer',
    description: 'Who feels the problem most.',
    confidence: 'High',
  },
  {
    id: 'business-model',
    label: 'Business Model',
    description: 'How value becomes sustainable.',
    confidence: 'Medium',
  },
  {
    id: 'current-stage',
    label: 'Current Stage',
    description: 'Where the company is today.',
    confidence: 'Medium',
  },
  {
    id: 'advantage',
    label: 'Competitive Advantage',
    description: 'What may be difficult to copy.',
    confidence: 'Low',
  },
];

export const learningPrompts: LearningPrompt[] = [
  {
    id: 'problem',
    areaId: 'problem',
    prompt: 'What problem is important enough for your company to solve?',
    supportingText: 'Start with the friction you believe should no longer exist.',
    reflection: 'That gives me a clearer view of the problem at the center of your company.',
    synthesize: (response) => response,
  },
  {
    id: 'customer',
    areaId: 'customer',
    prompt: 'Who experiences this problem most directly?',
    supportingText: 'A useful answer identifies the person or team carrying the cost today.',
    reflection: 'That helps clarify whose decisions and constraints Guardian should understand.',
    synthesize: (response) => response,
  },
  {
    id: 'business-model',
    areaId: 'business-model',
    prompt: 'How do you expect the company to create and capture value?',
    supportingText: 'You can describe the model as it exists today, even if it is still evolving.',
    reflection:
      'I have a more useful starting point for how the business could become sustainable.',
    synthesize: (response) => response,
  },
  {
    id: 'current-stage',
    areaId: 'current-stage',
    prompt: "What is most true about the company's current stage?",
    supportingText: 'For example: validating demand, building, selling, or finding repeatability.',
    reflection: 'That gives me better context for the decisions that are likely to matter next.',
    synthesize: (response) => response,
  },
  {
    id: 'advantage',
    areaId: 'advantage',
    prompt: 'What could make your company difficult to replace if it works?',
    supportingText: 'It is fine if this is still a hypothesis rather than a proven advantage.',
    reflection: 'I have an initial view of where a defensible advantage may emerge.',
    synthesize: (response) => response,
  },
];
