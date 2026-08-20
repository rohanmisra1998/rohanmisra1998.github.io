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
      slug: 'omnichannel-payments-strategy', category: 'product', group: 'tech-ai-growth',
      title: 'Omnichannel payments strategy', industry: "Fintech · India's largest payments platform",
      capabilities: ['Product roadmaps', 'Go-to-market design', 'Sales operating model', 'Partnership strategy'],
      thesis: 'Build an omnichannel payments offering that can launch, integrate, and scale.',
      challenge: 'Build an omnichannel payments offering by integrating an acquired offline point-of-sale player.',
      approach: 'Developed a four-year product roadmap and built the go-to-market model, including the sales operating model and partnership strategy.',
      outcome: 'Created a path to $150M+ in value uplift.'
    },
    {
      slug: 'buy-side-commercial-diligence', category: 'diligence', group: 'tech-ai-growth',
      title: 'B2B SaaS & logistics investment diligence', industry: 'Technology investing · B2B SaaS and logistics',
      capabilities: ['Market assessment', 'Competitive positioning', 'Right-to-win analysis', 'Risk synthesis'],
      thesis: 'Pressure-test whether fast-moving technology businesses can support a credible investment thesis.',
      challenge: 'Assess prospective B2B SaaS and logistics assets across market growth, right to win, competitive positioning, and risk.',
      approach: 'Led commercial diligence workstreams, triangulating primary research, market evidence, competitive dynamics, and downside risks.',
      outcome: 'Informed 3+ buy-side investment theses.'
    },
    {
      slug: 'talent-acquisition-operating-model', category: 'transformation', group: 'tech-ai-growth',
      title: 'AI-powered recruiting transformation', industry: 'Insurance · ~$50B P&C carrier',
      capabilities: ['AI-tool integration', 'Process redesign', 'Operating model', 'Multiyear planning'],
      thesis: 'Use AI and workflow redesign to give recruiting teams back time for higher-value work.',
      challenge: 'Revamp a large-scale interview process burdened by manual effort and fragmented candidate workflows.',
      approach: 'Led a cross-functional team to redesign the interview process, improve AI-tool integrations such as Paradox, and build a multiyear talent-acquisition roadmap.',
      outcome: 'Built the AI-enabled recruiting transformation to unlock ~15,000 hours of annual recruiter and talent-team capacity.'
    },
    {
      slug: 'workforce-operations-transformation', category: 'transformation', group: 'operations-transformations',
      title: 'Utilities workforce transformation', industry: 'Utilities · ~$9B enterprise',
      capabilities: ['Workforce operations', 'Pilot design', 'Process redesign', 'Stakeholder alignment'],
      thesis: 'Turn complex field operations into a more productive, lower-cost workforce system.',
      challenge: 'Redesign planning, scheduling, crew assignment, and workforce-management processes across electricity operating centers.',
      approach: 'Built board and frontline buy-in by designing and implementing 10+ pilots across electricity operating centers.',
      outcome: 'Delivered $20M+ in savings and increased workforce productivity by 8%+.'
    },
    {
      slug: 'performance-and-value-realization-program', category: 'transformation', group: 'operations-transformations',
      title: 'Automotive performance transformation', industry: 'Automotive services · ~$15B enterprise',
      capabilities: ['Supply chain', 'Value-lever identification', 'Executive workshops', 'Implementation roadmaps'],
      thesis: 'Convert a broad performance agenda into region-specific levers, ownership, and a sequenced realization path.',
      challenge: 'Accelerate performance across supply-chain spend and operations in five key regions.',
      approach: 'Identified 10+ levers to optimize supply-chain spend and built a multiyear value-realization plan through interactive C-suite workshops.',
      outcome: 'Created a path to $40M+ in savings across five regions.'
    },
    {
      slug: 'pharma-life-sciences-growth-transformation', category: 'transformation', group: 'operations-transformations',
      title: 'Pharma & life-sciences growth transformation', industry: 'Pharmaceuticals and life sciences · India',
      capabilities: ['Distribution transformation', 'Market entry', 'Sector mapping', 'Acquisition-led value creation'],
      thesis: 'Rewire commercial distribution while finding the next acquisition-led growth vectors.',
      challenge: 'Across separate engagements, improve distribution performance, accelerate geographic expansion, and assess acquisition-led growth in Indian pharma and life sciences.',
      approach: 'Rationalized low-performing channel partners, analyzed market entry across 770+ counties, and mapped the adult-vaccine market and add-on acquisition opportunities.',
      outcome: 'Reduced the partner base by 30%+ and enabled expansion into 200+ counties.'
    }
  ],
  experience: [
    { organization: 'eBay', role: 'Senior Manager, Strategy & Operations', location: 'San Jose, CA', period: 'July 2025–present', summary: 'Supporting strategy and operations in a global marketplace business.' },
    { organization: 'Bain & Company', role: 'Consultant', location: 'Chicago, IL', period: '2024–July 2025', summary: 'Led cross-functional strategy, transformation, and diligence work across multiple industries.' },
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
    interests: ['Hiking', 'History', 'Travel', 'Scuba diving', 'Horse riding']
  },
  contact: {
    linkedinHref: 'https://www.linkedin.com/in/rohan-misra-mba/',
    emailAddress: 'misrarohan619@gmail.com',
    mailtoHref: 'mailto:misrarohan619@gmail.com'
  }
}
