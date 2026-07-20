# Architecture

## Summary

This document explains Guardian's permanent boundaries: how founder evidence becomes a strategic experience without coupling the interface to a model provider or storage implementation.

## The system boundary

```text
Founder experience
      ↓
FounderEvidence
      ↓
ReasoningProvider
      ↓
ReasoningOutput
      ↓
Deterministic judgment
      ↓
Decision Brief and Strategic Journal
      ↓
Intelligence presentation
```

Each stage has one responsibility.

| Layer                | Responsibility                                                   | Must not do                          |
| -------------------- | ---------------------------------------------------------------- | ------------------------------------ |
| `guardian-learns`    | Collect founder thinking and build evidence.                     | Call a provider or publish judgment. |
| Reasoning provider   | Transform evidence into structured reasoning.                    | Own UI, persistence, or publication. |
| Structured reasoning | Validate references and preserve epistemic discipline.           | Generate recommendations.            |
| Judgment gate        | Derive readiness and publish a Decision Brief deterministically. | Depend on a provider implementation. |
| Strategic Journal    | Preserve lineage, transitions, and milestones.                   | Rewrite historical briefs.           |
| Intelligence UI      | Present derived intelligence.                                    | Embed business or provider logic.    |

## Provider independence

`ReasoningProvider` exposes one method: `reason(request) → ReasoningOutput`.

The resolver selects an OpenAI or Groq implementation through `REASONING_PROVIDER`. Both providers use the same request and output contract. Replacing a provider must not require a UI, journal, or Decision Brief redesign.

## Storage independence

The Strategic Journal uses a repository interface. The current repository is session-backed, but domain logic communicates only through the repository contract. A future durable implementation should replace the storage adapter rather than rewrite transitions, lineage, queries, or presentation.

## Current implementation boundaries

- Reasoning is live and server-side.
- Strategic continuity is session-only.
- Decision readiness is deterministic and provider-agnostic.
- Authentication, databases, document ingestion, and recommendations are intentionally absent.
