'use client';

import { ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { type ReactNode, useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cardReveal } from '@/lib/motion/presets';

import { createMockReasoning } from './reasoning';
import type { HypothesisStatus, ReasoningConfidence, UnderstandingSnapshot } from './types';

type GuardianIntelligenceViewProps = {
  understanding: UnderstandingSnapshot[];
  onReturnToLearning: () => void;
};

function GuardianIntelligenceView({
  understanding,
  onReturnToLearning,
}: GuardianIntelligenceViewProps) {
  const reasoning = useMemo(() => createMockReasoning(understanding), [understanding]);
  const leadingHypothesis = reasoning.hypotheses.find(
    (hypothesis) => hypothesis.status === 'Leading',
  );
  const alternatives = reasoning.hypotheses.filter((hypothesis) => hypothesis.status !== 'Leading');

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

        <motion.div initial="hidden" animate="visible" variants={cardReveal}>
          <div className="max-w-2xl space-y-3 px-1 sm:px-2">
            <p className="text-guardian-blue text-sm font-medium">
              Guardian is beginning to reason.
            </p>
            <h1 className="text-text-primary text-[1.875rem] leading-[1.12] font-semibold tracking-[-0.045em] sm:text-[2.5rem]">
              Here is how I&apos;m currently seeing the company.
            </h1>
            <p className="text-text-secondary max-w-xl text-base leading-6">
              This is not a conclusion. It is a working view that will change as Guardian learns
              more about the company and its environment.
            </p>
          </div>
        </motion.div>

        <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_15rem] xl:gap-12">
          <section className="space-y-6">
            {leadingHypothesis && (
              <ReasoningSection label="Current direction">
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

            <ReasoningSection label="Perspective shift">
              <Card className="border-0 bg-transparent shadow-none">
                <CardHeader className="gap-2 p-1 sm:p-2">
                  <CardTitle className="max-w-xl text-xl leading-[1.2] tracking-[-0.025em] sm:text-2xl">
                    {reasoning.perspectiveShift.title}
                  </CardTitle>
                  <p className="text-text-secondary max-w-xl text-base leading-6">
                    {reasoning.perspectiveShift.explanation}
                  </p>
                  <p className="text-guardian-blue text-sm font-medium">
                    {reasoning.perspectiveShift.confidenceChange}
                  </p>
                </CardHeader>
              </Card>
            </ReasoningSection>
          </section>

          <aside className="space-y-6 lg:sticky lg:top-8">
            <ReasoningSection label="Still learning">
              <div className="space-y-4">
                {reasoning.missingUnderstanding.map((item) => (
                  <div
                    key={item.id}
                    className="border-border-soft/60 border-t pt-3 first:border-t-0 first:pt-0"
                  >
                    <p className="text-text-primary text-sm font-semibold">{item.statement}</p>
                    <p className="text-text-secondary mt-1 text-sm leading-5">
                      {item.whyItMatters}
                    </p>
                  </div>
                ))}
              </div>
            </ReasoningSection>

            <ReasoningSection label="Recommendation readiness">
              <Card className="bg-surface/70 shadow-none">
                <CardContent className="space-y-2 px-4 py-4">
                  <ReadinessBadge status={reasoning.recommendationReadiness.status} />
                  <p className="text-text-secondary text-sm leading-5">
                    {reasoning.recommendationReadiness.explanation}
                  </p>
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
      </div>
    </main>
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

function HypothesisCard({
  hypothesis,
  featured = false,
}: {
  hypothesis: ReturnType<typeof createMockReasoning>['hypotheses'][number];
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
      <CardContent className="px-5 pb-5 sm:px-6">
        <p className="text-text-secondary text-xs font-medium tracking-[0.08em] uppercase">
          What is supporting this view
        </p>
        <ul className="text-text-secondary mt-2 space-y-1.5 text-sm leading-5">
          {hypothesis.supportingObservations.map((observation) => (
            <li key={observation} className="flex gap-2">
              <span aria-hidden className="bg-border-soft mt-2 size-1 shrink-0 rounded-full" />
              {observation}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
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

function ConfidenceBadge({ confidence }: { confidence: ReasoningConfidence }) {
  const variant =
    confidence === 'High' ? 'success' : confidence === 'Moderate' ? 'warning' : 'learning';
  return <Badge variant={variant}>{confidence} confidence</Badge>;
}

function ReadinessBadge({ status }: { status: 'Not Ready' | 'Almost Ready' | 'Ready' }) {
  const variant =
    status === 'Ready' ? 'success' : status === 'Almost Ready' ? 'warning' : 'learning';
  return <Badge variant={variant}>{status}</Badge>;
}

export { GuardianIntelligenceView };
