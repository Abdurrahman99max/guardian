'use client';

import { AnimatePresence, motion } from 'motion/react';
import { Check, MoreHorizontal, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

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
import { cardReveal, fadeUp } from '@/lib/motion/presets';
import { cn } from '@/lib/utils';

import { learningPrompts, understandingAreas, type UnderstandingCard } from './model';

type View = 'introduction' | 'learning' | 'reflection' | 'summary' | 'transition';

function GuardianLearnsExperience() {
  const [view, setView] = useState<View>('introduction');
  const [promptIndex, setPromptIndex] = useState(0);
  const [response, setResponse] = useState('');
  const [cards, setCards] = useState<UnderstandingCard[]>([]);
  const [latestCardId, setLatestCardId] = useState<string | null>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [contextCardId, setContextCardId] = useState<string | null>(null);
  const [context, setContext] = useState('');

  const activePrompt = learningPrompts[promptIndex];
  const activeArea = understandingAreas.find((area) => area.id === activePrompt?.areaId);
  const contextCard = cards.find((card) => card.id === contextCardId);
  const cardsByArea = useMemo(() => new Map(cards.map((card) => [card.areaId, card])), [cards]);

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
    if (promptIndex === learningPrompts.length - 1) {
      setView('summary');
      return;
    }

    setPromptIndex((index) => index + 1);
    setView('learning');
  }

  function editCard(card: UnderstandingCard) {
    const index = learningPrompts.findIndex((prompt) => prompt.id === card.id);
    setPromptIndex(index);
    setResponse(card.response);
    setEditingCardId(card.id);
    setView('learning');
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

  return (
    <main className="bg-foundation min-h-screen px-4 py-5 sm:px-6 sm:py-8">
      <div className="max-w-content mx-auto flex flex-col gap-8">
        <header className="flex items-center justify-between px-1 py-1">
          <div className="flex items-center gap-3">
            <span aria-hidden className="bg-guardian-blue size-2.5 rounded-full" />
            <span className="text-text-primary text-sm font-semibold tracking-[0.18em] uppercase">
              Guardian
            </span>
          </div>
          <Badge variant="learning">Learning</Badge>
        </header>

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] xl:gap-12">
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
                  onResponseChange={setResponse}
                  onSubmit={submitResponse}
                />
              )}
              {view === 'reflection' && activePrompt && (
                <Reflection
                  key="reflection"
                  message={activePrompt.reflection}
                  onContinue={continueLearning}
                  final={promptIndex === learningPrompts.length - 1}
                />
              )}
              {view === 'summary' && (
                <Summary
                  key="summary"
                  cardsByArea={cardsByArea}
                  onAccurate={() => setView('transition')}
                  onChange={() => {
                    setPromptIndex(0);
                    setView('learning');
                  }}
                />
              )}
              {view === 'transition' && <Transition key="transition" />}
            </AnimatePresence>
          </section>

          <aside className="space-y-3 lg:sticky lg:top-8">
            <div className="border-border-soft/60 border-b px-1 pb-4">
              <p className="text-text-primary text-sm font-semibold tracking-[-0.01em]">
                Understanding
              </p>
              <p className="text-text-secondary mt-1.5 text-sm leading-6">
                Guardian is building a working view of your company.
              </p>
            </div>
            <div className="divide-border-soft/60 divide-y">
              {understandingAreas.map((area) => (
                <UnderstandingCardItem
                  key={area.id}
                  area={area}
                  card={cardsByArea.get(area.id)}
                  latest={latestCardId === cardsByArea.get(area.id)?.id}
                  onEdit={editCard}
                  onDelete={deleteCard}
                  onAddContext={setContextCardId}
                />
              ))}
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
        <CardHeader className="gap-6 p-1 sm:p-2">
          <Badge variant="learning" className="w-fit">
            A considered start
          </Badge>
          <div className="max-w-2xl space-y-4">
            <p className="text-guardian-blue text-sm font-medium">
              Guardian learns before it advises.
            </p>
            <CardTitle className="text-4xl leading-[1.06] tracking-[-0.05em] sm:text-[3.25rem]">
              Before I can help with strategic decisions, I need to understand what you&apos;re
              building.
            </CardTitle>
            <p className="text-text-secondary max-w-xl text-base leading-7">
              You do not need to explain everything today. We&apos;ll build an initial understanding
              now, then continue learning alongside your company over time.
            </p>
          </div>
        </CardHeader>
        <CardContent className="px-1 pt-1 pb-1 sm:px-2">
          <Button onClick={onBegin}>Begin with what matters</Button>
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
  onResponseChange,
  onSubmit,
}: {
  prompt: (typeof learningPrompts)[number];
  areaLabel: string;
  response: string;
  editing: boolean;
  onResponseChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <motion.div initial="hidden" animate="visible" exit="exit" variants={cardReveal}>
      <Card className="overflow-hidden">
        <CardHeader className="gap-4 px-6 py-6 sm:px-8 sm:py-8">
          <Badge className="w-fit">Building understanding: {areaLabel}</Badge>
          <div className="space-y-3">
            <CardTitle className="max-w-2xl text-3xl leading-[1.12] tracking-[-0.04em] sm:text-[2.5rem]">
              {prompt.prompt}
            </CardTitle>
            <p className="text-text-secondary max-w-xl text-base leading-7">
              {prompt.supportingText}
            </p>
          </div>
        </CardHeader>
        <CardContent className="bg-foundation/45 border-border-soft/45 space-y-4 border-t px-6 py-5 sm:px-8 sm:py-6">
          <div className="rounded-writing border-border-soft/55 bg-surface focus-within:border-guardian-blue/50 focus-within:shadow-card duration-standard border transition-[border-color,box-shadow]">
            <div className="flex items-center justify-between px-4 pt-3">
              <span className="text-text-secondary text-xs font-medium tracking-[0.08em] uppercase">
                Your perspective
              </span>
              <span className="text-learning text-xs">A working thought is enough.</span>
            </div>
            <Textarea
              className="min-h-36 border-0 bg-transparent px-4 pt-2 pb-4 shadow-none focus:border-0"
              value={response}
              onChange={(event) => onResponseChange(event.target.value)}
              placeholder="Share what feels most important."
              autoFocus
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <p className="text-text-secondary text-xs leading-5">
              Guardian will reflect this as a current interpretation.
            </p>
            <Button onClick={onSubmit}>
              {editing ? 'Update understanding' : 'Share with Guardian'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function Reflection({
  message,
  onContinue,
  final,
}: {
  message: string;
  onContinue: () => void;
  final: boolean;
}) {
  return (
    <motion.div initial="hidden" animate="visible" exit="exit" variants={cardReveal}>
      <Card className="border-0 bg-transparent shadow-none">
        <CardHeader className="gap-5 p-1 sm:p-2">
          <motion.div
            className="bg-guardian-blue/10 text-guardian-blue flex size-11 items-center justify-center rounded-full"
            variants={fadeUp}
          >
            <Sparkles size={20} />
          </motion.div>
          <div className="space-y-3">
            <p className="text-guardian-blue text-sm font-medium">Understanding updated</p>
            <CardTitle className="max-w-xl text-3xl leading-[1.12] tracking-[-0.04em] sm:text-[2.5rem]">
              {message}
            </CardTitle>
            <p className="text-text-secondary max-w-xl text-base leading-7">
              This is a working interpretation, not a final conclusion. You can refine it at any
              time.
            </p>
          </div>
        </CardHeader>
        <CardContent className="px-1 pt-2 pb-1 sm:px-2">
          <Button onClick={onContinue}>
            {final ? 'Review my understanding' : 'Continue learning'}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function Summary({
  cardsByArea,
  onAccurate,
  onChange,
}: {
  cardsByArea: Map<string, UnderstandingCard>;
  onAccurate: () => void;
  onChange: () => void;
}) {
  return (
    <motion.div initial="hidden" animate="visible" exit="exit" variants={cardReveal}>
      <Card>
        <CardHeader className="gap-4 px-6 py-6 sm:px-8 sm:py-8">
          <p className="text-guardian-blue text-sm font-medium">My Current Understanding</p>
          <CardTitle className="text-4xl leading-[1.06] tracking-[-0.05em] sm:text-[3.25rem]">
            Here is the working picture I&apos;ve built so far.
          </CardTitle>
          <p className="text-text-secondary max-w-2xl text-base leading-7">
            Based on what you&apos;ve shared, this is my initial interpretation. I&apos;m more
            confident in some areas than others.
          </p>
        </CardHeader>
        <CardContent className="space-y-3 px-6 pb-6 sm:px-8 sm:pb-8">
          {understandingAreas.map((area) => (
            <div
              key={area.id}
              className="rounded-control border-border-soft/55 bg-foundation/55 border px-4 py-3.5"
            >
              <div className="flex items-center justify-between gap-4">
                <p className="text-text-primary font-medium">{area.label}</p>
                <ConfidenceBadge confidence={area.confidence} />
              </div>
              <p className="text-text-secondary mt-2 text-sm leading-6">
                {cardsByArea.get(area.id)?.summary ??
                  'I do not have enough context to form a useful view yet.'}
              </p>
            </div>
          ))}
          <div className="border-border-soft/60 mt-6 border-t pt-5">
            <p className="text-text-primary text-lg font-semibold">
              Does this reflect your company accurately?
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={onAccurate}>
                <Check size={16} /> Yes, that&apos;s accurate
              </Button>
              <Button variant="outline" onClick={onChange}>
                I&apos;d like to change something
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function Transition() {
  return (
    <motion.div initial="hidden" animate="visible" variants={cardReveal}>
      <Card className="border-0 bg-transparent shadow-none">
        <CardHeader className="gap-5 p-1 sm:p-2">
          <div className="bg-success/10 text-success flex size-11 items-center justify-center rounded-full">
            <Check size={20} />
          </div>
          <div className="space-y-3">
            <p className="text-guardian-blue text-sm font-medium">Initial understanding created</p>
            <CardTitle className="max-w-xl text-4xl leading-[1.06] tracking-[-0.05em] sm:text-[3.25rem]">
              We&apos;ve built an initial understanding together.
            </CardTitle>
            <p className="text-text-secondary max-w-xl text-base leading-7">
              Create your account so I can continue learning alongside your company.
            </p>
          </div>
        </CardHeader>
        <CardContent className="px-1 pt-2 pb-1 sm:px-2">
          <Button disabled>Create account to continue</Button>
          <p className="text-text-secondary mt-3 text-sm">
            Account creation will be available in a future mission.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function UnderstandingCardItem({
  area,
  card,
  latest,
  onEdit,
  onDelete,
  onAddContext,
}: {
  area: (typeof understandingAreas)[number];
  card?: UnderstandingCard;
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
      <div
        className={cn(
          'group duration-standard relative py-4 pl-4 transition-colors',
          card ? 'before:bg-guardian-blue/75' : 'before:bg-border-soft',
          'before:absolute before:inset-y-4 before:left-0 before:w-px',
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-text-primary text-sm font-semibold">{area.label}</p>
            <p className="text-text-secondary mt-1 text-sm leading-6">
              {card ? card.summary : area.description}
            </p>
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
        {card && (
          <div className="mt-2.5 flex items-center justify-between gap-3">
            <ConfidenceBadge confidence={area.confidence} />
            <span className="text-text-secondary text-xs">Understanding updated</span>
          </div>
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
