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
      slug: 'omnichannel-payments-strategy', category: 'product', group: 'tech-ai-growth',
      title: 'Omnichannel payments strategy', industry: "Fintech · India's largest payments platform",
      scale: "India's largest payments platform · Four-year roadmap",
      impactType: 'Modeled opportunity',
      role: {
        position: 'Core model owner & product/GTM workstream lead',
        owned: 'Bottom-up economics, scenario analysis, roadmap phasing, sales operating model, and partnership strategy.',
        partneredWith: 'Product, sales, partnerships, and executive leadership.'
      },
      keyDecision: 'Prioritized scalable platform capabilities over one-off merchant customization, using value, time-to-market, and scalability to phase investment.',
      artifact: {
        kind: 'merchant-economics',
        title: 'Merchant economics → rollout decision',
        nodes: [
          { label: 'Merchant segment', detail: 'Needs and economics' },
          { label: 'Activation & take rate', detail: 'Revenue engine' },
          { label: 'Margin & payback', detail: 'Unit economics' },
          { label: 'Rollout phase', detail: 'Investment sequence' }
        ],
        decision: 'Scale the platform core first; phase customization where the economics earn it.'
      },
      capabilities: ['Product roadmaps', 'Go-to-market design', 'Sales operating model', 'Partnership strategy'],
      thesis: 'Build an omnichannel payments offering that can launch, integrate, and scale.',
      challenge: 'Turn an acquired offline point-of-sale capability into a scalable omnichannel payments business with no clear market precedent.',
      approach: 'Built the merchant economics model, translated segment-level revenue, margin, and payback into a four-year product roadmap, and designed the sales and partnership model.',
      outcome: '$150M+ value-uplift path.'
    },
    {
      slug: 'buy-side-commercial-diligence', category: 'diligence', group: 'tech-ai-growth',
      title: 'B2B SaaS & logistics investment diligence', industry: 'Technology investing · B2B SaaS and logistics',
      scale: 'Multiple buy-side diligences · B2B SaaS and logistics',
      impactType: 'Decision impact',
      role: {
        position: 'Commercial-diligence workstream lead',
        owned: 'Market model, investment-thesis pressure test, value-creation prioritization, and risk synthesis.',
        partneredWith: 'Investment teams, diligence teams, and industry experts.'
      },
      keyDecision: 'Established directional market conviction before deepening value creation, because the market view determined the go/no-go call and where upside could credibly exist.',
      artifact: {
        kind: 'investment-filter',
        title: 'Investment thesis filter',
        nodes: [
          { label: 'Market attractiveness', detail: 'Growth and structure' },
          { label: 'Right to win', detail: 'Differentiation' },
          { label: 'Value creation', detail: 'Credible upside' },
          { label: 'Downside risk', detail: 'Failure modes' }
        ],
        decision: 'Build market conviction first, then spend the clock on the upside that can change the call.'
      },
      capabilities: ['Market assessment', 'Competitive positioning', 'Right-to-win analysis', 'Risk synthesis'],
      thesis: 'Pressure-test whether fast-moving technology businesses can support a credible investment thesis.',
      challenge: 'Assess prospective B2B SaaS and logistics assets under compressed timelines across market growth, right to win, competitive positioning, and downside risk.',
      approach: 'Triangulated primary research, market evidence, competitive dynamics, and scenario analysis into a decision-oriented investment thesis.',
      outcome: 'Informed X buy-side investment theses.'
    },
    {
      slug: 'talent-acquisition-operating-model', category: 'transformation', group: 'tech-ai-growth',
      title: 'AI-powered recruiting transformation', industry: 'Insurance · ~$50B P&C carrier',
      scale: 'Close to 1M applicants annually',
      impactType: 'Implementation target',
      role: {
        position: 'Cross-functional process-design lead',
        owned: 'End-to-end journey diagnostic, pilot design, AI workflow integration, success metrics, and multiyear roadmap.',
        partneredWith: 'Recruiting, HR, hiring managers, and executive leadership.'
      },
      keyDecision: 'Anchored tradeoffs on candidate experience, process consistency, and stakeholder time, then proved the model with early-adopter pilots before scaling.',
      artifact: {
        kind: 'candidate-journey',
        title: 'AI-enabled candidate journey',
        nodes: [
          { label: 'Apply', detail: 'Candidate entry' },
          { label: 'AI screening', detail: 'Consistent triage' },
          { label: 'Scheduling', detail: 'Automated coordination' },
          { label: 'Structured interview', detail: 'Comparable signal' },
          { label: 'Feedback loop', detail: 'Pilot metrics' }
        ],
        decision: 'Prove experience and capacity gains with early adopters before scaling the new workflow.'
      },
      capabilities: ['AI-tool integration', 'Process redesign', 'Operating model', 'Multiyear planning'],
      thesis: 'Use AI and workflow redesign to give recruiting teams back time for higher-value work.',
      challenge: 'Redesign a fragmented hiring journey supporting close to one million applicants annually.',
      approach: 'Simplified workflows, integrated AI-enabled screening and scheduling, standardized interviews, and used weekly pilot metrics to build adoption.',
      outcome: '~15,000 hours of annual recruiting and talent-team capacity.'
    },
    {
      slug: 'workforce-operations-transformation', category: 'transformation', group: 'operations-transformations',
      title: 'Utilities workforce transformation', industry: 'Utilities · ~$9B enterprise',
      scale: '~$9B enterprise · 10+ operating centers',
      impactType: 'Realized impact',
      role: {
        position: 'End-to-end transformation lead',
        owned: 'Diagnostic, workforce-model design, pilot implementation, adoption model, and scale-up path.',
        partneredWith: 'Site leaders, supervisors, planners, schedulers, and frontline crews.'
      },
      keyDecision: 'Reset the rollout from simultaneous multi-site deployment to a focused proof at one site, then used internal champions to scale adoption.',
      artifact: {
        kind: 'pilot-operating-model',
        title: 'Pilot-to-scale operating model',
        nodes: [
          { label: 'Work demand', detail: 'Priority and volume' },
          { label: 'Planning', detail: 'Ready work' },
          { label: 'Crew schedule', detail: 'Capacity match' },
          { label: 'Field execution', detail: 'Frontline delivery' },
          { label: 'KPI loop', detail: 'Learn and scale' }
        ],
        decision: 'Make one site work end-to-end, then scale through proof and internal champions.'
      },
      capabilities: ['Workforce operations', 'Pilot design', 'Process redesign', 'Stakeholder alignment'],
      thesis: 'Turn complex field operations into a more productive, lower-cost workforce system.',
      challenge: 'Redesign planning, scheduling, crew assignment, and workforce-management processes across electricity operating centers.',
      approach: 'Redesigned planning, scheduling, and crew assignment; ran pilots across 10+ operating centers; and built the frontline feedback and KPI cadence for scale.',
      outcome: '$20M+ delivered savings · 8%+ productivity improvement.'
    },
    {
      slug: 'performance-and-value-realization-program', category: 'transformation', group: 'operations-transformations',
      title: 'Automotive performance transformation', industry: 'Automotive services · ~$15B enterprise',
      scale: '~$15B enterprise · Five regions · 10+ levers',
      impactType: 'Validated opportunity',
      role: {
        position: 'Supply-chain value-creation workstream lead',
        owned: 'Regional fact base, lever sizing and prioritization, executive decision narrative, and sequenced roadmap.',
        partneredWith: 'Regional leaders and C-suite stakeholders.'
      },
      keyDecision: 'Moved away from cross-border supply-chain integration when external risk changed, then rebuilt the value agenda around sourcing, footprint, inventory, and logistics.',
      artifact: {
        kind: 'value-roadmap',
        title: 'Value-realization roadmap',
        nodes: [
          { label: 'Sourcing', detail: 'Near-term value' },
          { label: 'Footprint', detail: 'Structural move' },
          { label: 'Inventory', detail: 'Working capital' },
          { label: 'Logistics', detail: 'Service and cost' }
        ],
        decision: 'Rebuild the roadmap around resilient regional levers when cross-border integration stopped being the right bet.'
      },
      capabilities: ['Supply chain', 'Value-lever identification', 'Executive workshops', 'Implementation roadmaps'],
      thesis: 'Convert a broad performance agenda into region-specific levers, ownership, and a sequenced realization path.',
      challenge: 'Accelerate performance across supply-chain spend and operations in five key regions.',
      approach: 'Sized and prioritized 10+ levers across sourcing, warehousing, inventory, and transport, then built the multiyear roadmap through C-suite working sessions.',
      outcome: '$40M+ savings identified across five regions.'
    },
    {
      slug: 'pharma-life-sciences-growth-transformation', category: 'transformation', group: 'operations-transformations',
      title: 'Pharma & life-sciences growth transformation', industry: 'Pharmaceuticals and life sciences · India',
      scale: '~$4B enterprise · 700+ districts assessed',
      impactType: 'Execution result',
      role: {
        position: 'Commercial analytics & market-expansion workstream lead',
        owned: 'Distributor-performance diagnostic, network rationalization, district prioritization, and expansion logic.',
        partneredWith: 'Commercial and regional teams.'
      },
      keyDecision: 'Pruned low-performing distributors while concentrating expansion on the highest-potential markets instead of maximizing partner count or geographic breadth.',
      artifact: {
        kind: 'commercial-portfolio',
        title: 'Commercial portfolio matrix',
        nodes: [
          { label: 'Retain', detail: 'Strong partner · strong market' },
          { label: 'Improve', detail: 'Weak partner · strong market' },
          { label: 'Exit', detail: 'Weak partner · weak market' },
          { label: 'Expand', detail: 'Open high-potential market' }
        ],
        decision: 'Concentrate the network on strong partners and the markets with the clearest growth headroom.'
      },
      capabilities: ['Distribution transformation', 'Market entry', 'Sector mapping', 'Acquisition-led value creation'],
      thesis: 'Rewire commercial distribution while finding the next acquisition-led growth vectors.',
      challenge: 'Accelerate growth across a fragmented and uneven pharmaceutical distribution network.',
      approach: 'Assessed distributor and market performance across 700+ districts, rationalized the network, and prioritized ~200 high-potential markets for expansion.',
      outcome: '30%+ distributor rationalization · ~200 priority markets.'
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
