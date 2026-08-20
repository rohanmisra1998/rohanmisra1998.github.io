import type { PortfolioContent } from './portfolio-types'

export const portfolioContent: PortfolioContent = {
  hero: {
    eyebrow: 'Strategy & operations · Marketplaces · Applied AI',
    headline: 'I turn messy operations into scalable products and systems.',
    subhead: "I'm Rohan Misra, a tech-first strategy and operations leader. I turn complex operating problems into practical pilots, product roadmaps, and systems that can scale—across marketplaces, transformation, and applied AI.",
    current: 'Senior Manager, Strategy & Operations at eBay · San Jose, CA',
    chips: [
      'Marketplace operator',
      'Strategy & operations',
      'Operating transformation',
      'Product & GTM strategy',
      'Private-equity diligence',
      'Applied-AI builder'
    ]
  },
  work: [
    {
      slug: 'workforce-operations-transformation', homeVisible: true, category: 'transformation',
      title: 'Workforce operations transformation', industry: 'Utilities', role: 'Transformation lead',
      capabilities: ['Workforce operations', 'Pilot design', 'Process redesign', 'Stakeholder alignment'],
      thesis: 'Turn complex workforce operations into practical, measurable improvements.',
      challenge: 'Improve planning, scheduling, and crew management across a complex operating network.',
      approach: 'Redesign core workflows, build leadership alignment, and move more than ten pilots into implementation.',
      evidence: '10+ pilots implemented · 8%+ workforce-productivity improvement'
    },
    {
      slug: 'buy-side-commercial-diligence', homeVisible: true, category: 'diligence',
      title: 'Buy-side commercial diligence', industry: 'B2B SaaS and logistics', role: 'Private-equity diligence lead',
      capabilities: ['Market assessment', 'Competitive positioning', 'Right-to-win analysis', 'Risk synthesis'],
      thesis: 'Assess whether prospective assets support credible investment theses.',
      challenge: 'Determine whether prospective assets supported credible investment theses.',
      approach: 'Lead 3+ commercial diligences, triangulating growth, competition, positioning, and risk.',
      evidence: '3+ buy-side diligences informing investor decisions'
    },
    {
      slug: 'omnichannel-payments-strategy', homeVisible: true, category: 'product',
      title: 'Omnichannel payments strategy', industry: 'Fintech and payments', role: 'Product and GTM strategist',
      capabilities: ['Product roadmaps', 'Go-to-market design', 'Partnerships', 'Sales operating model'],
      thesis: 'Define an offline point-of-sale expansion that can launch and scale.',
      challenge: 'Define expansion of an offline point-of-sale offering.',
      approach: 'Design a four-year product roadmap and a GTM model spanning sales, partnerships, and operating requirements.',
      evidence: 'Four-year roadmap and launch operating model'
    },
    {
      slug: 'talent-acquisition-operating-model', homeVisible: true, category: 'transformation',
      title: 'Talent-acquisition operating model', industry: 'Property and casualty insurance', role: 'Cross-functional strategy lead',
      capabilities: ['Process redesign', 'AI-tool integration', 'Operating model', 'Multiyear planning'],
      thesis: 'Reduce interview-process friction and manual effort through a scalable operating model.',
      challenge: 'Reduce friction and manual effort in a large-scale interview process.',
      approach: 'Redesign workflows, improve AI-tool integrations, and build a multiyear roadmap.',
      evidence: 'Initiatives supporting ~15,000 hours of annual capacity'
    },
    {
      slug: 'life-sciences-sector-and-value-creation-scan', homeVisible: true, category: 'diligence',
      title: 'Life-sciences sector and value-creation scan', industry: 'Life sciences', role: 'Private-equity sector-scan lead',
      capabilities: ['Sector mapping', 'Acquisition screening', 'Adjacency analysis', 'Portfolio value creation'],
      thesis: 'Assess the Indian adult-vaccine market and acquisition-led value-creation pathways.',
      challenge: 'Understand the Indian adult-vaccine market and potential add-on pathways.',
      approach: 'Map the market and assess acquisition-led value-creation opportunities.',
      evidence: 'Investor view on sector attractiveness and portfolio-growth pathways'
    },
    {
      slug: 'trail-pulse', homeVisible: true, category: 'builder', title: 'Trail Pulse', industry: 'Consumer outdoors', role: 'Builder',
      capabilities: ['AI-assisted prototyping', 'Recommendations', 'Trail intelligence', 'Logistics', 'Validated route export'],
      thesis: 'Help hikers choose a suitable trail with reliable planning and navigation context.',
      challenge: 'Help hikers choose a suitable trail and leave with reliable planning and navigation context.',
      approach: 'Build recommendation, practical trail-signal synthesis, logistics guidance, and GPX/KML export gated by geometry validation.',
      evidence: 'Working public experiment · shipped to learn',
      maturityNote: 'Builder Lab · early AI-assisted, vibe-coded experiment',
      externalAction: { label: 'Try Trail Pulse', href: 'https://trail-pulse-alpha.vercel.app/' }
    },
    {
      slug: 'performance-and-value-realization-program', homeVisible: false, category: 'transformation',
      title: 'Performance and value-realization program', industry: 'Automotive services', role: 'Performance-transformation strategist',
      capabilities: ['Supply chain', 'Value-lever identification', 'Executive workshops', 'Implementation roadmaps'],
      thesis: 'Convert a broad performance agenda into region-specific levers, ownership, and a sequenced realization path.',
      challenge: 'Identify and operationalize performance opportunities across five regions.',
      approach: 'Identify more than ten supply-chain and operating levers, facilitate executive workshops, and translate priorities into an implementation roadmap.',
      evidence: '10+ improvement levers across five regions · multiyear realization roadmap'
    },
    {
      slug: 'distribution-transformation-and-growth', homeVisible: false, category: 'transformation',
      title: 'Distribution transformation and growth', industry: 'Pharmaceuticals', role: 'Commercial-transformation strategist',
      capabilities: ['Distribution', 'Partner performance', 'Market entry', 'Sales acceleration'],
      thesis: 'Make a fragmented distribution footprint more productive while creating a practical route into new markets.',
      challenge: 'Improve partner performance and define a scalable expansion path across a broad geographic network.',
      approach: 'Rationalize the partner base, redesign performance management, and sequence market-entry and sales-acceleration actions.',
      evidence: '30%+ partner-base rationalization · expansion plan across 200+ counties'
    }
  ],
  experience: [
    { organization: 'eBay', role: 'Senior Manager, Strategy & Operations', location: 'San Jose, CA', period: 'July 2025–present', summary: 'Supporting strategy and operations in a global marketplace business.' },
    { organization: 'Bain & Company', role: 'Consultant', location: 'Chicago, IL', period: '2024–June 2025', summary: 'Led cross-functional strategy, transformation, and diligence work across multiple industries.' },
    { organization: 'Legacy Pursuit', role: 'Summer Intern', location: 'Chicago, IL', period: 'Summer 2024', summary: 'Developed an industrial-repair investment thesis and conducted anonymized expert and financial diligence.' },
    { organization: 'Bain & Company', role: 'Progressive consulting roles', location: 'Mumbai, India', period: '2019–2023', summary: 'Worked across product strategy, commercial growth, operating transformation, and private-equity diligence.' }
  ],
  education: [
    { institution: 'Kellogg School of Management', credential: 'MBA', distinction: "Dean's List", year: '2024' },
    { institution: 'Hindu College, University of Delhi', credential: 'BSc Mathematics with Economics minor', distinction: 'First Class Honors', year: '2019' }
  ],
  expertise: [
    { title: 'Marketplace and product strategy', items: ['marketplace dynamics', 'product roadmaps', 'GTM models', 'partner strategy', 'applied-AI experiments'] },
    { title: 'Operating transformation', items: ['workflow redesign', 'operating models', 'workforce operations', 'pilots', 'implementation systems'] },
    { title: 'Growth and commercial strategy', items: ['market entry', 'sales acceleration', 'distribution', 'omnichannel payments', 'prioritization'] },
    { title: 'Investment diligence', items: ['commercial diligence', 'sector scans', 'market growth', 'competitive positioning', 'right to win', 'value creation'] },
    { title: 'Executive problem solving', items: ['cross-functional leadership', 'executive workshops', 'evidence synthesis', 'multiyear roadmaps'] },
    { title: 'Building with', items: ['React', 'TypeScript', 'Node.js', 'Playwright', 'public data integrations', 'AI-assisted development'] }
  ],
  builderLab: [
    {
      slug: 'portfolio', title: 'This portfolio',
      description: 'An AI-assisted React/TypeScript build with an accessible case-study system, deterministic grounded assistant, privacy gates, and hosted verification.',
      capabilities: ['AI-assisted React/TypeScript build', 'Accessible case-study system', 'Deterministic grounded assistant', 'Privacy gates', 'Hosted verification']
    },
    {
      slug: 'trail-pulse', title: 'Trail Pulse',
      description: 'A hiking intelligence engine that helps users find the right trail, know what to expect, and leave with the route ready to go.',
      capabilities: ['Discovery and recommendations', 'Trail intelligence', 'Logistics', 'Exact route export only when geometry validates'],
      honestyNote: 'An early AI-assisted, vibe-coded experiment built to learn and signal technical curiosity—not a flagship product.',
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
    role: 'co-author and researcher', industry: 'social impact and public policy',
    summary: 'Public research on preventing the loss of a generation to COVID-19.',
    href: 'https://www.laureatesandleaders.org/_files/ugd/811759_44700bb3bf134c7fa1e15adade4daa51.pdf'
  },
  about: {
    statement: 'I like problems with real operational texture: fragmented markets, imperfect information, and teams that need a practical path from analysis to action. My toolkit was built in consulting, sharpened through operating work, and keeps expanding through hands-on building.',
    interests: ['Advanced open-water scuba', 'Hiking', 'Travel', 'Cooking']
  },
  contact: {
    linkedinHref: 'https://www.linkedin.com/in/rohan-misra-mba/',
    emailAddress: 'misrarohan619@gmail.com',
    mailtoHref: 'mailto:misrarohan619@gmail.com'
  }
}
