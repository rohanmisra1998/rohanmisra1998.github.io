# Evidence-rich case studies

## Objective

Make the portfolio demonstrate senior ownership and judgment—not just polished process—while preserving the existing equal-weight six-case structure.

The site should help a skeptical hiring manager answer five questions quickly:

1. What did Rohan own?
2. What decision did he make or enable?
3. At what scale did he operate?
4. Was the impact realized, validated, modeled, or targeted?
5. What did the work product actually look like?

## Guardrails

- Keep all six case cards equal in size, order, and visual priority
- Do not create or label a flagship case
- Keep `X buy-side investment theses`; do not infer a diligence count
- Use no invented team sizes, transaction values, employee counts, or implementation durations
- Keep confidential clients and targets anonymized
- Do not publish source-workbook language, filenames, or private process notes
- Preserve the existing accessibility, modal-history, privacy, CSP, and no-network assistant contracts
- Keep the outcome visible when each case opens at desktop and 390 px

## Information model

Each `WorkItem` gains four structured fields:

- `impactType`: a short classification such as `Realized impact` or `Modeled opportunity`
- `role`: a compact object with `position`, `owned`, and `partneredWith`
- `keyDecision`: one sentence describing the senior tradeoff or hardest call
- `artifact`: a structured, reconstructed representation of the work product

Team size is intentionally omitted because no verified number is available. `Partnered with` communicates cross-functional scope without implying direct reporting lines.

## Case evidence matrix

### Omnichannel payments strategy

- Scale: India's largest payments platform; acquired offline point-of-sale capability; four-year roadmap
- My role: Core financial-model owner and product/GTM strategy workstream lead
- Owned: Bottom-up economics, scenario analysis, roadmap phasing, sales operating model, and partnership choices
- Partnered with: Product, sales, partnerships, and leadership
- Key decision: Prioritize platform capabilities versus merchant-specific customization using value, time-to-market, and scalability, then phase investment accordingly
- Impact classification: `Modeled opportunity`
- Outcome: `$150M+ value-uplift path`
- Artifact: Merchant-economics decision model linking segment, activation, take rate, cost to serve, payback, and rollout phase

### B2B SaaS & logistics investment diligence

- Scale: Multiple buy-side diligences across B2B SaaS and logistics under compressed timelines
- My role: Commercial-diligence workstream lead
- Owned: Market model, investment-thesis pressure test, value-creation prioritization, and risk synthesis
- Partnered with: Investment team, diligence team, and industry experts
- Key decision: Establish directional market conviction before deepening value-creation work because the market view determined the go/no-go decision and where upside could credibly exist
- Impact classification: `Decision impact`
- Outcome: `Informed X buy-side investment theses`
- Artifact: Investment filter connecting market attractiveness, right to win, value-creation potential, and downside risk to a go/no-go view

### AI-powered recruiting transformation

- Scale: Hiring system supporting close to one million applicants annually
- My role: Cross-functional process-design lead
- Owned: End-to-end journey diagnostic, pilot design, AI-workflow integration, success metrics, and multiyear roadmap
- Partnered with: Recruiting, HR, hiring managers, and leadership
- Key decision: Anchor tradeoffs on candidate experience, process consistency, and stakeholder time, then prove the new model with early-adopter pilots before scaling
- Impact classification: `Implementation target`
- Outcome: `~15,000 hours of annual recruiting and talent-team capacity`
- Artifact: AI-enabled candidate journey showing where screening, scheduling, structured interviews, and measurement replace fragmented manual work

### Utilities workforce transformation

- Scale: ~$9B enterprise; 10+ operating-center pilots
- My role: End-to-end transformation lead
- Owned: Diagnostic, workforce-model design, pilot implementation, adoption model, and scale-up path
- Partnered with: Site leaders, supervisors, planners, schedulers, and frontline crews
- Key decision: Reset the rollout from simultaneous multi-site deployment to a focused proof at one site, then use internal champions to scale adoption
- Impact classification: `Realized impact`
- Outcome: `$20M+ delivered savings and 8%+ productivity improvement`
- Artifact: Pilot-to-scale operating model linking work demand, planning, scheduling, crew assignment, frontline feedback, and KPI cadence

### Automotive performance transformation

- Scale: ~$15B enterprise; five regions; 10+ value levers
- My role: Supply-chain value-creation workstream lead
- Owned: Regional fact base, lever sizing and prioritization, executive decision narrative, and sequenced roadmap
- Partnered with: Regional leaders and C-suite stakeholders
- Key decision: Move away from cross-border supply-chain integration when external risk changed, then rebuild the value agenda around sourcing, footprint, inventory, and logistics
- Impact classification: `Validated opportunity`
- Outcome: `$40M+ savings identified across five regions`
- Artifact: Value-realization roadmap organizing levers by value, feasibility, dependency, owner, and phase

### Pharma & life-sciences growth transformation

- Scale: ~$4B pharma enterprise; 700+ districts assessed; approximately 200 priority markets
- My role: Commercial analytics and market-expansion workstream lead
- Owned: Distributor-performance diagnostic, network rationalization, district prioritization, and expansion logic
- Partnered with: Commercial and regional teams
- Key decision: Prune low-performing distributors while concentrating expansion on the highest-potential markets instead of maximizing partner count or geographic breadth
- Impact classification: `Execution result`
- Outcome: `30%+ distributor rationalization and ~200 priority markets identified`
- Artifact: Commercial portfolio matrix connecting distributor performance and market attractiveness to retain, improve, exit, or expand decisions

## Card design

The six existing cards remain equal. Each card keeps its case-specific geometric visual and adds a small impact-classification label immediately above the outcome. Outcome language becomes concise enough to scan without opening the case.

No card receives a featured treatment, larger footprint, “read this first” label, or reordered placement.

## Dialog design

Desktop hierarchy:

```text
┌──────────────────────────────────────────────────────────────┐
│ Title · industry                                      Close │
├───────────────────────┬──────────────────────────────────────┤
│ IMPACT TYPE           │ KEY DECISION                         │
│ Outcome               │ Senior tradeoff in one sentence     │
│                       ├──────────────────────────────────────┤
│ MY ROLE               │ CHALLENGE                            │
│ Position              │ What had to change                   │
│ Owned                 ├──────────────────────────────────────┤
│ Partnered with        │ APPROACH                             │
│                       │ How the work moved to action         │
│                       ├──────────────────────────────────────┤
│                       │ RECONSTRUCTED ARTIFACT               │
└───────────────────────┴──────────────────────────────────────┘
```

The impact block remains fully visible when the dialog opens. On mobile, the sequence is title, impact, My role, key decision, challenge, approach, artifact. The reconstructed artifact can sit below the initial viewport; the impact cannot.

All six artifacts use the existing cobalt/grid visual system, but their geometry represents the actual decision model for the case rather than generic decoration. They contain no fake client data and need no confidentiality disclaimer in the visible UI.

## Profile proof changes

The expanded profile has two equal proof columns:

- `5 promotions` — five promotions in under four years at Bain on a top-rated, accelerated trajectory
- `~$250M` — approximately $250M in delivered, validated, and modeled value across Bain engagements

Remove the “Youngest student” proof entirely and do not replace it with another third card.

The total deliberately describes mixed impact types instead of implying every dollar was realized.

## Personal-project framing

Replace Trail Pulse's “vibe-coded” framing with:

> An early AI-assisted prototype built end-to-end to learn modern product development and demonstrate technical agency—not positioned as a flagship product.

Retain its actual product capabilities and the existing honest maturity distinction. Keep the portfolio project description focused on React/TypeScript, accessibility, deterministic local retrieval, privacy auditing, CSP enforcement, Playwright coverage, and hosted release verification.

## Assistant behavior

The local assistant should derive case answers from the expanded structured content. Answers about a case should distinguish:

- what Rohan owned
- the key decision
- the impact classification and result
- the relevant public case citation

No workbook content, client identifiers, hidden notes, or unsupported numbers enter the assistant corpus.

## Testing and release gates

- Content tests: all six cases have role, decision, impact type, scale, and artifact data
- Claim tests: the exact approved figures and impact classifications remain stable
- Dialog tests: My role and Key decision appear for every case; impact remains before them in reading order
- Card tests: six equal cards, unchanged grouping and order, visible impact classification
- Artifact tests: each case exposes a unique semantic visual system with the expected parts
- Profile tests: exactly two proof points; “Youngest” absent; `~$250M` present
- Assistant tests: case responses include ownership and impact classification without leaking private source material
- Browser tests: impact visible without scrolling at desktop and 390 px; no overflow at 1440, 1024, 768, 390, or 320 px
- Visual tests: all home and case-dialog baselines reviewed at zero tolerance and repeated unchanged
- Full release: typecheck, build, privacy audit, CSP, assistant budgets, Vitest, and Playwright all pass before deployment

## Non-goals

- No flagship or featured utilities case
- No new case count, diligence count, team size, or transaction value
- No client names or confidential artifacts
- No change to the primary navigation, section order, contact model, or hosting architecture
