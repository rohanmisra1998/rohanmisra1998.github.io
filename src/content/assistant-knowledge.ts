import type { AssistantCitation, KnowledgeRecord, ReadonlyKnowledgeRecord } from '../assistant/types'
import { portfolioContent } from './portfolio-content'
import type { PortfolioContent } from './portfolio-types'

export interface KnowledgeAccess {
  readonly records: readonly ReadonlyKnowledgeRecord[]
  readonly initializationError?: Error
  getRecord(id: string): KnowledgeRecord | undefined
}

const section = (sectionId: string, label: string): AssistantCitation => ({ sectionId, label })

const freezeRecord = (record: KnowledgeRecord): ReadonlyKnowledgeRecord => Object.freeze({
  ...record,
  canonicalQuestions: Object.freeze([...record.canonicalQuestions]),
  entities: Object.freeze([...record.entities]),
  aliases: Object.freeze([...record.aliases]),
  keywords: Object.freeze([...record.keywords]),
  citations: Object.freeze(record.citations.map((citation) => Object.freeze({ ...citation }))),
  ...(record.guardedTerms ? { guardedTerms: Object.freeze([...record.guardedTerms]) } : {})
})

const copyRecord = (record: ReadonlyKnowledgeRecord): KnowledgeRecord => ({
  id: record.id,
  canonicalQuestions: [...record.canonicalQuestions],
  entities: [...record.entities],
  aliases: [...record.aliases],
  keywords: [...record.keywords],
  answer: record.answer,
  citations: record.citations.map((citation) => ({ ...citation })),
  ...(record.caseSlug ? { caseSlug: record.caseSlug } : {}),
  ...(record.guardedTerms ? { guardedTerms: [...record.guardedTerms] } : {})
})

const buildRecords = (content: PortfolioContent): KnowledgeRecord[] => {
  const byWorkSlug = (slug: string) => {
    const item = content.work.find((work) => work.slug === slug)
    if (!item) throw new Error(`Approved work record is missing: ${slug}`)
    return item
  }
  const trailPulse = content.personalProjects.find((item) => item.slug === 'trail-pulse')
  if (!trailPulse) throw new Error('Approved Personal projects Trail Pulse record is missing')

  const workforce = byWorkSlug('workforce-operations-transformation')
  const diligence = byWorkSlug('buy-side-commercial-diligence')
  const payments = byWorkSlug('omnichannel-payments-strategy')

  return [
    {
      id: 'operating-transformations',
      canonicalQuestions: ['What operating transformations has Rohan led?'],
      entities: ['operating transformations', 'workforce operations transformation'],
      aliases: ['utility workforce', 'workforce operations', 'operating transformation', 'strategy and operations'],
      keywords: ['utilities', 'workforce', 'pilots', 'implementation', 'process redesign', 'operations'],
      answer: `Rohan's ${workforce.title} work: ${workforce.approach} ${workforce.outcome}`,
      citations: [section('#work', 'Work')],
      caseSlug: workforce.slug
    },
    {
      id: 'private-equity-diligence',
      canonicalQuestions: ["What is Rohan's private-equity diligence experience?"],
      entities: ['private equity diligence', 'buy side commercial diligence'],
      aliases: ['commercial diligence', 'buy side diligence', 'private equity', 'due diligence'],
      keywords: ['commercial', 'diligence', 'market assessment', 'competitive positioning', 'investment'],
      answer: `Rohan's ${diligence.title} work: ${diligence.approach} ${diligence.outcome}`,
      citations: [section('#work', 'Work')],
      caseSlug: diligence.slug,
      guardedTerms: ['target names', 'investment recommendation', 'transaction details']
    },
    {
      id: 'product-and-gtm',
      canonicalQuestions: ['How has he worked across product strategy and GTM?'],
      entities: ['product strategy go to market', 'omnichannel payments strategy'],
      aliases: ['product gtm', 'go to market', 'product strategy', 'strategy and operations'],
      keywords: ['product', 'strategy', 'gtm', 'roadmap', 'partnerships', 'sales'],
      answer: `Rohan's ${payments.title} work for ${payments.industry.toLowerCase()}: ${payments.approach} ${payments.outcome}`,
      citations: [section('#work', 'Work')],
      caseSlug: payments.slug
    },
    {
      id: 'marketplaces',
      canonicalQuestions: ['What marketplace experience does Rohan have?'],
      entities: ['marketplace operator', 'marketplace strategy'],
      aliases: ['ebay marketplace', 'marketplace work'],
      keywords: ['marketplace', 'ebay', 'operator'],
      answer: `Rohan is a ${content.hero.chips[0].toLowerCase()} and is currently ${content.hero.current}.`,
      citations: [section('#experience', 'Experience'), section('#work', 'Work')]
    },
    {
      id: 'trail-pulse',
      canonicalQuestions: ['What is Trail Pulse, and how mature is it?'],
      entities: ['trail pulse', 'hiking intelligence engine'],
      aliases: ['trailpulse', 'hiking product', 'trail app'],
      keywords: ['hiking', 'trail', 'recommendations', 'route export', 'mature'],
      answer: `Trail Pulse is ${trailPulse.description} ${trailPulse.honestyNote}`,
      citations: [section('#personal-projects', 'Personal projects')]
    },
    {
      id: 'career-path',
      canonicalQuestions: ["What is Rohan's career path?"],
      entities: ['career path', 'professional experience'],
      aliases: ['career', 'work history', 'experience'],
      keywords: ['career', 'path', 'bain', 'ebay', 'consulting'],
      answer: `Rohan's career path: ${content.experience.map((item) => `${item.organization} — ${item.role} (${item.period})`).join('; ')}.`,
      citations: [section('#experience', 'Experience')]
    },
    {
      id: 'education',
      canonicalQuestions: ['Where did Rohan study?'],
      entities: ['education', 'academic background'],
      aliases: ['school', 'university', 'mba'],
      keywords: ['kellogg', 'hindu college', 'education', 'degree'],
      answer: `Rohan studied at ${content.education.map((item) => `${item.institution} — ${item.credential}, ${item.distinction} (${item.year})`).join('; ')}.`,
      citations: [section('#education', 'Education')]
    },
    {
      id: 'writing',
      canonicalQuestions: ['What does Rohan write about?'],
      entities: ['writing', 'published writing'],
      aliases: ['articles', 'publications', 'essays'],
      keywords: ['write', 'writing', 'housing', 'political economy', 'economic thought'],
      answer: `Rohan's writing covers ${content.writing.map((item) => item.theme.toLowerCase()).join('; ')}.`,
      citations: [section('#writing', 'Writing')]
    },
    {
      id: 'public-research',
      canonicalQuestions: ['What public research has Rohan contributed to?'],
      entities: ['public research', 'fair share for children'],
      aliases: ['research', 'covid research', 'public policy'],
      keywords: ['research', 'covid', 'children', 'social impact'],
      answer: `Rohan was ${content.publicResearch.role} on “${content.publicResearch.title},” ${content.publicResearch.summary}`,
      citations: [section('#writing', 'Writing')]
    },
    {
      id: 'interests',
      canonicalQuestions: ['What are Rohan’s interests?'],
      entities: ['interests', 'outside work'],
      aliases: ['hobbies', 'personal interests'],
      keywords: ['hiking', 'history', 'travel', 'scuba', 'horse riding'],
      answer: `Rohan's interests include ${content.about.interests.join(', ')}.`,
      citations: [section('#outside-work', 'Outside work')]
    },
    {
      id: 'contact',
      canonicalQuestions: ['How do I contact Rohan?', "What is Rohan's email address?"],
      entities: ['contact', 'email address', 'linkedin'],
      aliases: ['get in touch', 'reach rohan', 'email rohan'],
      keywords: ['contact', 'email', 'address', 'linkedin', 'reach'],
      answer: `Email Rohan directly at ${content.contact.emailAddress}, or connect with him on LinkedIn.`,
      citations: [section('#contact', 'Contact')]
    },
    {
      id: 'cv-status',
      canonicalQuestions: ['Is Rohan’s CV available?'],
      entities: ['cv status', 'resume status'],
      aliases: ['cv link', 'resume link', 'resume document', 'download cv', 'download resume'],
      keywords: ['cv', 'resume', 'status', 'available', 'download'],
      answer: `The CV is no longer linked on this site; email Rohan directly at ${content.contact.emailAddress}.`,
      citations: [section('#contact', 'Contact')]
    },
    {
      id: 'assistant-about',
      canonicalQuestions: ['Is this assistant an LLM?'],
      entities: ['assistant llm', 'deterministic retrieval guide'],
      aliases: ['language model', 'generative model', 'virtual twin'],
      keywords: ['assistant', 'llm', 'model', 'artificial intelligence'],
      answer: 'Ask Rohan AI is a deterministic retrieval guide. It selects from approved portfolio answers; it is not a generative model or a virtual twin. Questions are not sent over the network and are not saved in browser storage.',
      citations: [section('#about-assistant', 'About this assistant')]
    }
  ]
}

export const createKnowledgeAccess = (content: PortfolioContent): KnowledgeAccess => {
  try {
    const records = Object.freeze(buildRecords(content).map(freezeRecord))
    const byId = new Map(records.map((record) => [record.id, record]))
    return Object.freeze({
      records,
      getRecord: (id: string) => {
        const record = byId.get(id)
        return record ? copyRecord(record) : undefined
      }
    })
  } catch (cause) {
    const initializationError = cause instanceof Error ? cause : new Error('Approved assistant knowledge could not initialize')
    return Object.freeze({
      records: Object.freeze([]) as readonly ReadonlyKnowledgeRecord[],
      initializationError,
      getRecord: () => undefined
    })
  }
}

export const defaultKnowledgeAccess = createKnowledgeAccess(portfolioContent)
export const assistantKnowledge = defaultKnowledgeAccess.records
export const getAssistantKnowledgeRecord = (id: string): KnowledgeRecord | undefined => defaultKnowledgeAccess.getRecord(id)
