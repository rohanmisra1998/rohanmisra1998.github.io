import { About } from './components/About'
import { Contact } from './components/Contact'
import { Experience } from './components/Experience'
import { Hero } from './components/Hero'
import { OperatingThesis } from './components/OperatingThesis'
import { SelectedWork } from './components/SelectedWork'
import { SiteHeader } from './components/SiteHeader'
import { Writing } from './components/Writing'
import { siteContent } from './content/site-content'

export default function App() {
  return (
    <>
      <SiteHeader resumeHref={siteContent.contact.resumeHref} />
      <main>
        <Hero content={siteContent.hero} />
        <SelectedWork projects={siteContent.work} />
        <OperatingThesis copy={siteContent.operatingThesis} />
        <Experience items={siteContent.experience} />
        <Writing items={siteContent.writing} />
        <About interests={siteContent.interests} />
        <Contact config={siteContent.contact} />
      </main>
      <footer>
        <p>Built with curiosity and a bias to ship.</p>
      </footer>
    </>
  )
}
