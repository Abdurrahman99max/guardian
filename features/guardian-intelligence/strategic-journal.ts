import type {
  DecisionBrief,
  DecisionBriefDraft,
  DecisionPublication,
  JournalDecisionBrief,
  StrategicChangeProposal,
  StrategicJournalAnswer,
  StrategicJournalQuery,
  StrategicMilestone,
  StrategicTransition,
} from './types';

export type StrategicJournal = {
  sessionId: string;
  briefs: JournalDecisionBrief[];
  transitions: StrategicTransition[];
  proposals: StrategicChangeProposal[];
  milestones: StrategicMilestone[];
  latestMode: DecisionPublication['mode'];
};

export interface StrategicJournalRepository {
  read(sessionId: string): StrategicJournal;
  recordDecisionCycle(
    sessionId: string,
    publication: DecisionPublication,
    draft: DecisionBriefDraft | null,
  ): StrategicJournal;
  acceptProposal(sessionId: string, proposalId: string): StrategicJournal;
  deferProposal(sessionId: string, proposalId: string): StrategicJournal;
  pinMilestone(sessionId: string, briefId: string): StrategicJournal;
  archiveBrief(sessionId: string, briefId: string): StrategicJournal;
  answer(sessionId: string, query: StrategicJournalQuery): StrategicJournalAnswer;
}

export function createStrategicJournal(sessionId: string): StrategicJournal {
  return {
    sessionId,
    briefs: [],
    transitions: [],
    proposals: [],
    milestones: [],
    latestMode: 'learning',
  };
}

function normalized(value: string) {
  return value.trim().toLocaleLowerCase();
}

function normalizedList(values: string[]) {
  return values.map(normalized).sort().join('|');
}

function hasMeaningfulChange(previous: JournalDecisionBrief, next: DecisionBriefDraft) {
  return (
    normalized(previous.strategicFocus.title) !== normalized(next.strategicFocus.title) ||
    previous.strategicFocus.kind !== next.strategicFocus.kind ||
    normalizedList(previous.strategicFocus.linkedFocuses) !==
      normalizedList(next.strategicFocus.linkedFocuses) ||
    previous.confidence !== next.confidence ||
    previous.supportingEvidence
      .map((evidence) => evidence.evidenceId)
      .sort()
      .join('|') !==
      next.supportingEvidence
        .map((evidence) => evidence.evidenceId)
        .sort()
        .join('|') ||
    normalizedList(previous.remainingUncertainty) !== normalizedList(next.remainingUncertainty) ||
    normalizedList(previous.transitionConditions) !== normalizedList(next.transitionConditions)
  );
}

function createBrief(journal: StrategicJournal, draft: DecisionBriefDraft): DecisionBrief {
  const version = journal.briefs.length + 1;

  return {
    ...draft,
    id: `${journal.sessionId}:brief:${version}`,
    version,
    sessionId: journal.sessionId,
  };
}

function describeChange(previous: JournalDecisionBrief, candidate: DecisionBrief) {
  if (normalized(previous.strategicFocus.title) !== normalized(candidate.strategicFocus.title)) {
    return 'New evidence has changed the strategic focus Guardian is prepared to hold.';
  }

  if (previous.confidence !== candidate.confidence) {
    return 'The confidence behind the current strategic focus has changed with the available evidence.';
  }

  return 'The evidence and remaining uncertainty have changed enough to revisit the current strategic focus.';
}

function currentBrief(journal: StrategicJournal) {
  return journal.briefs.find((brief) => brief.status === 'current');
}

function proposalMatches(proposal: StrategicChangeProposal, candidate: DecisionBrief) {
  return (
    normalized(proposal.candidate.strategicFocus.title) ===
      normalized(candidate.strategicFocus.title) &&
    proposal.candidate.confidence === candidate.confidence &&
    proposal.candidate.supportingEvidence
      .map((evidence) => evidence.evidenceId)
      .sort()
      .join('|') ===
      candidate.supportingEvidence
        .map((evidence) => evidence.evidenceId)
        .sort()
        .join('|')
  );
}

export function recordJournalDecisionCycle(
  journal: StrategicJournal,
  publication: DecisionPublication,
  draft: DecisionBriefDraft | null,
): StrategicJournal {
  if (publication.mode === 'learning' || !draft) {
    return journal.latestMode === 'learning' ? journal : { ...journal, latestMode: 'learning' };
  }

  const current = currentBrief(journal);

  if (!current) {
    const brief = createBrief(journal, draft);
    return {
      ...journal,
      briefs: [
        ...journal.briefs,
        { ...brief, status: 'current', predecessorId: null, supersededById: null },
      ],
      latestMode: 'decision',
    };
  }

  if (!hasMeaningfulChange(current, draft)) {
    return journal.latestMode === 'decision' ? journal : { ...journal, latestMode: 'decision' };
  }

  const candidate = createBrief(journal, draft);
  const existingProposal = journal.proposals.find(
    (proposal) => proposal.currentBriefId === current.id && proposalMatches(proposal, candidate),
  );

  if (existingProposal) {
    return { ...journal, latestMode: 'decision' };
  }

  const proposal: StrategicChangeProposal = {
    id: `${journal.sessionId}:proposal:${journal.proposals.length + 1}`,
    status: 'proposed',
    currentBriefId: current.id,
    candidate,
    observation: describeChange(current, candidate),
    supportingEvidence: candidate.supportingEvidence,
    rationale:
      'Guardian has observed a material change in the evidence or strategic model. The current Decision Brief remains in place until you choose whether to adopt this evolution.',
    proposedNextStep:
      'Review the observation and evidence before deciding whether this should become the current strategic judgment.',
  };

  return {
    ...journal,
    proposals: [...journal.proposals, proposal],
    latestMode: 'decision',
  };
}

export function acceptJournalProposal(
  journal: StrategicJournal,
  proposalId: string,
): StrategicJournal {
  const proposal = journal.proposals.find(
    (item) => item.id === proposalId && item.status === 'proposed',
  );
  const current = proposal
    ? journal.briefs.find((brief) => brief.id === proposal.currentBriefId)
    : null;

  if (!proposal || !current || current.status !== 'current') return journal;

  const nextBrief: JournalDecisionBrief = {
    ...proposal.candidate,
    status: 'current',
    predecessorId: current.id,
    supersededById: null,
  };
  const transitionedBrief: JournalDecisionBrief = {
    ...current,
    status: 'superseded',
    supersededById: nextBrief.id,
  };
  const transition: StrategicTransition = {
    id: `${journal.sessionId}:transition:${journal.transitions.length + 1}`,
    fromBriefId: current.id,
    toBriefId: nextBrief.id,
    observation: proposal.observation,
    supportingEvidence: proposal.supportingEvidence,
    confidenceChange: `${current.confidence} → ${nextBrief.confidence}`,
    rationale: proposal.rationale,
  };
  const milestone: StrategicMilestone = {
    id: `${journal.sessionId}:milestone:${journal.milestones.length + 1}`,
    briefId: nextBrief.id,
    kind: 'automatic',
    title: 'Strategic focus evolved',
    description: proposal.observation,
  };

  return {
    ...journal,
    briefs: journal.briefs
      .map((brief) => (brief.id === current.id ? transitionedBrief : brief))
      .concat(nextBrief),
    transitions: [...journal.transitions, transition],
    proposals: journal.proposals.map((item) =>
      item.id === proposal.id ? { ...item, status: 'accepted' } : item,
    ),
    milestones: [...journal.milestones, milestone],
  };
}

export function deferJournalProposal(
  journal: StrategicJournal,
  proposalId: string,
): StrategicJournal {
  const proposal = journal.proposals.find(
    (item) => item.id === proposalId && item.status === 'proposed',
  );

  if (!proposal) return journal;

  return {
    ...journal,
    proposals: journal.proposals.map((item) =>
      item.id === proposalId ? { ...item, status: 'deferred' } : item,
    ),
  };
}

export function pinJournalMilestone(journal: StrategicJournal, briefId: string): StrategicJournal {
  const brief = journal.briefs.find((item) => item.id === briefId);
  const alreadyPinned = journal.milestones.some(
    (milestone) => milestone.briefId === briefId && milestone.kind === 'founder_pinned',
  );

  if (!brief || alreadyPinned) return journal;

  return {
    ...journal,
    milestones: [
      ...journal.milestones,
      {
        id: `${journal.sessionId}:milestone:${journal.milestones.length + 1}`,
        briefId,
        kind: 'founder_pinned',
        title: 'Founder-pinned moment',
        description: `Version ${brief.version}: ${brief.strategicFocus.title}`,
      },
    ],
  };
}

export function archiveJournalBrief(journal: StrategicJournal, briefId: string): StrategicJournal {
  const brief = journal.briefs.find((item) => item.id === briefId);

  if (!brief || brief.status === 'current') return journal;

  return {
    ...journal,
    briefs: journal.briefs.map((item) =>
      item.id === briefId ? { ...item, status: 'archived' } : item,
    ),
  };
}

export function answerJournalQuery(
  journal: StrategicJournal,
  query: StrategicJournalQuery,
): StrategicJournalAnswer {
  const latestTransition = journal.transitions.at(-1);
  const current = currentBrief(journal) ?? null;

  if (!latestTransition) {
    return {
      query,
      answer: 'Guardian has not yet recorded a completed strategic evolution in this session.',
      evidence: [],
      relatedBriefId: current?.id ?? null,
    };
  }

  const previous = journal.briefs.find((brief) => brief.id === latestTransition.fromBriefId);
  const next = journal.briefs.find((brief) => brief.id === latestTransition.toBriefId);
  const answers: Record<StrategicJournalQuery, string> = {
    why_did_this_change: latestTransition.observation,
    what_evidence_changed: `The transition is supported by ${latestTransition.supportingEvidence.length} connected evidence item${latestTransition.supportingEvidence.length === 1 ? '' : 's'}.`,
    what_did_this_replace: previous
      ? `Version ${next?.version ?? ''} replaced Version ${previous.version}: ${previous.strategicFocus.title}.`
      : 'Guardian has not recorded a prior Decision Brief for this transition.',
    how_confidence_evolved: `Confidence changed from ${previous?.confidence ?? 'an earlier view'} to ${next?.confidence ?? 'the current view'}.`,
  };

  return {
    query,
    answer: answers[query],
    evidence: latestTransition.supportingEvidence,
    relatedBriefId: next?.id ?? null,
  };
}

export class SessionStrategicJournalRepository implements StrategicJournalRepository {
  constructor(private journal: StrategicJournal) {}

  read(sessionId: string) {
    return this.journal.sessionId === sessionId ? this.journal : createStrategicJournal(sessionId);
  }

  recordDecisionCycle(
    sessionId: string,
    publication: DecisionPublication,
    draft: DecisionBriefDraft | null,
  ) {
    this.journal = recordJournalDecisionCycle(this.read(sessionId), publication, draft);
    return this.journal;
  }

  acceptProposal(sessionId: string, proposalId: string) {
    this.journal = acceptJournalProposal(this.read(sessionId), proposalId);
    return this.journal;
  }

  deferProposal(sessionId: string, proposalId: string) {
    this.journal = deferJournalProposal(this.read(sessionId), proposalId);
    return this.journal;
  }

  pinMilestone(sessionId: string, briefId: string) {
    this.journal = pinJournalMilestone(this.read(sessionId), briefId);
    return this.journal;
  }

  archiveBrief(sessionId: string, briefId: string) {
    this.journal = archiveJournalBrief(this.read(sessionId), briefId);
    return this.journal;
  }

  answer(sessionId: string, query: StrategicJournalQuery) {
    return answerJournalQuery(this.read(sessionId), query);
  }
}
