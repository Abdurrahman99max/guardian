import type { ReasoningOutput, StrategicHypothesis, UnderstandingSnapshot } from './types';

function findUnderstanding(
  understanding: UnderstandingSnapshot[],
  areaId: string,
  fallback: string,
) {
  return understanding.find((item) => item.areaId === areaId)?.summary ?? fallback;
}

function createHypotheses(understanding: UnderstandingSnapshot[]): StrategicHypothesis[] {
  const customer = findUnderstanding(
    understanding,
    'customer',
    'the customer carrying the clearest cost today',
  );
  const stage = findUnderstanding(
    understanding,
    'current-stage',
    'the company’s current stage of learning',
  );

  return [
    {
      id: 'repeatable-distribution',
      title: 'The immediate constraint may be finding a repeatable path to customers.',
      explanation:
        'The company appears to have an initial point of view. The more important open question is whether that value can consistently reach and convert the right customer.',
      supportingObservations: [
        `Guardian is currently learning about ${customer}.`,
        `The company describes its current stage as ${stage}.`,
      ],
      confidence: 'Moderate',
      status: 'Leading',
    },
    {
      id: 'positioning-clarity',
      title: 'The offer may still need sharper positioning for a defined customer.',
      explanation:
        'A more precise message could be the limiting factor if the problem is real but the value is not yet immediately legible to the people who experience it.',
      supportingObservations: [
        'Guardian has an initial customer view, but not yet a clear discovery or buying path.',
        'The strongest framing may still be emerging from founder learning.',
      ],
      confidence: 'Low',
      status: 'Active',
    },
    {
      id: 'product-capability',
      title: 'The primary constraint may be product capability.',
      explanation:
        'This remains possible, but the information so far suggests Guardian should first test whether adoption and distribution—not the core product—are limiting progress.',
      supportingObservations: [
        'The current model contains more uncertainty about customer access than about the problem itself.',
        'This explanation has less support than the alternatives above.',
      ],
      confidence: 'Low',
      status: 'Weakening',
    },
  ];
}

export function createMockReasoning(understanding: UnderstandingSnapshot[]): ReasoningOutput {
  const problem = findUnderstanding(
    understanding,
    'problem',
    'the problem the company is choosing to solve',
  );
  const advantage = findUnderstanding(
    understanding,
    'advantage',
    'a potential advantage that is still being tested',
  );

  return {
    model: {
      understanding,
      strategicStrengths: [
        `The company has a defined problem focus: ${problem}.`,
        `Guardian has an early view of a potential advantage: ${advantage}.`,
      ],
      strategicRisks: [
        'The route from early value to repeatable customer adoption is still uncertain.',
        'The current model has not yet tested which explanation most limits momentum.',
      ],
      unknownAreas: [
        'How customers currently discover and evaluate the company.',
        'What pricing or economic model would make adoption sustainable.',
      ],
    },
    hypotheses: createHypotheses(understanding),
    perspectiveShift: {
      title:
        'My attention has shifted from the problem alone to the path between value and adoption.',
      explanation:
        'At first, the problem itself appeared to be the central uncertainty. Based on the model so far, Guardian is now paying closer attention to how the right customer discovers, evaluates, and adopts the company.',
      confidenceChange:
        'This makes the distribution hypothesis more plausible, while keeping the alternatives open.',
    },
    missingUnderstanding: [
      {
        id: 'discovery',
        statement: 'I do not yet understand how customers currently discover the company.',
        whyItMatters:
          'That would help Guardian distinguish a positioning challenge from a distribution challenge.',
      },
      {
        id: 'economics',
        statement:
          'I am still uncertain about the economics behind customer acquisition and pricing.',
        whyItMatters:
          'That would make Guardian more accurate about whether the current path can become sustainable.',
      },
    ],
    recommendationReadiness: {
      status: 'Almost Ready',
      explanation:
        'Guardian has enough context to form useful hypotheses, but not enough to recommend a direction with the level of confidence the founder deserves.',
    },
  };
}
