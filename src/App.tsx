import { lazy, Suspense } from 'react'
import { About } from './components/About'
import { BuilderLab } from './components/BuilderLab'
import { CaseStudyDialog } from './components/CaseStudyDialog'
import { Contact } from './components/Contact'
import { Expertise } from './components/Expertise'
import { Experience } from './components/Experience'
import { Hero } from './components/Hero'
import { SelectedWork } from './components/SelectedWork'
import { SiteHeader } from './components/SiteHeader'
import { Writing } from './components/Writing'
import { assistantTopicForCase } from './content/assistant-topics'
import { portfolioContent } from './content/portfolio-content'
import { usePortfolioLayers } from './hooks/usePortfolioLayers'

const AssistantFeature = lazy(() => import('./components/assistant/AssistantFeature'))

export default function App() {
  const layers = usePortfolioLayers(portfolioContent.work)
  const activeCaseTopic = layers.activeCase
    ? assistantTopicForCase(layers.activeCase.slug)
    : undefined

  return (
    <>
      <div id="page-shell">
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <SiteHeader linkedinHref={portfolioContent.contact.linkedinHref} />
        <main id="main-content" tabIndex={-1}>
          <Hero
            content={portfolioContent.hero}
            onOpenAssistant={layers.openAssistant}
          />
          <SelectedWork items={portfolioContent.work} onOpenCase={layers.openCase} />
          <Experience
            items={portfolioContent.experience}
            education={portfolioContent.education}
          />
          <Expertise groups={portfolioContent.expertise} />
          <BuilderLab items={portfolioContent.builderLab} />
          <Writing
            items={portfolioContent.writing}
            publicResearch={portfolioContent.publicResearch}
          />
          <About content={portfolioContent.about} />
          <Contact config={portfolioContent.contact} />
        </main>
        <footer>
          <p>Built with curiosity and a bias to ship.</p>
        </footer>
      </div>
      {layers.activeCase && (
        <CaseStudyDialog
          item={layers.activeCase}
          onClose={layers.closeCase}
          onOpenAssistant={activeCaseTopic
            ? (trigger) => layers.openAssistant(
                trigger,
                { mode: 'compact', topicId: activeCaseTopic }
              )
            : undefined}
        />
      )}
      <Suspense
        fallback={<div className="assistant-launcher-placeholder" aria-hidden="true" />}
      >
        <AssistantFeature controller={layers.assistantController} />
      </Suspense>
    </>
  )
}
