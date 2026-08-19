import type { ContactConfig } from '../content/types'

interface ContactProps {
  config: ContactConfig
}

export function Contact({ config }: ContactProps) {
  return (
    <section className="contact" id="contact" aria-labelledby="contact-heading">
      <div className="contact__heading">
        <p className="section-label">Start a conversation</p>
        <h2 id="contact-heading">Let’s talk.</h2>
      </div>
      <div className="contact__body">
        <p>
          I’m always interested in hard marketplace problems, applied AI, and the operating
          systems behind products that scale.
        </p>
        <div className="contact__actions">
          <a href={config.linkedinHref} target="_blank" rel="noopener noreferrer">
            LinkedIn <span aria-hidden="true">↗</span>
          </a>
          {config.emailHref && <a href={config.emailHref}>Email</a>}
          {config.resumeHref ? (
            <a href={config.resumeHref}>CV</a>
          ) : (
            <span className="contact__disabled" aria-disabled="true">
              CV · updating
            </span>
          )}
        </div>
      </div>
    </section>
  )
}
