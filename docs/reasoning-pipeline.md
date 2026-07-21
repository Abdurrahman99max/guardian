# Reasoning pipeline

## Summary

This is the path Guardian follows from founder evidence to a provisional strategic view. The point is trust, not fluent output.

## Pipeline

```text
Evidence
  → Understanding
  → Evidence review
  → Contradiction and ambiguity review
  → Competing hypotheses
  → Confidence calibration
  → Current strategic view
  → Decision context
```

Strategic guidance intentionally begins after this pipeline, not inside it.

## Evidence discipline

Guardian keeps four evidence categories distinct:

- **Confirmed evidence** — independently established information.
- **Founder claim** — what the founder reports; useful, but not automatically proven.
- **Inference** — Guardian's synthesis of available information.
- **Assumption** — a possibility that does not yet have adequate support.

Every cited conclusion references evidence by stable ID. Unknown evidence IDs are rejected, and support types are normalized against their original source.

## Competing hypotheses

The provider returns exactly three hypotheses and one leading hypothesis. The leading view is not treated as truth; it is the current explanation that best fits the evidence. Alternatives remain visible so the founder can see what has not yet been eliminated.

## Confidence

Confidence is **Low**, **Moderate**, or **High**. It is constrained by evidence quality, material tensions, and unanswered questions. High confidence cannot survive unresolved material ambiguity or a reliance on founder claims alone.

## Next cognitive action

Guardian chooses a next action—ask, clarify, challenge, explain, or ready for guidance—only when it can reduce a named uncertainty or differentiate named hypotheses. The system stops before generating recommendations.

## Failure behavior

When reasoning cannot produce a valid structured output, Guardian preserves collected evidence and withholds a strategic view. It does not fabricate evidence, confidence, or certainty.
