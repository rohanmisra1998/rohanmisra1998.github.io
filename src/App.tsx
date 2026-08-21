import { lazy, Suspense } from 'react'
import { CaseStudyDialog } from './components/CaseStudyDialog'
import { Contact } from './components/Contact'
import { Education } from './components/Education'
import { Experience } from './components/Experience'
import { Hero } from './components/Hero'
import { OutsideWork } from './components/OutsideWork'
import { Profile } from './components/Profile'
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
        <SiteHeader />
        <main id="main-content" tabIndex={-1}>
          <Hero
            content={portfolioContent.hero}
            onOpenAssistant={layers.openAssistant}
          />
          <Profile content={portfolioContent.about} />
          <SelectedWork
            items={portfolioContent.work}
            projects={portfolioContent.personalProjects}
            onOpenCase={layers.openCase}
          />
          <Experience items={portfolioContent.experience} />
          <Education items={portfolioContent.education} />
          <Writing
            items={portfolioContent.writing}
            publicResearch={portfolioContent.publicResearch}
          />
          <OutsideWork interests={portfolioContent.about.interests} />
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
