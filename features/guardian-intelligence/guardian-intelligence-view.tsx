'use client';

import { ArrowLeft, Bookmark, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
import { type ReactNode, useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cardReveal } from '@/lib/motion/presets';

import { requestReasoning } from './reasoning-client';
import type { StrategicJournal, StrategicJournalRepository } from './strategic-journal';
import type {
  ConfidenceLevel,
  DecisionBrief,
  FounderEvidence,
  HypothesisStatus,
  NextCognitiveAction,
  ReasoningOutput,
  ReasoningResult,
  StrategicJournalAnswer,
  StrategicJournalQuery,
  StrategicHypothesis,
} from './types';

type GuardianIntelligenceViewProps = {
  evidence: FounderEvidence[];
  onReturnToLearning: () => void;
  journal: StrategicJournal;
  sessionId: string;
  transactJournal: (
    operation: (repository: StrategicJournalRepository) => StrategicJournal,
  ) => void;
  queryJournal: (query: StrategicJournalQuery) => StrategicJournalAnswer;
};

function GuardianIntelligenceView({
  evidence,
  onReturnToLearning,
  journal,
  sessionId,
  transactJournal,
  queryJournal,
}: GuardianIntelligenceViewProps) {
  const [result, setResult] = useState<ReasoningResult | null>(null);

  useEffect(() => {
    let active = true;

    void requestReasoning({ evidence }).then((nextResult) => {
      if (!active) return;

      setResult(nextResult);
      if (nextResult.status === 'ready') {
        transactJournal((repository) =>
          repository.recordDecisionCycle(
            sessionId,
            nextResult.output.decisionPublication,
            nextResult.output.decisionBrief,
          ),
        );
      }
    });

    return () => {
      active = false;
    };
  }, [evidence, sessionId, transactJournal]);

  const currentBrief = journal.briefs.find((brief) => brief.status === 'current');

  return (
    <main className="bg-foundation min-h-screen px-4 py-5 sm:px-6 sm:py-8">
      <div className="max-w-conversation mx-auto flex flex-col gap-7">
        <header className="flex items-center justify-between px-1 py-1">
          <div className="flex items-center gap-3">
            <span aria-hidden className="bg-guardian-blue size-2.5 rounded-full" />
            <span className="text-text-primary text-sm font-semibold tracking-[0.18em] uppercase">
              Guardian
            </span>
          </div>
          <Button size="sm" variant="ghost" className="px-1" onClick={onReturnToLearning}>
            <ArrowLeft size={15} /> Return to learning
          </Button>
        </header>

        {result?.status === 'ready' ? (
          <ReasoningExperience
            reasoning={result.output}
            decisionBrief={currentBrief}
            journal={journal}
            sessionId={sessionId}
            transactJournal={transactJournal}
            queryJournal={queryJournal}
          />
        ) : (
          <ReasoningStatus result={result} />
        )}
      </div>
    </main>
  );
}

function ReasoningStatus({ result }: { result: ReasoningResult | null }) {
  const loading = result === null;
  const unavailableMessage = result?.status === 'unavailable' ? result.message : null;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={cardReveal}
      className="max-w-2xl px-1 sm:px-2"
    >
      <p className="text-guardian-blue text-sm font-medium">
        {loading ? 'Guardian is reviewing what it has learned.' : 'Reasoning needs more clarity.'}
      </p>
      <h1 className="text-text-primary mt-3 text-[1.875rem] leading-[1.12] font-semibold tracking-[-0.045em] sm:text-[2.5rem]">
        {loading
          ? 'I’m turning your perspective into a working strategic view.'
          : 'I’m not ready to present a reliable strategic view yet.'}
      </h1>
      <p className="text-text-secondary mt-4 max-w-xl text-base leading-6">
        {loading
          ? 'I’ll keep the evidence, alternatives, and uncertainty connected so you can see why my view is taking shape.'
          : unavailableMessage}
      </p>
    </motion.div>
  );
}

function ReasoningExperience({
  reasoning,
  decisionBrief,
  journal,
  sessionId,
  transactJournal,
  queryJournal,
}: {
  reasoning: ReasoningOutput;
  decisionBrief?: DecisionBrief;
  journal: StrategicJournal;
  sessionId: string;
  transactJournal: (
    operation: (repository: StrategicJournalRepository) => StrategicJournal,
  ) => void;
  queryJournal: (query: StrategicJournalQuery) => StrategicJournalAnswer;
}) {
  const leadingHypothesis = reasoning.hypotheses.find(
    (hypothesis) => hypothesis.status === 'Leading',
  );
  const alternatives = reasoning.hypotheses.filter((hypothesis) => hypothesis.status !== 'Leading');

  return (
    <>
      <motion.div initial="hidden" animate="visible" variants={cardReveal}>
        <div className="max-w-2xl space-y-3 px-1 sm:px-2">
          <p className="text-guardian-blue text-sm font-medium">
            {reasoning.decisionPublication.mode === 'decision'
              ? 'Guardian has a working strategic judgment.'
              : 'Guardian is still learning before it judges.'}
          </p>
          <h1 className="text-text-primary text-[1.875rem] leading-[1.12] font-semibold tracking-[-0.045em] sm:text-[2.5rem]">
            {reasoning.decisionPublication.mode === 'decision'
              ? 'Here is the decision context I believe is ready to hold.'
              : 'Here is how I&apos;m currently seeing the company.'}
          </h1>
          <p className="text-text-secondary max-w-xl text-base leading-6">
            This is a working view, not a conclusion. It will change as Guardian learns more about
            the company and its environment.
          </p>
        </div>
      </motion.div>

      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_15rem] xl:gap-12">
        <section className="space-y-6">
          <DecisionPublicationCard reasoning={reasoning} brief={decisionBrief} />
          <StrategicContinuity
            journal={journal}
            sessionId={sessionId}
            transactJournal={transactJournal}
            queryJournal={queryJournal}
          />
          {leadingHypothesis && (
            <ReasoningSection label="Current direction">
              <CurrentViewCard view={reasoning.currentStrategicView} />
              <HypothesisCard hypothesis={leadingHypothesis} featured />
            </ReasoningSection>
          )}

          <ReasoningSection label="Other possibilities I'm still holding">
            <div className="space-y-2.5">
              {alternatives.map((hypothesis) => (
                <HypothesisCard key={hypothesis.id} hypothesis={hypothesis} />
              ))}
            </div>
          </ReasoningSection>

          {reasoning.perspectiveShift && (
            <ReasoningSection label="Perspective shift">
              <Card className="border-0 bg-transparent shadow-none">
                <CardHeader className="gap-2 p-1 sm:p-2">
                  <CardTitle className="max-w-xl text-xl leading-[1.2] tracking-[-0.025em] sm:text-2xl">
                    {reasoning.perspectiveShift.title}
                  </CardTitle>
                  <p className="text-text-secondary max-w-xl text-base leading-6">
                    {reasoning.perspectiveShift.explanation}
                  </p>
                </CardHeader>
              </Card>
            </ReasoningSection>
          )}
        </section>

        <aside className="space-y-6 lg:sticky lg:top-8">
          <ReasoningSection label="Still learning">
            <div className="space-y-4">
              {reasoning.model.unknownAreas.map((unknown) => (
                <div
                  key={unknown}
                  className="border-border-soft/60 border-t pt-3 first:border-t-0 first:pt-0"
                >
                  <p className="text-text-secondary text-sm leading-5">{unknown}</p>
                </div>
              ))}
            </div>
          </ReasoningSection>

          <ReasoningSection label="Decision context">
            <Card className="bg-surface/70 shadow-none">
              <CardContent className="space-y-2 px-4 py-4">
                <ActionBadge action={reasoning.decisionContext.nextAction} />
                <p className="text-text-secondary text-sm leading-5">
                  {reasoning.decisionContext.summary}
                </p>
                <p className="text-text-primary text-sm leading-5 font-medium">
                  {reasoning.decisionContext.rationale}
                </p>
                {reasoning.decisionContext.question && (
                  <p className="text-text-secondary text-sm leading-5">
                    {reasoning.decisionContext.question}
                  </p>
                )}
              </CardContent>
            </Card>
          </ReasoningSection>
        </aside>
      </div>

      <ReasoningSection label="Strategic model">
        <div className="grid gap-2.5 md:grid-cols-3">
          <ModelFacet title="Strengths" items={reasoning.model.strategicStrengths} />
          <ModelFacet title="Risks" items={reasoning.model.strategicRisks} />
          <ModelFacet title="Unknown areas" items={reasoning.model.unknownAreas} />
        </div>
      </ReasoningSection>
    </>
  );
}

function ReasoningSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <p className="text-text-primary text-sm font-semibold">{label}</p>
      {children}
    </section>
  );
}

function CurrentViewCard({ view }: { view: ReasoningOutput['currentStrategicView'] }) {
  return (
    <Card className="bg-surface/70 shadow-none">
      <CardContent className="space-y-2 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center gap-2">
          <ConfidenceBadge confidence={view.confidence} />
        </div>
        <p className="text-text-primary text-lg leading-6 font-semibold tracking-[-0.02em]">
          {view.title}
        </p>
        <p className="text-text-secondary text-sm leading-5">{view.explanation}</p>
        <p className="text-text-secondary text-sm leading-5">{view.confidenceRationale}</p>
      </CardContent>
    </Card>
  );
}

function DecisionPublicationCard({
  reasoning,
  brief,
}: {
  reasoning: ReasoningOutput;
  brief?: DecisionBrief;
}) {
  if (reasoning.decisionPublication.mode === 'learning') {
    return (
      <ReasoningSection label="Learning mode">
        <Card className="bg-surface/70 shadow-none">
          <CardContent className="space-y-2 px-4 py-4 sm:px-5">
            <p className="text-text-primary text-sm font-medium">
              Guardian is not publishing a strategic judgment yet.
            </p>
            <p className="text-text-secondary text-sm leading-5">
              {reasoning.decisionPublication.reason}
            </p>
          </CardContent>
        </Card>
      </ReasoningSection>
    );
  }

  if (!brief) return null;

  return (
    <ReasoningSection label={`Decision brief · Version ${brief.version}`}>
      <Card>
        <CardHeader className="gap-3 px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default">Current strategic focus</Badge>
            <ConfidenceBadge confidence={brief.confidence} />
          </div>
          <CardTitle className="text-2xl leading-[1.2] tracking-[-0.03em]">
            {brief.strategicFocus.title}
          </CardTitle>
          <p className="text-text-secondary text-base leading-6">{brief.whyThisMatters}</p>
        </CardHeader>
        <CardContent className="space-y-4 px-5 pb-5 sm:px-6">
          {brief.strategicFocus.kind === 'linked_pair' && (
            <div>
              <p className="text-text-secondary text-xs font-medium tracking-[0.08em] uppercase">
                Linked decision pair
              </p>
              <p className="text-text-secondary mt-2 text-sm leading-5">
                {brief.strategicFocus.linkedFocuses.join(' and ')}. {brief.strategicFocus.whyLinked}
              </p>
            </div>
          )}
          <EvidenceList label="What supports this judgment" items={brief.supportingEvidence} />
          <div>
            <p className="text-text-secondary text-xs font-medium tracking-[0.08em] uppercase">
              Alternative interpretation
            </p>
            <p className="text-text-secondary mt-2 text-sm leading-5">
              {brief.alternativeInterpretation}
            </p>
          </div>
          <EvidenceList label="What could change this focus" items={brief.transitionConditions} />
          <p className="text-text-secondary text-sm leading-5">{brief.nextLearningObjective}</p>
        </CardContent>
      </Card>
    </ReasoningSection>
  );
}

function StrategicContinuity({
  journal,
  sessionId,
  transactJournal,
  queryJournal,
}: {
  journal: StrategicJournal;
  sessionId: string;
  transactJournal: (
    operation: (repository: StrategicJournalRepository) => StrategicJournal,
  ) => void;
  queryJournal: (query: StrategicJournalQuery) => StrategicJournalAnswer;
}) {
  const [journalOpen, setJournalOpen] = useState(false);
  const [answer, setAnswer] = useState<StrategicJournalAnswer | null>(null);
  const proposal = journal.proposals.find((item) => item.status === 'proposed');
  const recentTransitions = journal.transitions.slice(-2).reverse();
  const currentBrief = journal.briefs.find((brief) => brief.status === 'current');
  const currentIsPinned = currentBrief
    ? journal.milestones.some(
        (milestone) => milestone.briefId === currentBrief.id && milestone.kind === 'founder_pinned',
      )
    : false;

  return (
    <ReasoningSection label="Strategic continuity">
      <div className="space-y-3">
        {proposal && (
          <Card className="bg-surface/70 shadow-none">
            <CardContent className="space-y-3 px-4 py-4 sm:px-5">
              <p className="text-guardian-blue text-sm font-medium">Strategic change observed</p>
              <p className="text-text-primary text-base leading-6 font-medium">
                {proposal.observation}
              </p>
              <p className="text-text-secondary text-sm leading-5">{proposal.rationale}</p>
              <EvidenceList
                label="Evidence affecting the current brief"
                items={proposal.supportingEvidence}
              />
              <p className="text-text-secondary text-sm leading-5">{proposal.proposedNextStep}</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  size="sm"
                  onClick={() =>
                    transactJournal((repository) =>
                      repository.acceptProposal(sessionId, proposal.id),
                    )
                  }
                >
                  Accept this evolution
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="px-1"
                  onClick={() =>
                    transactJournal((repository) =>
                      repository.deferProposal(sessionId, proposal.id),
                    )
                  }
                >
                  Keep current view
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-surface/70 shadow-none">
          <CardContent className="space-y-3 px-4 py-4 sm:px-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-text-primary text-sm font-medium">Recent evolution</p>
                <p className="text-text-secondary mt-1 text-sm leading-5">
                  {recentTransitions.length === 0
                    ? 'Guardian has not yet recorded a completed strategic evolution in this session.'
                    : 'The latest evidence-driven changes to Guardian’s strategic view.'}
                </p>
              </div>
              {currentBrief && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="shrink-0 px-1"
                  disabled={currentIsPinned}
                  onClick={() =>
                    transactJournal((repository) =>
                      repository.pinMilestone(sessionId, currentBrief.id),
                    )
                  }
                >
                  <Bookmark size={15} /> {currentIsPinned ? 'Pinned' : 'Pin moment'}
                </Button>
              )}
            </div>
            {recentTransitions.map((transition) => (
              <div key={transition.id} className="border-border-soft/60 border-t pt-3">
                <p className="text-text-primary text-sm leading-5 font-medium">
                  {transition.observation}
                </p>
                <p className="text-text-secondary mt-1 text-sm leading-5">
                  {transition.confidenceChange}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-1">
          <Button
            size="sm"
            variant="ghost"
            className="px-1"
            onClick={() => setJournalOpen((open) => !open)}
          >
            Strategic Journal <ChevronDown className={journalOpen ? 'rotate-180' : ''} size={15} />
          </Button>
          {(
            [
              ['why_did_this_change', 'Why did this change?'],
              ['what_evidence_changed', 'What evidence changed?'],
              ['what_did_this_replace', 'What did this replace?'],
              ['how_confidence_evolved', 'How did confidence evolve?'],
            ] as const
          ).map(([query, label]) => (
            <Button
              key={query}
              size="sm"
              variant="ghost"
              className="px-1"
              onClick={() => setAnswer(queryJournal(query))}
            >
              {label}
            </Button>
          ))}
        </div>

        {answer && (
          <Card className="bg-foundation/55 shadow-none">
            <CardContent className="space-y-2 px-4 py-4 sm:px-5">
              <p className="text-text-primary text-sm leading-5">{answer.answer}</p>
              <EvidenceList label="Connected evidence" items={answer.evidence} />
            </CardContent>
          </Card>
        )}

        {journalOpen && (
          <div className="space-y-2.5">
            {journal.briefs
              .slice()
              .reverse()
              .map((brief) => (
                <Card key={brief.id} className="bg-surface/70 shadow-none">
                  <CardContent className="flex items-start justify-between gap-3 px-4 py-4 sm:px-5">
                    <div>
                      <p className="text-text-primary text-sm font-medium">
                        Version {brief.version} · {brief.status}
                      </p>
                      <p className="text-text-secondary mt-1 text-sm leading-5">
                        {brief.strategicFocus.title}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {!journal.milestones.some(
                        (milestone) =>
                          milestone.briefId === brief.id && milestone.kind === 'founder_pinned',
                      ) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="px-1"
                          onClick={() =>
                            transactJournal((repository) =>
                              repository.pinMilestone(sessionId, brief.id),
                            )
                          }
                        >
                          Pin
                        </Button>
                      )}
                      {brief.status !== 'current' && brief.status !== 'archived' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="px-1"
                          onClick={() =>
                            transactJournal((repository) =>
                              repository.archiveBrief(sessionId, brief.id),
                            )
                          }
                        >
                          Archive
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>
    </ReasoningSection>
  );
}

function HypothesisCard({
  hypothesis,
  featured = false,
}: {
  hypothesis: StrategicHypothesis;
  featured?: boolean;
}) {
  return (
    <Card className={featured ? '' : 'bg-surface/70 shadow-none'}>
      <CardHeader className="gap-3 px-5 py-5 sm:px-6 sm:py-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={hypothesis.status} />
          <ConfidenceBadge confidence={hypothesis.confidence} />
        </div>
        <CardTitle className={featured ? 'text-2xl leading-[1.2] tracking-[-0.03em]' : 'text-lg'}>
          {hypothesis.title}
        </CardTitle>
        <p className="text-text-secondary text-base leading-6">{hypothesis.explanation}</p>
      </CardHeader>
      <CardContent className="space-y-4 px-5 pb-5 sm:px-6">
        <EvidenceList label="What is supporting this view" items={hypothesis.supportingEvidence} />
        <EvidenceList label="What may challenge it" items={hypothesis.conflictingEvidence} />
        <EvidenceList label="What I still need to learn" items={hypothesis.unknowns} />
        <p className="text-text-secondary text-sm leading-5">{hypothesis.confidenceRationale}</p>
      </CardContent>
    </Card>
  );
}

function EvidenceList({
  label,
  items,
}: {
  label: string;
  items: Array<{ explanation: string }> | string[];
}) {
  if (items.length === 0) return null;

  return (
    <div>
      <p className="text-text-secondary text-xs font-medium tracking-[0.08em] uppercase">{label}</p>
      <ul className="text-text-secondary mt-2 space-y-1.5 text-sm leading-5">
        {items.map((item) => {
          const content = typeof item === 'string' ? item : item.explanation;
          return (
            <li key={content} className="flex gap-2">
              <span aria-hidden className="bg-border-soft mt-2 size-1 shrink-0 rounded-full" />
              {content}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ModelFacet({ title, items }: { title: string; items: string[] }) {
  return (
    <Card className="bg-surface/70 shadow-none">
      <CardContent className="px-4 py-4">
        <p className="text-text-primary text-sm font-semibold">{title}</p>
        <ul className="text-text-secondary mt-2 space-y-2 text-sm leading-5">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: HypothesisStatus }) {
  const variant = status === 'Leading' ? 'default' : status === 'Active' ? 'learning' : 'warning';
  return <Badge variant={variant}>{status}</Badge>;
}

function ConfidenceBadge({ confidence }: { confidence: ConfidenceLevel }) {
  const variant =
    confidence === 'High' ? 'success' : confidence === 'Moderate' ? 'warning' : 'learning';
  return <Badge variant={variant}>{confidence} confidence</Badge>;
}

function ActionBadge({ action }: { action: NextCognitiveAction }) {
  const label = {
    ask: 'Question worth asking',
    clarify: 'Clarification would help',
    challenge: 'An assumption to examine',
    explain: 'A view worth explaining',
    ready_for_guidance: 'Ready for guidance',
  }[action];

  return <Badge variant={action === 'ready_for_guidance' ? 'success' : 'learning'}>{label}</Badge>;
}

export { GuardianIntelligenceView };
