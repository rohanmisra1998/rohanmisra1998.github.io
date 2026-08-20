export type WorkCategory = 'transformation' | 'diligence' | 'product'
export type WorkGroup = 'tech-ai-growth' | 'operations-transformations'

export interface WorkItem {
  slug: string
  category: WorkCategory
  group: WorkGroup
  title: string
  industry: string
  capabilities: string[]
  thesis: string
  challenge: string
  approach: string
  outcome: string
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

export interface PersonalProjectItem {
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
  personalProjects: PersonalProjectItem[]
  writing: WritingItem[]
  publicResearch: PublicResearchItem
  about: {
    statement: string
    achievements: Array<{ metric: string; detail: string }>
    interests: string[]
  }
  contact: ContactConfig
}
