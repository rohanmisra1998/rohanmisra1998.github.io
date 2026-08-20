# Rohan Misra portfolio

A privacy-conscious React and TypeScript portfolio for an operator, strategist, and hands-on builder. The static Vite application includes accessible case-study dialogs, responsive navigation, persisted theme selection, and a deterministic local retrieval assistant grounded only in approved public portfolio content.

## Architecture

- `src/App.tsx` composes the page. Its single lazy `AssistantFeature` import is the assistant's only bundle boundary; the launcher placeholder keeps the initial layout stable while that chunk loads.
- `src/components/` contains the semantic page sections, navigation, theme control, work cards, and modal case-study presentation.
- `src/hooks/useCaseHistory.ts` synchronizes case studies with browser history and the `?case=` query contract.
- `src/hooks/useModalLayer.ts` owns modal focus containment, background isolation, scroll locking, Escape handling, and focus restoration.
- `src/hooks/usePortfolioLayers.ts` is the canonical layer controller. It serializes case-study and assistant surfaces, including focus-safe handoffs, so neither feature invents a competing owner.
- `src/assistant/` contains deterministic normalization, retrieval, response policy, and state. `src/content/assistant-knowledge.ts` derives the answer corpus from approved public portfolio facts.
- `src/content/portfolio-content.ts` is the single content authority. Its shape is enforced by `src/content/portfolio-types.ts`; components should consume this model rather than duplicate portfolio facts.
- `src/lib/publicAsset.ts` resolves same-origin public assets through Vite's configured base path.
- `scripts/` contains asset preparation, privacy auditing, script-test orchestration, and the rendered project-base smoke.

The selected-work collection has six CV-grounded professional cases, arranged under `Tech × AI × Growth` and `Operations × Large-scale transformations`. Personal builds live separately under `Personal projects`, where the portfolio and Trail Pulse demonstrate hands-on technical curiosity without presenting Trail Pulse as professional client work.

## Browser contracts

Case studies use a shareable `?case=<slug>` query. A valid slug opens its dialog on direct load. Opening a card pushes a history entry, closing returns to the prior URL when appropriate, and browser Back closes the dialog. Unknown slugs are removed without opening a case study. Every case follows the same Challenge → Approach → Outcome narrative, with the outcome anchored to a quantified KPI; the dialog title precedes industry in document order, and modal focus is contained and restored.

Theme preference is stored in local storage under `rohan-theme`. Supported values are `system`, `light`, and `dark`; `system` resolves from `prefers-color-scheme`.

GitHub Pages builds derive their base path from `GITHUB_REPOSITORY`. Rendered same-origin assets must remain beneath that base, including `/rohan-portfolio/` for the project deployment.

## Local assistant contract

Ask Rohan AI is an on-page retrieval interface, not a generative model or virtual twin. It normalizes each question, scores a frozen allowlisted corpus, and returns only authored answers, clarification prompts, or a bounded fallback. Retrieval is synchronous and deterministic: opening or querying the assistant performs no network request and reads or writes no browser storage. Refresh therefore starts a new empty conversation.

The surface has explicit closed, compact, expanded, and history-retaining minimized states. Only Clear conversation erases the transcript and topic. Citations target visible semantic sections, case handoffs pass through `usePortfolioLayers`, and the shared modal layer owns focus containment, page isolation, scroll locking, Escape, and focus restoration.

## Privacy boundary

The published site exposes approved portfolio copy, allowlisted HTTPS destinations, and one exact direct-email action: `mailto:misrarohan619@gmail.com`. The privacy audit recursively scans `src`, `public`, `index.html`, and `dist`; it permits only that exact public address and bare mail destination while rejecting other email addresses, contact protocols, mailto suffixes or query variants, normalized encoded contact links, contact-shaped filenames, phone patterns, private-topic markers, source-document names, the obsolete public-report URL, every published PDF regardless of environment, malformed text, and symbolic links. No CV control or artifact is published.

Production builds are gated by a hash-based meta CSP with `connect-src 'none'`, a secured-dist real-browser test, the recursive privacy audit, and an assistant lazy-chunk budget. The CSP check proves the final HTML still loads its hashed inline boot code, module, styles, fonts, and same-origin images without violations while blocking connections.

## Development and verification

```powershell
npm install
npm run dev
```

Run the release verification before handoff:

```powershell
npm run verify
```

`npm run verify` preserves the required gate order: script tests, unit/component tests, project-base smoke, secured production build, assistant budget, privacy audit, production-CSP browser checks, and the complete Playwright suite. The Win32 visual baselines are deliberately reviewed release artifacts; snapshot comparisons remain zero-tolerance (`threshold: 0`, no masks) and changes require inspection rather than automatic acceptance.
