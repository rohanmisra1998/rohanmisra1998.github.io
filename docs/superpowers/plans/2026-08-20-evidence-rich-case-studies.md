# Evidence-rich Case Studies Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all six consulting cases prove Rohan's ownership, judgment, scale, and impact while keeping them equally weighted and visually cohesive.

**Architecture:** Extend the existing typed `WorkItem` content model with role, scale, impact classification, key decision, and reconstructed-artifact data. Keep the cards equal, render the evidence in the existing history-aware dialog, and derive assistant case answers from the same canonical content. Add one reusable artifact component whose six variants use semantic HTML and case-specific CSS geometry.

**Tech Stack:** React 19, TypeScript 7, Vite 8, Vitest/Testing Library, Playwright, CSS.

**Spec:** `docs/superpowers/specs/2026-08-20-evidence-rich-case-studies-design.md`

## Global Constraints

- Keep the six cases equal in size, order, and visual priority; no flagship treatment.
- Keep the literal `X buy-side investment theses` because no verified diligence count is available.
- Use only evidence supported by the CV/workbook; do not expose workbook names, clients, targets, or private notes.
- Use impact labels to distinguish realized, validated, modeled, targeted, and decision impact without burdening the copy with qualifiers.
- Keep case impact visible on open at desktop and 390 px.
- Preserve modal history, focus, inertness, CSP, privacy, no-network assistant, contact, nav, and section order.
- Use TDD: every production behavior begins with a focused failing test.

---

### Task 1: Extend the canonical case-study model and evidence

**Files:**

- Modify: `src/content/portfolio-types.ts`
- Modify: `src/content/portfolio-content.test.ts`
- Modify: `src/content/portfolio-content.ts`

- [ ] Add failing content tests proving every case exposes `scale`, `impactType`, `role.position`, `role.owned`, `role.partneredWith`, `keyDecision`, and a unique artifact kind.
- [ ] Add literal claim tests for India's largest payments platform, `X buy-side investment theses`, close to one million applicants, `$20M+`, `8%+`, `$40M+`, 700+ districts, ~200 markets, exactly two proof cards, and `~$250M`.
- [ ] Add a failing test proving the Trail Pulse maturity copy says `AI-assisted prototype` and does not say `vibe-coded`.
- [ ] Run `npm run test:run -- src/content/portfolio-content.test.ts` and confirm failures are caused by the missing fields/copy.
- [ ] Add `ImpactType`, `WorkRole`, `CaseArtifactKind`, and `CaseArtifact` types, then extend `WorkItem`.
- [ ] Populate all six cases from the approved evidence matrix. Use no team-size field.
- [ ] Replace the profile proof strip with `5 promotions` and `~$250M`; remove the youngest-MBA proof.
- [ ] Reframe Trail Pulse as an end-to-end AI-assisted prototype built to learn modern product development and demonstrate technical agency.
- [ ] Re-run the focused test to green and run `npm run typecheck`.
- [ ] Commit: `feat: enrich portfolio case evidence`

### Task 2: Make impact classification scannable on equal cards

**Files:**

- Modify: `src/components/SelectedWork.test.tsx`
- Modify: `src/components/WorkCard.tsx`
- Modify: `src/styles/components.css`

- [ ] Add failing tests proving the original six-case order and group sequence remain unchanged, all six cards render an impact-type label, and no case receives a featured marker.
- [ ] Run `npm run test:run -- src/components/SelectedWork.test.tsx` and confirm the missing label failure.
- [ ] Render the classification directly above each outcome without changing card structure or span.
- [ ] Style the label as a compact mono eyebrow that works in light/dark themes and at 320 px.
- [ ] Re-run the focused test to green.
- [ ] Commit: `feat: label case impact clearly`

### Task 3: Put ownership and judgment into the case dialog

**Files:**

- Modify: `src/components/CaseStudyDialog.test.tsx`
- Modify: `src/components/CaseStudyDialog.tsx`
- Modify: `src/styles/components.css`

- [ ] Add failing tests proving every dialog renders outcome first, then `My role`, then `Key decision`, followed by challenge and approach.
- [ ] Assert the role block contains Position, Owned, and Partnered with, and that the stale capability-chip rail is not used as a substitute for ownership.
- [ ] Run `npm run test:run -- src/components/CaseStudyDialog.test.tsx` and confirm the role/decision assertions fail.
- [ ] Refactor the dialog into a compact impact/ownership rail and narrative column while preserving portal mounting, history, focus, Escape, Back, inert, and scroll-lock behavior.
- [ ] Make the impact block fit within the initial desktop and 390 px dialog viewport.
- [ ] Re-run the focused test and existing App/case-history tests to green.
- [ ] Commit: `feat: show ownership and decisions in case studies`

### Task 4: Add six case-specific reconstructed artifacts

**Files:**

- Create: `src/components/CaseArtifact.tsx`
- Create: `src/components/CaseArtifact.test.tsx`
- Modify: `src/components/CaseStudyDialog.tsx`
- Modify: `src/styles/components.css`

- [ ] Add failing table-driven tests proving the six artifact kinds render their literal decision-model labels and unique `data-artifact-kind` values.
- [ ] Run `npm run test:run -- src/components/CaseArtifact.test.tsx` and confirm the component is missing.
- [ ] Implement semantic `<figure>` output with case-specific variants: merchant economics flow, investment filter, candidate journey, pilot-to-scale model, value roadmap, and commercial portfolio matrix.
- [ ] Use the existing cobalt/grid visual language, but make every shape encode a real relationship; include no fake client values or disclaimers.
- [ ] Render the artifact after the narrative in every dialog and keep all six variants equal in visual depth.
- [ ] Re-run artifact and dialog tests to green, then `npm run typecheck`.
- [ ] Commit: `feat: visualize case decisions`

### Task 5: Ground assistant answers in the expanded evidence

**Files:**

- Modify: `src/content/assistant-knowledge.ts`
- Modify: `src/assistant/retrieval.test.ts`
- Modify: `src/assistant/localAdapter.test.ts`

- [ ] Add failing retrieval/adapter tests proving supported case answers include Rohan's ownership, key decision, impact type, result, and only public case citations.
- [ ] Add negative assertions against client identities, source-workbook language, and unsupported team sizes.
- [ ] Run the two focused suites and confirm failures reflect the old process/outcome-only answers.
- [ ] Derive the existing approved case-topic answers from the canonical `WorkItem` fields instead of duplicating prose.
- [ ] Re-run the focused suites to green and run the standalone privacy audit after a build.
- [ ] Commit: `feat: ground assistant in case ownership`

### Task 6: Lock responsive behavior, visual quality, and release safety

**Files:**

- Modify: `tests/e2e/portfolio.spec.ts`
- Modify: `tests/e2e/portfolio.visual.spec.ts`
- Modify: `tests/e2e/portfolio.visual.spec.ts-snapshots/*.png`
- Modify only if required by verified behavior: `src/styles/components.css`

- [ ] Add a failing browser contract that opens all six cases and verifies visible impact, role, decision, artifact semantics, no horizontal overflow, and unchanged Back/Escape/focus behavior.
- [ ] At direct-load 390 px, assert the impact label and outcome are visible without scrolling the dialog.
- [ ] Run the focused Playwright contract and fix only observed layout defects.
- [ ] Deliberately regenerate affected zero-tolerance baselines, inspect each changed PNG, and verify desktop, tablet, 390, 320, dark, reduced-motion, profile, and case states.
- [ ] Run the unchanged visual suite twice and require identical pass results.
- [ ] Run `npm run verify`; require typecheck, build, CSP, privacy, budgets, Vitest, production E2E, and Playwright to pass.
- [ ] Run `git diff --check`, confirm approved noreply identity and no private workbook/internal artifacts, then commit the verified release.
- [ ] Use `superpowers:finishing-a-development-branch` for integration/deployment and verify the live GitHub Pages site.

