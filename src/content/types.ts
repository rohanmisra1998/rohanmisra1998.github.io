export interface Capability {
  title: string
  description: string
}

export interface WorkItem {
  slug: string
  title: string
  eyebrow: string
  summary: string
  emphasis: 'primary' | 'secondary'
  honestyNote?: string
  capabilities: Capability[]
  image: { src: string; alt: string }
  links: { label: string; href: string }[]
}

export interface ExperienceItem {
  organization: string
  role: string
  location: string
  period: string
  summary: string
}

export interface WritingItem {
  title: string
  published: string
  theme: string
  href: string
}

export interface ContactConfig {
  linkedinHref: string
  emailHref: string | null
  resumeHref: string | null
}

export interface SiteContent {
  hero: { headline: string; subhead: string; location: string }
  operatingThesis: string
  work: WorkItem[]
  experience: ExperienceItem[]
  writing: WritingItem[]
  interests: string[]
  contact: ContactConfig
}
