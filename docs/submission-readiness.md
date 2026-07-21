# Submission readiness

Use this as the final release check before recording. A reviewer should be able to understand, run, and assess Guardian without needing any background from me.

## Before sharing the repository

- [ ] Make sure the repository is accessible to reviewers. If it remains private, add every required reviewer before submission.
- [ ] Check that the README explains the problem, Guardian's intentional boundaries, architecture, setup, live-reasoning configuration, commands, and future direction.
- [ ] Confirm that no API keys, `.env.local` files, recordings, or other sensitive material are committed.
- [ ] Keep `docs/` focused on the architecture, reasoning pipeline, Decision Briefs, Strategic Journal, design system, and future direction.

## Verify a fresh clone

- [ ] Use Node.js 20 or later.
- [ ] Run `npm ci` from a new checkout.
- [ ] Copy `.env.example` to `.env.local`, configure one reasoning provider, then run `npm run dev`.
- [ ] Run `npm run format:check`, `npm run lint`, and `npm run build` before the final push.
- [ ] Confirm that `npm run start` serves the completed production build.

## Check the live experience

- [ ] Configure the same server-side reasoning environment variables in the deployed environment and redeploy after changing them.
- [ ] Confirm a representative founder scenario completes a live reasoning request without browser-console errors.
- [ ] Run the calibrated Ledgerline scenario from the [Demo Conversation Script](./demo-conversation-script.md) and confirm it publishes Decision Brief Version 1.
- [ ] Confirm that a contradictory scenario remains in Learning Mode and asks for clarification rather than presenting a confident judgment.
- [ ] Confirm the Strategic Journal shows current and recent strategic evolution during the demo session.
- [ ] Have a reliable demo scenario ready; do not expose provider keys or private founder information in the recording.

## Finish the Build Week handoff

- [ ] Confirm that the final submission includes the project description, demo video, source repository, and any required materials listed by OpenAI Build Week.
- [ ] Submit feedback about Codex through the official [Codex Use & Feedback form](https://openai.com/form/codex-project-showcase-and-feedback/).
- [ ] Verify the deployed URL and repository URL from an incognito or signed-out browser before sharing them.

## Remaining engineering risks

- Live reasoning depends on the selected provider's API availability, credentials, limits, and supported model. Guardian fails safely when a provider cannot return disciplined output.
- Strategic continuity is session-backed in the Build Week implementation. Refreshing or closing a browser session intentionally clears its local reasoning history; durable continuity belongs to a later roadmap phase.
- The project is validated with formatting, linting, production builds, and scenario review. A dedicated automated test suite is a worthwhile post-Build-Week investment, not a blocker for this submission.
