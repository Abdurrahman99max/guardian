import type { FounderEvidence } from '@/features/guardian-intelligence';

import type { UnderstandingArea, UnderstandingCard } from './model';

export function buildFounderEvidence(
  cards: UnderstandingCard[],
  areas: UnderstandingArea[],
): FounderEvidence[] {
  return cards.flatMap((card) => {
    const area = areas.find((item) => item.id === card.areaId);

    if (!area) return [];

    return [
      {
        id: `${card.id}:response`,
        kind: 'founder_response',
        certainty: 'confirmed',
        areaId: card.areaId,
        areaLabel: area.label,
        content: card.response,
      },
      {
        id: `${card.id}:summary`,
        kind: 'understanding_summary',
        certainty: 'inferred',
        areaId: card.areaId,
        areaLabel: area.label,
        content: card.summary,
      },
      ...card.context.map((content, index) => ({
        id: `${card.id}:context:${index}`,
        kind: 'added_context' as const,
        certainty: 'confirmed' as const,
        areaId: card.areaId,
        areaLabel: area.label,
        content,
      })),
    ];
  });
}
