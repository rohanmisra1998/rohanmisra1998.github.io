import type { ContactConfig } from '../content/portfolio-types'

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
          <a
            className="contact__action contact__action--email"
            href={config.mailtoHref}
            aria-label={`Email Rohan at ${config.emailAddress}`}
          >
            <span aria-hidden="true">✉</span> Email me
          </a>
          <a
            className="contact__action contact__action--linkedin"
            href={config.linkedinHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </section>
  )
}
