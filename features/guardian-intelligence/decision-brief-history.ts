import type { DecisionBrief, DecisionBriefDraft, DecisionPublication, GuardianMode } from './types';

export type DecisionBriefHistory = {
  sessionId: string;
  briefs: DecisionBrief[];
  latestMode: GuardianMode;
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
    previous.decisionReadiness.evidenceSufficiency !== next.decisionReadiness.evidenceSufficiency ||
    previous.decisionReadiness.evidenceConsistency !== next.decisionReadiness.evidenceConsistency ||
    previous.decisionReadiness.hypothesisSeparation !==
      next.decisionReadiness.hypothesisSeparation ||
    previous.decisionReadiness.decisionStability !== next.decisionReadiness.decisionStability ||
    previous.confidence !== next.confidence
  );
}

export function appendDecisionBrief(
  history: DecisionBriefHistory,
  draft: DecisionBriefDraft,
  forceNewVersion = false,
): DecisionBriefHistory {
  const previous = history.briefs.at(-1);

  if (previous && !forceNewVersion && !isMeaningfullyDifferent(previous, draft)) return history;

  const brief: DecisionBrief = {
    ...draft,
    id: `${history.sessionId}:brief:${history.briefs.length + 1}`,
    version: history.briefs.length + 1,
    sessionId: history.sessionId,
  };

  return { ...history, briefs: [...history.briefs, brief], latestMode: 'decision' };
}

export function recordDecisionCycle(
  history: DecisionBriefHistory,
  publication: DecisionPublication,
  draft: DecisionBriefDraft | null,
): DecisionBriefHistory {
  if (publication.mode === 'learning' || !draft) {
    return history.latestMode === 'learning' ? history : { ...history, latestMode: 'learning' };
  }

  return appendDecisionBrief(
    history,
    draft,
    history.latestMode === 'learning' && history.briefs.length > 0,
  );
}

export class SessionDecisionBriefHistoryRepository implements DecisionBriefHistoryRepository {
  constructor(private history: DecisionBriefHistory) {}

  read(sessionId: string): DecisionBriefHistory {
    return this.history.sessionId === sessionId
      ? this.history
      : { sessionId, briefs: [], latestMode: 'learning' };
  }

  append(sessionId: string, draft: DecisionBriefDraft) {
    this.history = appendDecisionBrief(this.read(sessionId), draft);
    return this.history;
  }
}
