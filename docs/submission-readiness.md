# Submission readiness

This checklist is the final engineering handoff before demo production. It confirms that a reviewer can understand, run, and assess Guardian without needing unpublished context.

## Repository review

- [ ] The repository is accessible to reviewers. If it remains private, add every required reviewer before submission.
- [ ] The README explains the problem, Guardian's intentional boundaries, its architecture, setup, live-reasoning configuration, commands, and future direction.
- [ ] No API keys, `.env.local` files, recordings, or other sensitive material are committed.
- [ ] `docs/` contains focused explanations of the architecture, reasoning pipeline, Decision Briefs, Strategic Journal, design system, and future direction.

## Fresh-clone verification

- [ ] Use Node.js 20 or later.
- [ ] Run `npm ci` from a new checkout.
- [ ] Copy `.env.example` to `.env.local`, configure one reasoning provider, then run `npm run dev`.
- [ ] Run `npm run format:check`, `npm run lint`, and `npm run build` before the final push.
- [ ] Confirm that `npm run start` serves the completed production build.

## Live reasoning and demo checks

- [ ] Configure the same server-side reasoning environment variables in the deployed environment and redeploy after changing them.
- [ ] Confirm a representative founder scenario completes a live reasoning request without browser-console errors.
- [ ] Confirm that a contradictory scenario remains in Learning Mode and asks for clarification rather than presenting a confident judgment.
- [ ] Confirm the Strategic Journal shows current and recent strategic evolution during the demo session.
- [ ] Have a reliable demo scenario ready; do not expose provider keys or private founder information in the recording.

## Build Week handoff

- [ ] Confirm the final submission includes the project description, demo video, source repository, and any required materials listed by OpenAI Build Week.
- [ ] Submit Codex feedback through the official [Codex Use & Feedback form](https://openai.com/form/codex-project-showcase-and-feedback/).
- [ ] Verify the deployed URL and repository URL from an incognito or signed-out browser before sharing them.

## Remaining engineering risks

- Live reasoning depends on the selected provider's API availability, credentials, limits, and supported model. Guardian fails safely when a provider cannot return disciplined output.
- Strategic continuity is session-backed in the Build Week implementation. Refreshing or closing a browser session intentionally clears its local reasoning history; durable continuity belongs to a later roadmap phase.
- The project is validated with formatting, linting, production builds, and scenario review. A dedicated automated test suite is a worthwhile post-Build-Week investment, not a blocker for this submission.
