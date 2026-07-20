import type { DecisionBrief, DecisionBriefDraft } from './types';

export type DecisionBriefHistory = {
  sessionId: string;
  briefs: DecisionBrief[];
};

/**
 * This repository boundary is intentionally storage-agnostic. Mission 3C uses
 * session state; Mission 3D can replace the implementation with persistence.
 */
export interface DecisionBriefHistoryRepository {
  read(sessionId: string): DecisionBriefHistory;
  append(sessionId: string, draft: DecisionBriefDraft): DecisionBriefHistory;
}

function normalized(value: string) {
  return value.trim().toLocaleLowerCase();
}

function isMeaningfullyDifferent(previous: DecisionBrief, next: DecisionBriefDraft) {
  return (
    previous.strategicFocus.kind !== next.strategicFocus.kind ||
    normalized(previous.strategicFocus.title) !== normalized(next.strategicFocus.title) ||
    previous.strategicFocus.linkedFocuses.map(normalized).join('|') !==
      next.strategicFocus.linkedFocuses.map(normalized).join('|') ||
    previous.decisionReadiness.mode !== next.decisionReadiness.mode ||
    previous.confidence !== next.confidence
  );
}

export function appendDecisionBrief(
  history: DecisionBriefHistory,
  draft: DecisionBriefDraft,
): DecisionBriefHistory {
  const previous = history.briefs.at(-1);

  if (previous && !isMeaningfullyDifferent(previous, draft)) return history;

  const brief: DecisionBrief = {
    ...draft,
    id: `${history.sessionId}:brief:${history.briefs.length + 1}`,
    version: history.briefs.length + 1,
    sessionId: history.sessionId,
  };

  return { ...history, briefs: [...history.briefs, brief] };
}

export class SessionDecisionBriefHistoryRepository implements DecisionBriefHistoryRepository {
  constructor(private history: DecisionBriefHistory) {}

  read(sessionId: string) {
    return this.history.sessionId === sessionId ? this.history : { sessionId, briefs: [] };
  }

  append(sessionId: string, draft: DecisionBriefDraft) {
    this.history = appendDecisionBrief(this.read(sessionId), draft);
    return this.history;
  }
}
