# Guardian

**A strategic reasoning partner for founders.**

Founders do not usually lack information. They lack a durable way to connect what they know, identify what remains uncertain, and decide which question matters next.

Guardian exists to reduce that uncertainty. It learns the company before it offers a strategic view, keeps competing explanations visible, and makes the evidence behind its current thinking understandable.

> The product is not the conversation. The product is the evolving strategic model of the company.

## Why Guardian

Most AI products begin with an answer. Guardian begins with understanding.

It turns founder evidence into a structured, evidence-led view of a company. Rather than presenting a confident conclusion too early, Guardian distinguishes claims from confirmed evidence, identifies ambiguity, maintains competing hypotheses, and explains what it would need to learn before publishing a strategic judgment.

This repository is the Build Week implementation of that philosophy: a polished founder experience backed by a live, provider-independent reasoning path.

## What Guardian is

- A strategic operating system that learns before it advises.
- An evidence-first reasoning partner for founders.
- A calm workspace for developing, challenging, and preserving strategic thinking.
- A product that treats confidence as something earned by resolving uncertainty.

## What Guardian is not

- A chatbot or generic AI wrapper.
- An onboarding checklist or questionnaire.
- A dashboard, CRM, task manager, or productivity tool.
- An autonomous co-founder that makes decisions for a founder.
- A recommendation engine that skips evidence and uncertainty.

## Experience today

1. **Guardian Learns** — founders share the parts of the company that matter; Guardian explains why each question is relevant and builds a working picture.
2. **Evidence Review** — Guardian separates founder claims, inferences, assumptions, contradictions, and unknowns.
3. **Decision Readiness** — a deterministic gate decides whether the available evidence has earned a strategic judgment.
4. **Decision Brief** — when ready, Guardian presents a provisional strategic focus with confidence, supporting evidence, alternatives, and conditions for change.
5. **Strategic Journal** — the session preserves how strategic thinking evolved without rewriting prior Decision Briefs.

## Reasoning architecture

```text
Founder Evidence
        ↓
Structured Reasoning Provider
        ↓
Typed ReasoningOutput
        ↓
Decision Readiness + Publication Gate
        ↓
Decision Brief + Strategic Journal
        ↓
Founder Experience
```

The UI does not know whether reasoning comes from OpenAI, Groq, or a future provider. Providers produce the same typed `ReasoningOutput`; Guardian owns readiness, publication, and continuity.

Read the focused architecture notes in [`docs/`](./docs):

- [Architecture](./docs/architecture.md)
- [Reasoning pipeline](./docs/reasoning-pipeline.md)
- [Decision Briefs](./docs/decision-briefs.md)
- [Strategic Journal](./docs/strategic-journal.md)
- [Design principles](./docs/design-principles.md)
- [Future direction](./docs/future-direction.md)
- [Submission readiness](./docs/submission-readiness.md)

## Quick start

### Prerequisites

- Node.js 20 or newer
- npm
- An OpenAI or Groq API key for live reasoning

### Run locally

```bash
git clone https://github.com/Abdurrahman99max/guardian.git
cd guardian
npm ci
npm run dev
```

Create the local environment file before starting the server:

```bash
# macOS / Linux
cp .env.example .env.local

# Windows PowerShell
Copy-Item .env.example .env.local
```

Open [http://localhost:3000](http://localhost:3000).

### Configure a reasoning provider

Set these values in `.env.local`:

```bash
# Use one provider at a time.
REASONING_PROVIDER=groq

GROQ_API_KEY=your_key_here
GROQ_REASONING_MODEL=openai/gpt-oss-120b

# Or:
# REASONING_PROVIDER=openai
# OPENAI_API_KEY=your_key_here
# OPENAI_REASONING_MODEL=gpt-5.6-sol
```

Keys are read only on the server. Never prefix them with `NEXT_PUBLIC_` and never commit `.env.local`.
Restart the local server after changing an environment variable.

## Common commands

| Command                | Purpose                                                   |
| ---------------------- | --------------------------------------------------------- |
| `npm run dev`          | Start the local development server.                       |
| `npm run build`        | Create a production build and type-check the application. |
| `npm run start`        | Serve the production build locally.                       |
| `npm run lint`         | Run ESLint.                                               |
| `npm run format:check` | Verify Prettier formatting.                               |
| `npm run format`       | Apply Prettier formatting.                                |

## Project organization

```text
app/                         Next.js routes and API boundary
components/                  Reusable UI primitives and shared states
features/
  guardian-learns/           Founder learning experience and evidence construction
  guardian-intelligence/     Providers, reasoning contract, judgment, and journal
lib/                          Shared utilities and motion presets
styles/                       Guardian design tokens
docs/                         Focused product and architecture documentation
```

Guardian is organized by product responsibility rather than page type. The important boundary is between presentation, founder evidence, provider reasoning, deterministic judgment, and strategic continuity.

## Engineering principles

- **Understanding before advice.** Do not turn information into a recommendation prematurely.
- **Evidence before assertion.** Claims, inferences, assumptions, and unknowns remain distinct.
- **Confidence is earned.** It rises when uncertainty is resolved and falls when evidence conflicts.
- **Providers are replaceable.** The UI consumes typed output, never provider-specific responses.
- **History is preserved.** A Decision Brief evolves through lineage; it is not silently overwritten.
- **Founder agency remains primary.** Guardian explains an observation and its evidence; the founder owns the decision.

## Build Week development

### GPT-5.6

Guardian's OpenAI reasoning provider is configured through `OPENAI_REASONING_MODEL` and defaults to `gpt-5.6-sol`. It produces the typed, evidence-led reasoning output that Guardian evaluates before it can publish a Decision Brief. The provider boundary also supports Groq for operational flexibility without changing Guardian's reasoning contract or user experience.

### Codex

Codex served as Guardian's implementation partner throughout Build Week: establishing the Next.js foundation and design system, implementing the provider-independent reasoning boundary, auditing live provider reliability, validating the build, and maintaining the documentation. Product decisions, strategic boundaries, and founder-facing philosophy remain explicitly defined by the project team.

## Current Build Week boundaries

Guardian currently uses live reasoning with session-backed strategic continuity. It does not yet include authentication, durable storage, document intelligence, external monitoring, collaboration, or strategic recommendations. Those omissions are intentional: this version demonstrates disciplined understanding and judgment before broader capability.

## The Future of Guardian

Guardian will become a continuously evolving strategic model of a company: one that remembers validated context, monitors meaningful change, explains how its view evolved, and helps founders explore strategic options without replacing their judgment.

The direction is not more conversation. It is deeper understanding, clearer decision context, and a strategic relationship that compounds over time.

---

Built for OpenAI Build Week with Next.js, TypeScript, Tailwind CSS, Motion, and provider-independent reasoning.
