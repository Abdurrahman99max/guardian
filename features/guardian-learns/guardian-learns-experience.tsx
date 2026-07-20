'use client';

import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronDown, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import {
  GuardianIntelligenceView,
  SessionStrategicJournalRepository,
  createStrategicJournal,
  type StrategicJournal,
  type StrategicJournalRepository,
  type StrategicJournalQuery,
} from '@/features/guardian-intelligence';
import { cardReveal } from '@/lib/motion/presets';
import { cn } from '@/lib/utils';

import { buildFounderEvidence } from './build-founder-evidence';
import { learningPrompts, understandingAreas, type UnderstandingCard } from './model';

type View = 'introduction' | 'learning' | 'reflection' | 'summary' | 'transition' | 'intelligence';
type ResumeDestination = { type: 'prompt'; index: number } | { type: 'summary' } | null;

function GuardianLearnsExperience() {
  const [view, setView] = useState<View>('introduction');
  const [promptIndex, setPromptIndex] = useState(0);
  const [response, setResponse] = useState('');
  const [cards, setCards] = useState<UnderstandingCard[]>([]);
  const [latestCardId, setLatestCardId] = useState<string | null>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [contextCardId, setContextCardId] = useState<string | null>(null);
  const [context, setContext] = useState('');
  const [mobileUnderstandingOpen, setMobileUnderstandingOpen] = useState(false);
  const [resumeDestination, setResumeDestination] = useState<ResumeDestination>(null);
  const [summaryReviewMode, setSummaryReviewMode] = useState(false);
  const [strategicJournal, setStrategicJournal] = useState<StrategicJournal>(() =>
    createStrategicJournal(crypto.randomUUID()),
  );

  const transactJournal = useCallback(
    (operation: (repository: StrategicJournalRepository) => StrategicJournal) => {
      setStrategicJournal((currentJournal) =>
        operation(new SessionStrategicJournalRepository(currentJournal)),
      );
    },
    [],
  );

  const queryJournal = useCallback(
    (query: StrategicJournalQuery) =>
      new SessionStrategicJournalRepository(strategicJournal).answer(
        strategicJournal.sessionId,
        query,
      ),
    [strategicJournal],
  );

  const activePrompt = learningPrompts[promptIndex];
  const activeArea = understandingAreas.find((area) => area.id === activePrompt?.areaId);
  const contextCard = cards.find((card) => card.id === contextCardId);
  const cardsByArea = useMemo(() => new Map(cards.map((card) => [card.areaId, card])), [cards]);
  const founderEvidence = useMemo(() => buildFounderEvidence(cards, understandingAreas), [cards]);
  const focusAreaId =
    view === 'learning'
      ? activePrompt?.areaId
      : cards.find((card) => card.id === latestCardId)?.areaId;

  function beginLearning() {
    setView('learning');
  }

  function submitResponse() {
    if (!response.trim() || !activePrompt || !activeArea) return;

    const existingCard = editingCardId
      ? cards.find((card) => card.id === editingCardId)
      : undefined;
    const updatedCard: UnderstandingCard = {
      id: existingCard?.id ?? activePrompt.id,
      areaId: activeArea.id,
      response: response.trim(),
      summary: activePrompt.synthesize(response.trim()),
      context: existingCard?.context ?? [],
    };

    setCards((currentCards) => {
      const withoutCurrent = currentCards.filter((card) => card.id !== updatedCard.id);
      return [...withoutCurrent, updatedCard];
    });
    setLatestCardId(updatedCard.id);
    setEditingCardId(null);
    setResponse('');
    setView('reflection');
  }

  function continueLearning() {
    if (resumeDestination?.type === 'prompt') {
      setPromptIndex(resumeDestination.index);
      setResumeDestination(null);
      setView('learning');
      return;
    }

    if (resumeDestination?.type === 'summary') {
      setResumeDestination(null);
      setView('summary');
      return;
    }

    if (promptIndex === learningPrompts.length - 1) {
      setView('summary');
      return;
    }

    setPromptIndex((index) => index + 1);
    setView('learning');
  }

  function editCard(card: UnderstandingCard, destination: ResumeDestination = null) {
    const index = learningPrompts.findIndex((prompt) => prompt.id === card.id);
    setPromptIndex(index);
    setResponse(card.response);
    setEditingCardId(card.id);
    setResumeDestination(destination);
    setView('learning');
  }

  function reviewPreviousThought() {
    if (promptIndex === 0) return;

    const previousPrompt = learningPrompts[promptIndex - 1];
    const previousCard = cards.find((card) => card.id === previousPrompt.id);
    if (!previousCard) return;

    editCard(previousCard, { type: 'prompt', index: promptIndex });
  }

  function helpGuardianUnderstandBetter() {
    const latestCard = cards.find((card) => card.id === latestCardId);
    if (!latestCard) return;

    editCard(latestCard);
  }

  function revisitArea(areaId: string) {
    const card = cardsByArea.get(areaId);
    if (!card) return;

    setSummaryReviewMode(false);
    editCard(card, { type: 'summary' });
  }

  function deleteCard(card: UnderstandingCard) {
    setCards((currentCards) => currentCards.filter((item) => item.id !== card.id));
    if (latestCardId === card.id) setLatestCardId(null);
  }

  function addContext() {
    if (!contextCardId || !context.trim()) return;
    setCards((currentCards) =>
      currentCards.map((card) =>
        card.id === contextCardId ? { ...card, context: [...card.context, context.trim()] } : card,
      ),
    );
    setContext('');
    setContextCardId(null);
  }

  if (view === 'intelligence') {
    return (
      <GuardianIntelligenceView
        evidence={founderEvidence}
        onReturnToLearning={() => setView('summary')}
        journal={strategicJournal}
        sessionId={strategicJournal.sessionId}
        transactJournal={transactJournal}
        queryJournal={queryJournal}
      />
    );
  }

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
        </header>

        <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_15rem] xl:gap-12">
          <section aria-live="polite" className="min-w-0">
            <AnimatePresence mode="wait">
              {view === 'introduction' && (
                <Introduction key="introduction" onBegin={beginLearning} />
              )}
              {view === 'learning' && activePrompt && (
                <PromptCard
                  key={activePrompt.id}
                  prompt={activePrompt}
                  areaLabel={activeArea?.label ?? 'Understanding'}
                  response={response}
                  editing={Boolean(editingCardId)}
                  canReviewPrevious={promptIndex > 0 && resumeDestination === null}
                  onResponseChange={setResponse}
                  onSubmit={submitResponse}
                  onReviewPrevious={reviewPreviousThought}
                />
              )}
              {view === 'reflection' && activePrompt && (
                <Reflection
                  key="reflection"
                  message={activePrompt.reflection}
                  onContinue={continueLearning}
                  onHelpGuardianUnderstandBetter={helpGuardianUnderstandBetter}
                  final={promptIndex === learningPrompts.length - 1}
                />
              )}
              {view === 'summary' && (
                <Summary
                  key="summary"
                  cardsByArea={cardsByArea}
                  reviewing={summaryReviewMode}
                  onAccurate={() => setView('transition')}
                  onChange={() => setSummaryReviewMode(true)}
                  onRevisit={revisitArea}
                />
              )}
              {view === 'transition' && (
                <Transition key="transition" onExploreReasoning={() => setView('intelligence')} />
              )}
            </AnimatePresence>
          </section>

          <aside className="lg:sticky lg:top-8">
            <button
              className="border-border-soft/60 flex w-full items-center justify-between border-y py-3 text-left lg:hidden"
              type="button"
              aria-expanded={mobileUnderstandingOpen}
              onClick={() => setMobileUnderstandingOpen((open) => !open)}
            >
              <span>
                <span className="text-text-primary block text-sm font-semibold">Understanding</span>
                <span className="text-text-secondary mt-0.5 block text-xs">
                  {cards.length} {cards.length === 1 ? 'area explored' : 'areas explored'}
                </span>
              </span>
              <ChevronDown
                className={cn(
                  'text-text-secondary duration-standard size-4 transition-transform',
                  mobileUnderstandingOpen && 'rotate-180',
                )}
              />
            </button>
            <div
              className={cn('pt-5 lg:block lg:pt-0', mobileUnderstandingOpen ? 'block' : 'hidden')}
            >
              <div className="border-border-soft/60 border-b px-1 pb-3">
                <p className="text-text-primary text-sm font-semibold tracking-[-0.01em]">
                  Understanding
                </p>
                <p className="text-text-secondary mt-1 text-sm leading-5">
                  A working model, shaped by what you share.
                </p>
              </div>
              <div className="divide-border-soft/60 divide-y">
                {understandingAreas.map((area) => (
                  <UnderstandingCardItem
                    key={area.id}
                    area={area}
                    card={cardsByArea.get(area.id)}
                    focused={area.id === focusAreaId}
                    latest={latestCardId === cardsByArea.get(area.id)?.id}
                    onEdit={editCard}
                    onDelete={deleteCard}
                    onAddContext={setContextCardId}
                  />
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <Dialog open={Boolean(contextCard)} onOpenChange={(open) => !open && setContextCardId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-text-primary text-xl font-semibold">
              Add context
            </DialogTitle>
            <DialogDescription className="text-text-secondary text-sm leading-6">
              Add detail that may improve Guardian&apos;s current understanding of{' '}
              {contextCard &&
                understandingAreas
                  .find((area) => area.id === contextCard.areaId)
                  ?.label.toLowerCase()}
              .
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 space-y-4">
            <Textarea
              value={context}
              onChange={(event) => setContext(event.target.value)}
              placeholder="What else should Guardian consider?"
            />
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setContextCardId(null)}>
                Cancel
              </Button>
              <Button onClick={addContext}>Update understanding</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function Introduction({ onBegin }: { onBegin: () => void }) {
  return (
    <motion.div initial="hidden" animate="visible" exit="exit" variants={cardReveal}>
      <Card className="border-0 bg-transparent shadow-none">
        <CardHeader className="gap-4 p-1 sm:p-2">
          <div className="max-w-xl space-y-3">
            <p className="text-guardian-blue text-sm font-medium">
              Guardian learns before it advises.
            </p>
            <CardTitle className="text-[1.875rem] leading-[1.12] tracking-[-0.045em] sm:text-[2.5rem]">
              Before I can help with strategic decisions, I need to understand what you&apos;re
              building.
            </CardTitle>
            <p className="text-text-secondary max-w-md text-base leading-6">
              I need some context before I can help you decide what deserves attention. You do not
              need to explain everything today.
            </p>
          </div>
        </CardHeader>
        <CardContent className="px-1 pt-1 pb-1 sm:px-2">
          <Button size="sm" onClick={onBegin}>
            Begin with what matters
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function PromptCard({
  prompt,
  areaLabel,
  response,
  editing,
  canReviewPrevious,
  onResponseChange,
  onSubmit,
  onReviewPrevious,
}: {
  prompt: (typeof learningPrompts)[number];
  areaLabel: string;
  response: string;
  editing: boolean;
  canReviewPrevious: boolean;
  onResponseChange: (value: string) => void;
  onSubmit: () => void;
  onReviewPrevious: () => void;
}) {
  return (
    <motion.div initial="hidden" animate="visible" exit="exit" variants={cardReveal}>
      <Card className="overflow-hidden">
        <CardHeader className="gap-3 px-5 py-5 sm:px-7 sm:py-6">
          <p className="text-guardian-blue text-sm font-medium">
            Guardian is learning about your {areaLabel.toLowerCase()}.
          </p>
          <div className="space-y-2.5">
            <CardTitle className="max-w-xl text-[1.75rem] leading-[1.15] tracking-[-0.035em] sm:text-[2.1rem]">
              {prompt.prompt}
            </CardTitle>
            <p className="text-text-secondary max-w-lg text-base leading-6">
              {prompt.supportingText}
            </p>
          </div>
        </CardHeader>
        <CardContent className="bg-foundation/45 border-border-soft/45 space-y-3 border-t px-5 py-4 sm:px-7 sm:py-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-text-secondary text-xs font-medium tracking-[0.08em] uppercase">
                Your perspective
              </span>
              <span className="text-text-secondary text-xs">A working thought is enough.</span>
            </div>
            <div className="rounded-writing bg-surface focus-within:ring-guardian-blue/15 duration-standard ring-border-soft/45 ring-1 transition-[box-shadow] focus-within:ring-4">
              <Textarea
                className="min-h-28 resize-none border-0 bg-transparent px-4 py-3 text-base shadow-none focus:border-0"
                aria-label="Your perspective"
                value={response}
                onChange={(event) => onResponseChange(event.target.value)}
                placeholder="Share what feels most important."
                autoFocus
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <p className="text-text-secondary text-sm leading-5">
              Guardian will reflect this as a current interpretation.
            </p>
            <div className="flex items-center gap-3">
              {canReviewPrevious && (
                <Button size="sm" variant="ghost" className="px-1" onClick={onReviewPrevious}>
                  Review previous thought
                </Button>
              )}
              <Button size="sm" onClick={onSubmit}>
                {editing ? 'Update understanding' : 'Share with Guardian'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function Reflection({
  message,
  onContinue,
  onHelpGuardianUnderstandBetter,
  final,
}: {
  message: string;
  onContinue: () => void;
  onHelpGuardianUnderstandBetter: () => void;
  final: boolean;
}) {
  return (
    <motion.div initial="hidden" animate="visible" exit="exit" variants={cardReveal}>
      <Card className="border-0 bg-transparent shadow-none">
        <CardHeader className="gap-4 p-1 sm:p-2">
          <div className="space-y-2.5">
            <p className="text-guardian-blue text-sm font-medium">Understanding updated</p>
            <CardTitle className="max-w-xl text-[1.75rem] leading-[1.15] tracking-[-0.035em] sm:text-[2.1rem]">
              {message}
            </CardTitle>
            <p className="text-text-secondary max-w-md text-base leading-6">
              This is a working interpretation. You can refine it whenever more context matters.
            </p>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3 px-1 pt-2 pb-1 sm:px-2">
          <Button size="sm" onClick={onContinue}>
            {final ? 'Review my understanding' : 'Continue learning'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="px-1"
            onClick={onHelpGuardianUnderstandBetter}
          >
            Help Guardian understand this better
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function Summary({
  cardsByArea,
  reviewing,
  onAccurate,
  onChange,
  onRevisit,
}: {
  cardsByArea: Map<string, UnderstandingCard>;
  reviewing: boolean;
  onAccurate: () => void;
  onChange: () => void;
  onRevisit: (areaId: string) => void;
}) {
  return (
    <motion.div initial="hidden" animate="visible" exit="exit" variants={cardReveal}>
      <Card>
        <CardHeader className="gap-3 px-5 py-5 sm:px-7 sm:py-6">
          <p className="text-guardian-blue text-sm font-medium">My current understanding</p>
          <CardTitle className="text-[2rem] leading-[1.1] tracking-[-0.045em] sm:text-[2.75rem]">
            Here is the working picture I&apos;ve built.
          </CardTitle>
          <p className="text-text-secondary max-w-xl text-base leading-6">
            Based on what you&apos;ve shared, this is my initial interpretation. I&apos;m more
            confident in some areas than others.
          </p>
        </CardHeader>
        <CardContent className="grid gap-2.5 px-5 pb-5 sm:grid-cols-2 sm:px-7 sm:pb-7">
          {understandingAreas.map((area) => (
            <div
              key={area.id}
              className="rounded-control border-border-soft/45 bg-foundation/55 border px-3.5 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-text-primary font-medium">{area.label}</p>
                <div className="flex items-center gap-2">
                  <ConfidenceBadge confidence={area.confidence} />
                  {reviewing && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="px-1"
                      onClick={() => onRevisit(area.id)}
                    >
                      Revisit
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-text-secondary mt-2 text-sm leading-6 break-words">
                {cardsByArea.get(area.id)?.summary ??
                  'I do not have enough context to form a useful view yet.'}
              </p>
            </div>
          ))}
          <div className="border-border-soft/60 mt-2 border-t pt-4 sm:col-span-2">
            <p className="text-text-primary text-lg font-semibold">
              Does this reflect your company accurately?
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button size="sm" onClick={onAccurate}>
                Yes, that&apos;s accurate
              </Button>
              <Button size="sm" variant="ghost" className="px-1" onClick={onChange}>
                I&apos;d like to change something
              </Button>
            </div>
            {reviewing && (
              <p className="text-text-secondary mt-3 text-sm">
                Choose an area above to revisit. Guardian will preserve everything else.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function Transition({ onExploreReasoning }: { onExploreReasoning: () => void }) {
  return (
    <motion.div initial="hidden" animate="visible" variants={cardReveal}>
      <Card className="border-0 bg-transparent shadow-none">
        <CardHeader className="gap-3 p-1 sm:p-2">
          <div className="bg-success/10 text-success flex size-9 items-center justify-center rounded-full">
            <Check size={17} />
          </div>
          <div className="space-y-2.5">
            <p className="text-guardian-blue text-sm font-medium">
              An initial understanding is in place.
            </p>
            <CardTitle className="max-w-xl text-[2rem] leading-[1.1] tracking-[-0.045em] sm:text-[2.75rem]">
              Guardian is ready to begin reasoning with you.
            </CardTitle>
            <p className="text-text-secondary max-w-lg text-base leading-6">
              I have enough context to form useful strategic hypotheses. I&apos;ll keep the
              uncertainty visible as the model evolves.
            </p>
          </div>
        </CardHeader>
        <CardContent className="px-1 pt-2 pb-1 sm:px-2">
          <Button size="sm" onClick={onExploreReasoning}>
            See current reasoning
          </Button>
          <p className="text-text-secondary mt-3 text-sm">
            Account creation comes after Guardian has demonstrated lasting value.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function UnderstandingCardItem({
  area,
  card,
  focused,
  latest,
  onEdit,
  onDelete,
  onAddContext,
}: {
  area: (typeof understandingAreas)[number];
  card?: UnderstandingCard;
  focused: boolean;
  latest: boolean;
  onEdit: (card: UnderstandingCard) => void;
  onDelete: (card: UnderstandingCard) => void;
  onAddContext: (id: string) => void;
}) {
  return (
    <motion.div
      layout
      initial={false}
      animate={latest ? { y: [0, -2, 0] } : undefined}
      transition={{ duration: 0.32 }}
    >
      <div className={cn('group relative py-3 pl-3.5', focused && 'bg-surface/45')}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-text-primary text-sm font-semibold">
              <span
                aria-hidden
                className={cn(
                  'mr-2 inline-block size-1.5 rounded-full align-middle',
                  card ? 'bg-guardian-blue' : 'bg-border-soft',
                )}
              />
              {area.label}
            </p>
            {(focused || card) && (
              <p className="text-text-secondary mt-1.5 text-sm leading-5 break-words">
                {card ? card.summary : area.description}
              </p>
            )}
          </div>
          {card && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="-mt-2 -mr-2 opacity-70 transition-opacity group-hover:opacity-100"
                  aria-label={`Manage ${area.label} understanding`}
                >
                  <MoreHorizontal size={17} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => onEdit(card)}>
                  <Pencil size={15} /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onAddContext(card.id)}>
                  <Plus size={15} /> Add context
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-risk focus:text-risk"
                  onSelect={() => onDelete(card)}
                >
                  <Trash2 size={15} /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {latest && (
          <p className="text-guardian-blue mt-2 text-xs font-medium">Understanding updated</p>
        )}
        {card && card.context.length > 0 && (
          <p className="border-border-soft/60 text-text-secondary mt-3 border-t pt-3 text-xs leading-5">
            Context: {card.context.join(' · ')}
          </p>
        )}
      </div>
    </motion.div>
  );
}

function ConfidenceBadge({ confidence }: { confidence: 'High' | 'Medium' | 'Low' }) {
  const variant =
    confidence === 'High' ? 'success' : confidence === 'Medium' ? 'warning' : 'learning';
  return <Badge variant={variant}>{confidence} confidence</Badge>;
}

export { GuardianLearnsExperience };
