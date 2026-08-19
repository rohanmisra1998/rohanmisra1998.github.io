import type { SiteContent } from './types'

export const siteContent: SiteContent = {
  hero: {
    headline: 'I turn messy operations into scalable products and systems.',
    subhead: 'I’m Rohan Misra—a tech-first strategy and operations leader building across marketplaces and operational scale, with a growing focus on applied AI. I combine a consultant’s problem-solving toolkit with an operator’s bias to build.',
    location: 'San Jose, CA'
  },
  operatingThesis: 'The most durable products emerge when technology, systems, and execution meet the hard realities of operating work. I like turning that ambiguity into a direction teams can build and scale.',
  work: [
    {
      slug: 'transformation-at-scale',
      title: 'Transformation at scale',
      eyebrow: 'Operator proof',
      summary: 'Anonymized transformation work turning complex operating problems into practical pilots, roadmaps, and value-realization systems.',
      emphasis: 'primary',
      capabilities: [
        { title: '10+ pilots implemented', description: 'Moved more than ten pilots from opportunity identification into implementation.' },
        { title: '8%+ productivity improvement', description: 'Delivered productivity improvement through redesigned operating systems and execution.' },
        { title: '~15K hours saved annually', description: 'Helped create capacity at scale through sustained operational improvement.' },
        { title: 'Multi-year roadmaps', description: 'Built multi-year roadmaps and value-realization programs that carry implementation forward.' }
      ],
      image: { src: '/images/portrait-rohan-misra.webp', alt: 'Rohan Misra' },
      links: []
    },
    {
      slug: 'trail-pulse',
      title: 'Trail Pulse',
      eyebrow: 'Builder Lab · AI-assisted experiment',
      summary: 'Trail Pulse is a hiking intelligence engine that helps you find the right trail, know exactly what to expect, and leave with the route ready to go.',
      emphasis: 'secondary',
      honestyNote: 'An early vibe-coded product experiment, built with AI-assisted development to learn by shipping.',
      capabilities: [
        {
          title: 'Discovery + recommendations',
          description: 'A custom engine ranks trails around the user by distance, difficulty, elevation, scenery, route type, reviews, and personal preferences—then recommends the best route, not simply the nearest trail.'
        },
        {
          title: 'Trail intelligence',
          description: 'Ratings, reviews, and social signals are distilled into practical guidance about views, terrain, shade, crowds, exposure, highlights, drawbacks, when to go, and what to avoid.'
        },
        {
          title: 'Logistics',
          description: 'Verified start and parking context, expected hike time, route options, and practical gotchas help a user plan the full outing before leaving home.'
        },
        {
          title: 'Exact navigation',
          description: 'When actual trail geometry passes strict validation, Trail Pulse exports the complete route as GPX/KML so the trail a user discovers is the trail they can navigate. Routes without defensible geometry remain honestly trailhead-only.'
        }
      ],
      image: { src: '/images/trail-pulse-results.webp', alt: 'Trail Pulse hiking results interface' },
      links: [{ label: 'Try Trail Pulse', href: 'https://trail-pulse-alpha.vercel.app/' }]
    },
    {
      slug: 'a-fair-share-for-children',
      title: 'A Fair Share for Children',
      eyebrow: 'Social impact',
      summary: 'A concise social-impact proof point from a public child-rights white paper.',
      emphasis: 'secondary',
      capabilities: [
        { title: 'Public policy research', description: 'Contributed to a public report on preventing the loss of a generation to COVID-19.' }
      ],
      image: { src: '/images/a-fair-share-for-children.webp', alt: 'A Fair Share for Children report cover' },
      links: [{ label: 'Read the report', href: 'https://laureatesandleaders.org/a-fair-share-for-children-preventing-the-loss-of-a-generation-to-covid-19/' }]
    }
  ],
  experience: [
    {
      organization: 'eBay',
      role: 'Senior Manager, Strategy & Operations',
      location: 'San Jose, CA',
      period: 'July 2025–present',
      summary: 'Supporting strategy and operations in a global marketplace business.'
    },
    {
      organization: 'Bain & Company',
      role: 'Consultant',
      location: 'Chicago, IL',
      period: '2024–June 2025',
      summary: 'Helped organizations turn transformation agendas into implementable operating change.'
    },
    {
      organization: 'Bain & Company',
      role: 'Progressive consulting roles',
      location: 'Mumbai, India',
      period: '2019–2023',
      summary: 'Worked across strategy, operations, and transformation engagements.'
    }
  ],
  writing: [
    {
      title: 'Financialisation of Housing: An Imbroglio Decoded',
      published: 'August 14, 2018',
      theme: 'Housing and political economy',
      href: 'https://www.linkedin.com/pulse/financialisation-housing-imbroglio-decoded-rohan-misra/'
    },
    {
      title: 'The Failed Promise of Pakistan',
      published: 'August 26, 2018',
      theme: 'History and political economy',
      href: 'https://www.linkedin.com/pulse/failed-promise-pakistan-rohan-misra/'
    },
    {
      title: 'The Austrian School of Economic Thought: An Exposition',
      published: 'January 17, 2019',
      theme: 'Economic thought',
      href: 'https://www.linkedin.com/pulse/austrian-school-economic-thought-exposition-rohan-misra/'
    }
  ],
  interests: ['Advanced open-water scuba', 'Hiking', 'Travel', 'Cooking'],
  contact: {
    linkedinHref: 'https://www.linkedin.com/in/rohan-misra-mba/',
    emailHref: null,
    resumeHref: null
  }
}
