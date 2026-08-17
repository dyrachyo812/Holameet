import { privacySections } from './privacyUk'
import { uk } from '../i18n/uk'
import { cardClass } from '../ui/classes'

export function PrivacyPage() {
  return (
    <article className={`${cardClass} space-y-6`}>
      <h1 className="text-xl font-semibold tracking-tight">{uk.privacy}</h1>
      {privacySections.map((section) => (
        <section key={section.title} className="space-y-2">
          <h2 className="text-sm font-semibold text-zinc-900">{section.title}</h2>
          <p className="text-sm leading-6 text-zinc-600">{section.body}</p>
        </section>
      ))}
    </article>
  )
}
