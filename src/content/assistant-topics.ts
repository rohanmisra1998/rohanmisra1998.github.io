export type ApprovedAssistantCaseSlug =
  | 'workforce-operations-transformation'
  | 'buy-side-commercial-diligence'
  | 'omnichannel-payments-strategy'

export type ApprovedAssistantTopicId =
  | 'operating-transformations'
  | 'private-equity-diligence'
  | 'product-and-gtm'

export const assistantTopicByCaseSlug = {
  'workforce-operations-transformation': 'operating-transformations',
  'buy-side-commercial-diligence': 'private-equity-diligence',
  'omnichannel-payments-strategy': 'product-and-gtm'
} as const satisfies Record<ApprovedAssistantCaseSlug, ApprovedAssistantTopicId>

export function assistantTopicForCase(slug: string): ApprovedAssistantTopicId | undefined {
  return Object.hasOwn(assistantTopicByCaseSlug, slug)
    ? assistantTopicByCaseSlug[slug as ApprovedAssistantCaseSlug]
    : undefined
}
