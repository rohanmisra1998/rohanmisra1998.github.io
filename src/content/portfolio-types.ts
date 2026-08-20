export type WorkCategory = 'transformation' | 'diligence' | 'product' | 'builder'

export interface WorkItem {
  slug: string
  homeVisible: boolean
  category: WorkCategory
  title: string
  industry: string
  role: string
  capabilities: string[]
  thesis: string
  challenge: string
  approach: string
  evidence: string
  maturityNote?: string
  externalAction?: { label: string; href: string }
}

export interface ExperienceItem {
  organization: string
  role: string
  location: string
  period: string
  summary: string
}

export interface EducationItem {
  institution: string
  credential: string
  distinction: string
  year: string
}

export interface ExpertiseGroup { title: string; items: string[] }

export interface BuilderItem {
  slug: 'portfolio' | 'trail-pulse'
  title: string
  description: string
  capabilities: string[]
  honestyNote?: string
  href?: string
}

export interface WritingItem {
  title: string
  published: string
  theme: string
  href: string
}

export interface PublicResearchItem {
  title: string
  role: string
  industry: string
  summary: string
  href: string
}

export interface ContactConfig {
  linkedinHref: string
  emailAddress: string
  mailtoHref: string
}

export interface PortfolioContent {
  hero: {
    eyebrow: string
    headline: string
    subhead: string
    current: string
    chips: string[]
  }
  work: WorkItem[]
  experience: ExperienceItem[]
  education: EducationItem[]
  expertise: ExpertiseGroup[]
  builderLab: BuilderItem[]
  writing: WritingItem[]
  publicResearch: PublicResearchItem
  about: { statement: string; interests: string[] }
  contact: ContactConfig
}
