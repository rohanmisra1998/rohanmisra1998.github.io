import type { PortfolioContent } from './portfolio-types'

export const portfolioContent: PortfolioContent = {
  hero: {
    eyebrow: 'Strategy & operations · Marketplaces · Applied AI',
    headline: 'I turn messy operations into scalable products and systems.',
    subhead: "I'm Rohan Misra, a high agency tech-first strategy and operations leader. I turn complex operating problems into practical pilots, product roadmaps, and systems that can scale—across marketplaces, transformation, and applied AI.",
    current: 'Senior Manager, Strategy & Operations at eBay · San Jose, CA',
    chips: [
      'Marketplace & product strategy',
      'Operating transformation',
      'Growth & commercial strategy',
      'Private-equity diligence',
      'Cross-functional leadership',
      'Applied-AI builder'
    ]
  },
  work: [
    {
      slug: 'end-to-end-parts-buyer-experience', category: 'product', group: 'tech-ai-growth',
      title: "Reimagining eBay's parts buyer experience", industry: 'eBay · Global marketplace',
      scale: "Global marketplace · One of commerce's most technical buying journeys",
      impactType: 'In-flight impact',
      role: {
        position: 'Strategy & operations program lead',
        owned: 'Opportunity sizing, problem definition, solution scope, roadmap, resourcing, governance, and cross-functional delivery.',
        partneredWith: 'Product, engineering, search, design, analytics, marketing, and regional business teams.'
      },
      keyDecision: 'Made compatibility confidence the foundation of the experience, sequencing guided discovery and technical item pages ahead of repair-job cross-sell so growth rested on buyer trust.',
      capabilities: ['Buyer-experience strategy', 'Growth experimentation', 'Cross-functional delivery', 'Product roadmapping'],
      thesis: 'Turn a fragmented, high-anxiety parts journey into a guided, confidence-building experience—from first search to a complete repair basket.',
      challenge: 'Parts buyers must translate a repair need into a compatible set of highly technical products; a horizontal marketplace journey left too much of that burden with the customer.',
      approach: 'Scoped the opportunity, secured cross-functional capacity, and drove a verticalized buyer journey into delivery—combining guided search-result filters, richer technical item pages, and stronger fitment confidence, with repair-job cross-sell extending the journey beyond a single part.',
      outcome: '~$XXM incremental GMV opportunity.'
    },
    {
      slug: 'omnichannel-payments-strategy', category: 'product', group: 'tech-ai-growth',
      title: 'Omnichannel payments growth strategy', industry: "Fintech · India's largest payments platform",
      scale: "India's largest payments platform · Four-year product and GTM roadmap",
      impactType: 'Realized impact',
      role: {
        position: 'Product strategy & GTM workstream lead',
        owned: 'Core economics, merchant segmentation, product-roadmap phasing, sales operating model, and partnership strategy.',
        partneredWith: 'Product, sales, partnerships, and executive leadership.'
      },
      keyDecision: 'Set maximum transaction value as the north star, then sequenced merchant features against value, time to market, and scalability—resolving the tension between a reusable platform core and one-off customization.',
      capabilities: ['Product roadmaps', 'Go-to-market design', 'Sales operating model', 'Partnership strategy'],
      thesis: 'Turn an offline point-of-sale acquisition into a scaled omnichannel payments growth engine.',
      challenge: 'Define the economics and rollout of a new omnichannel proposition without a clear Indian-market precedent or complete data.',
      approach: 'Built bottom-up revenue, margin, and payback economics by merchant segment; triangulated assumptions with market evidence and customer, product, sales, and partnership inputs; and translated the answer into a four-year product and GTM roadmap.',
      outcome: '$150M+ realized GMV uplift.'
    },
    {
      slug: 'buy-side-commercial-diligence', category: 'diligence', group: 'tech-ai-growth',
      title: 'B2B SaaS & logistics investment diligence', industry: 'Private equity · B2B SaaS and logistics',
      scale: 'X buy-side diligences · B2B SaaS and logistics',
      impactType: 'Investment decisions',
      role: {
        position: 'Commercial diligence workstream lead',
        owned: 'Market model, investment-thesis pressure test, competitive positioning, risk synthesis, and value-creation prioritization.',
        partneredWith: 'Investment teams, case leadership, and industry experts.'
      },
      keyDecision: 'Established market conviction first because it determined the go/no-go call, then focused the remaining diligence on the value-creation levers that could change returns.',
      capabilities: ['Market assessment', 'Competitive positioning', 'Right-to-win analysis', 'Risk synthesis'],
      thesis: 'Convert incomplete evidence into a decision-ready view of market quality, right to win, downside risk, and value creation.',
      challenge: 'Evaluate fast-moving B2B SaaS and logistics businesses with incomplete evidence under compressed investment timelines.',
      approach: 'Triangulated primary research, market modeling, competitive evidence, and scenario analysis; then linked the market view to the highest-confidence growth, pricing, and operational levers.',
      outcome: 'X buy-side investment theses informed.'
    },
    {
      slug: 'talent-acquisition-operating-model', category: 'transformation', group: 'tech-ai-growth',
      title: 'AI-led talent acquisition transformation', industry: 'Insurance · ~$50B P&C carrier',
      scale: '~1M applicants annually · Enterprise recruiting',
      impactType: 'Realized impact',
      role: {
        position: 'Cross-functional transformation lead',
        owned: 'End-to-end journey diagnostic, AI workflow design, interview redesign, pilot launch, adoption model, success metrics, and multiyear roadmap.',
        partneredWith: 'Recruiting, HR, hiring managers, and executive leadership.'
      },
      keyDecision: 'Aligned recruiting, HR, and hiring managers on candidate experience, process consistency, and stakeholder time, then proved the model with early adopters before scaling.',
      capabilities: ['AI-tool integration', 'Process redesign', 'Operating model', 'Multiyear planning'],
      thesis: 'Redesign recruiting around AI so teams spend less time on manual work while candidates move through a faster, more consistent process.',
      challenge: 'Transform a fragmented hiring journey whose stakeholders were optimizing for different outcomes across close to one million applicants annually.',
      approach: 'Mapped the applicant journey, simplified handoffs, integrated AI screening and scheduling, standardized interviews, and used weekly pilot metrics to build adoption.',
      outcome: '~15,000 recruiting hours saved annually.'
    },
    {
      slug: 'workforce-operations-transformation', category: 'transformation', group: 'operations-transformations',
      title: 'Utilities field-operations transformation', industry: 'Utilities · ~$9B enterprise',
      scale: '~$9B utility · 10+ operating centers',
      impactType: 'Realized impact',
      role: {
        position: 'End-to-end transformation lead',
        owned: 'Scoping, diagnostic, workforce-model design, pilot implementation, frontline adoption, and scale-up path.',
        partneredWith: 'Site leaders, supervisors, planners, schedulers, and frontline crews.'
      },
      keyDecision: 'After the first pilot met frontline resistance, reset the rollout to prove the model at one operating center, then used frontline champions to scale the change.',
      capabilities: ['Workforce operations', 'Pilot design', 'Process redesign', 'Stakeholder alignment'],
      thesis: 'Turn field-workforce planning into a repeatable operating system that improves productivity and lowers cost.',
      challenge: 'Redesign planning, scheduling, crew assignment, and workforce management across electricity operating centers while overcoming frontline resistance.',
      approach: 'Diagnosed sources of lost crew time, redesigned core workflows and management routines, implemented pilots across 10+ operating centers, and created the frontline feedback and KPI cadence required for adoption.',
      outcome: '$20M+ savings delivered · 8%+ workforce productivity improvement.'
    },
    {
      slug: 'performance-and-value-realization-program', category: 'transformation', group: 'operations-transformations',
      title: 'Automotive supply-chain transformation', industry: 'Automotive services · ~$15B enterprise',
      scale: '~$15B enterprise · Five regions · 10+ levers',
      impactType: 'Identified opportunity',
      role: {
        position: 'Supply-chain transformation workstream lead',
        owned: 'Regional fact base, lever sizing and prioritization, future-state operating model, C-suite alignment, and multiyear roadmap.',
        partneredWith: 'Regional leaders and C-suite stakeholders.'
      },
      keyDecision: 'Abandoned the original cross-border integration thesis when external risk shifted, then rebuilt the value agenda around resilient regional levers.',
      capabilities: ['Supply chain', 'Value-lever identification', 'Executive workshops', 'Implementation roadmaps'],
      thesis: 'Convert a fragmented regional supply chain into a sequenced, executable performance agenda.',
      challenge: 'Unlock performance across acquisition-built regional operations while navigating local autonomy and changing cross-border risk.',
      approach: 'Sized 10+ levers across sourcing, warehouse footprint, inventory, transportation, and network design, then used C-suite workshops to align on tradeoffs and sequencing.',
      outcome: '$40M+ savings identified across five regions.'
    },
    {
      slug: 'pharma-life-sciences-growth-transformation', category: 'transformation', group: 'operations-transformations',
      title: 'Pharma distribution & life-sciences growth', industry: 'Pharmaceuticals and life sciences · India',
      scale: '~$4B pharma enterprise · 770+ districts assessed',
      impactType: 'Execution result',
      role: {
        position: 'Commercial growth & life-sciences strategy workstream lead',
        owned: 'Distributor-performance diagnostic, channel rationalization, district prioritization, adult-vaccine sector scan, and add-on acquisition opportunity assessment.',
        partneredWith: 'Commercial, regional, and investment teams.'
      },
      keyDecision: 'Concentrated resources instead of expanding indiscriminately—pruning underperforming distributors while prioritizing the strongest geographic markets and life-sciences adjacencies.',
      capabilities: ['Distribution transformation', 'Market entry', 'Sector mapping', 'Acquisition-led value creation'],
      thesis: 'Focus commercial and investment resources on the channels, markets, and adjacencies with the strongest right to win.',
      challenge: 'Across separate engagements, reshape a fragmented pharmaceutical distribution network and identify acquisition-led life-sciences opportunities.',
      approach: 'Assessed distributor performance and opportunity across 770+ districts, rationalized the channel network, prioritized expansion markets, and evaluated adult-vaccine and add-on acquisition opportunities.',
      outcome: '30%+ distributor-base reduction · expansion enabled across 200+ districts.'
    }
  ],
  experience: [
    { organization: 'eBay', role: 'Senior Manager, Strategy & Operations', location: 'San Jose, CA', period: 'July 2025–present', summary: 'Supporting strategy and operations in a global marketplace business.' },
    { organization: 'Bain & Company', role: 'Consultant', location: 'Chicago, IL', period: '2024–July 2025', summary: 'Led cross-functional strategy, transformation, and diligence work across multiple industries.' },
    { organization: 'Legacy Pursuit', role: 'Summer Intern', location: 'Chicago, IL', period: 'Summer 2024', summary: 'Developed an industrial-repair investment thesis and conducted anonymized expert and financial diligence.' },
    { organization: 'Bain & Company', role: 'Progressive consulting roles', location: 'Mumbai, India', period: '2019–2023', summary: 'Earned five promotions in under four years on a top-rated, accelerated trajectory—while delivering product strategy, commercial growth, operating transformation, and private-equity diligence.' }
  ],
  education: [
    { institution: 'Kellogg School of Management', credential: 'MBA', distinction: "Dean's List", year: '2024' },
    { institution: 'Hindu College, University of Delhi', credential: 'BSc Mathematics with Economics minor', distinction: 'First Class Honors', year: '2019' }
  ],
  personalProjects: [
    {
      slug: 'portfolio', title: 'This portfolio',
      description: 'An AI-assisted React/TypeScript build with an accessible case-study system, deterministic grounded assistant, privacy gates, and hosted verification.',
      capabilities: ['AI-assisted React/TypeScript build', 'Accessible case-study system', 'Deterministic grounded assistant', 'Privacy gates', 'Hosted verification']
    },
    {
      slug: 'trail-pulse', title: 'Trail Pulse',
      description: 'A hiking intelligence engine that helps users find the right trail, know what to expect, and leave with the route ready to go.',
      capabilities: ['Discovery and recommendations', 'Trail intelligence', 'Logistics', 'Exact route export only when geometry validates'],
      honestyNote: 'An early AI-assisted prototype built end-to-end to learn modern product development and demonstrate technical agency.',
      href: 'https://trail-pulse-alpha.vercel.app/'
    }
  ],
  writing: [
    { title: 'Financialisation of Housing: An Imbroglio Decoded', published: 'August 14, 2018', theme: 'Housing and political economy', href: 'https://www.linkedin.com/pulse/financialisation-housing-imbroglio-decoded-rohan-misra/' },
    { title: 'The Failed Promise of Pakistan', published: 'August 26, 2018', theme: 'History and political economy', href: 'https://www.linkedin.com/pulse/failed-promise-pakistan-rohan-misra/' },
    { title: 'The Austrian School of Economic Thought: An Exposition', published: 'January 17, 2019', theme: 'Economic thought', href: 'https://www.linkedin.com/pulse/austrian-school-economic-thought-exposition-rohan-misra/' }
  ],
  publicResearch: {
    title: 'A Fair Share for Children: Preventing the Loss of a Generation to COVID-19',
    role: "co-author alongside Nobel Peace Prize laureate Kailash Satyarthi and Bain India's Managing Director", industry: 'social impact and public policy',
    summary: 'A flagship report on protecting children from the generational impact of COVID-19.',
    href: 'https://www.laureatesandleaders.org/_files/ugd/811759_44700bb3bf134c7fa1e15adade4daa51.pdf'
  },
  about: {
    statement: 'I like problems with real operational texture: fragmented markets, imperfect information, and teams that need a practical path from analysis to action. My toolkit was built in consulting, sharpened through operating work, and keeps expanding through hands-on building.',
    achievements: [
      {
        metric: '5 promotions',
        detail: 'Five promotions in under four years at Bain on a top-rated, accelerated trajectory.'
      },
      {
        metric: '~$250M',
        detail: '~$250M in value across Bain engagements.'
      }
    ],
    interests: ['Hiking', 'History', 'Travel', 'Scuba diving', 'Horse riding']
  },
  contact: {
    linkedinHref: 'https://www.linkedin.com/in/rohan-misra-mba/',
    emailAddress: 'misrarohan619@gmail.com',
    mailtoHref: 'mailto:misrarohan619@gmail.com'
  }
}
