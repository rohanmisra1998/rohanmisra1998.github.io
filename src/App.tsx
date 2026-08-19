import { Hero } from './components/Hero'
import { OperatingThesis } from './components/OperatingThesis'
import { SelectedWork } from './components/SelectedWork'
import { SiteHeader } from './components/SiteHeader'
import { siteContent } from './content/site-content'

export default function App() {
  return (
    <>
      <SiteHeader resumeHref={siteContent.contact.resumeHref} />
      <main>
        <Hero content={siteContent.hero} />
        <SelectedWork projects={siteContent.work} />
        <OperatingThesis copy={siteContent.operatingThesis} />
        <div id="experience" aria-label="Experience" />
        <div id="writing" aria-label="Writing" />
        <div id="about" aria-label="About" />
        <div id="contact" aria-label="Contact" />
      </main>
      <footer>
        <p>Built with curiosity and a bias to ship.</p>
      </footer>
    </>
  )
}
