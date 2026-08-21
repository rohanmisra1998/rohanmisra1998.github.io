import type { PortfolioContent } from './portfolio-types'

export const portfolioContent: PortfolioContent = {
  hero: {
    eyebrow: 'Strategy & operations · Marketplaces · Applied AI',
    headline: 'Tech-first operator building at the intersection of marketplaces, product, and AI.',
    subhead: "I'm Rohan Misra, a high agency tech-first strategy and operations leader. I turn complex operating problems into practical pilots, product roadmaps, and systems that can scale—across marketplaces, transformation, and applied AI.",
    current: 'Senior Manager @ eBay · ex-Bain · 5 accelerated promotions · ~$250M in delivered value · Kellogg MBA',
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
      title: "Drove verticalization of eBay's parts buyer experience", industry: 'eBay · Global marketplace',
      scale: "Global marketplace · One of commerce's most technical buying journeys",
      impactType: 'In-flight impact',
      role: {
        position: 'Strategy & operations program lead',
        owned: 'Opportunity sizing, problem definition, solution scope, roadmap, resourcing, governance, and cross-functional delivery.',
        partneredWith: 'Product, engineering, search, design, analytics, marketing, and regional business teams.'
      },
      capabilities: ['Buyer-experience strategy', 'Growth experimentation', 'Cross-functional delivery', 'Product roadmapping'],
      thesis: 'Turn a fragmented, high-anxiety parts journey into a guided, confidence-building experience—from first search to a complete repair basket.',
      challenge: [
        'Translate repair intent into the right compatible parts across a highly technical catalog',
        'Close confidence gaps across discovery, item detail, and fitment in a horizontal marketplace journey'
      ],
      approach: [
        'Scoped the end-to-end buyer journey and quantified the GMV opportunity',
        'Secured capacity across product, engineering, search, design, analytics, marketing, and regional teams',
        'Drove delivery of guided search filters, richer technical item pages, stronger fitment confidence, and repair-job cross-sell'
      ],
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
      capabilities: ['Product roadmaps', 'Go-to-market design', 'Sales operating model', 'Partnership strategy'],
      thesis: 'Turn an offline point-of-sale acquisition into a scaled omnichannel payments growth engine.',
      challenge: [
        'Establish the economics for a new omnichannel proposition without a clear Indian-market precedent',
        'Define which merchant segments, products, channels, and partnerships could scale profitably'
      ],
      approach: [
        'Built bottom-up revenue, margin, and payback economics by merchant segment',
        'Triangulated market evidence with customer, product, sales, and partnership inputs',
        'Translated findings into a four-year product, GTM, sales, and partnership roadmap'
      ],
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
      capabilities: ['Market assessment', 'Competitive positioning', 'Right-to-win analysis', 'Risk synthesis'],
      thesis: 'Convert incomplete evidence into a decision-ready view of market quality, right to win, downside risk, and value creation.',
      challenge: [
        'Assess market quality and competitive position with incomplete evidence under compressed investment timelines',
        'Separate durable value-creation levers from optimistic management assumptions'
      ],
      approach: [
        'Triangulated expert interviews, market models, competitive evidence, and scenario analysis',
        'Pressure-tested growth, pricing, and operating assumptions against downside cases',
        'Synthesized market attractiveness, right to win, risks, and value creation into decision-ready investment views'
      ],
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
      capabilities: ['AI-tool integration', 'Process redesign', 'Operating model', 'Multiyear planning'],
      thesis: 'Redesign recruiting around AI so teams spend less time on manual work while candidates move through a faster, more consistent process.',
      challenge: [
        'Redesign a fragmented recruiting journey serving close to one million applicants annually',
        'Align recruiting, HR, and hiring managers around common outcomes and adoption'
      ],
      approach: [
        'Mapped applicant pain points, manual work, and handoff failure points end to end',
        'Integrated AI-enabled screening and scheduling while standardizing interview workflows',
        'Launched pilots with weekly metrics, adoption routines, and a multiyear scale roadmap'
      ],
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
      capabilities: ['Workforce operations', 'Pilot design', 'Process redesign', 'Stakeholder alignment'],
      thesis: 'Turn field-workforce planning into a repeatable operating system that improves productivity and lowers cost.',
      challenge: [
        'Redesign planning, scheduling, crew assignment, and workforce management across 10+ operating centers',
        'Overcome frontline resistance without disrupting field delivery'
      ],
      approach: [
        'Diagnosed sources of lost crew time through frontline observation and operating data',
        'Redesigned workflows, roles, and management routines around prioritized work',
        'Implemented pilots across 10+ centers with feedback loops and a KPI cadence to sustain adoption'
      ],
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
      capabilities: ['Supply chain', 'Value-lever identification', 'Executive workshops', 'Implementation roadmaps'],
      thesis: 'Convert a fragmented regional supply chain into a sequenced, executable performance agenda.',
      challenge: [
        'Unlock supply-chain performance across acquisition-built regional operations',
        'Balance enterprise scale benefits with local autonomy and shifting cross-border risk'
      ],
      approach: [
        'Sized 10+ levers across sourcing, footprint, inventory, transportation, and network design',
        'Defined the future-state operating model and sequenced the roadmap by value and feasibility',
        'Led C-suite workshops to resolve tradeoffs and align five regions on implementation priorities'
      ],
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
      capabilities: ['Distribution transformation', 'Market entry', 'Sector mapping', 'Acquisition-led value creation'],
      thesis: 'Focus commercial and investment resources on the channels, markets, and adjacencies with the strongest right to win.',
      challenge: [
        'Rationalize a fragmented pharmaceutical distribution network across 770+ districts',
        'Identify adjacent life-sciences growth and acquisition opportunities with the strongest right to win'
      ],
      approach: [
        'Benchmarked distributor performance and market opportunity district by district',
        'Rationalized channel coverage and prioritized expansion across 200+ districts',
        'Assessed adult-vaccine and add-on acquisition opportunities against sector attractiveness and strategic fit'
      ],
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
    interests: ['Hiking', 'History', 'Travel', 'Scuba diving', 'Horse riding']
  },
  contact: {
    linkedinHref: 'https://www.linkedin.com/in/rohan-misra-mba/',
    emailAddress: 'misrarohan619@gmail.com',
    mailtoHref: 'mailto:misrarohan619@gmail.com'
  }
}
