import { SITE_INFORMATION, type InformationId } from "./siteInformation";
import SiteFooter from "./SiteFooter";
export default function InformationPage({ id }: { id: InformationId }) {
  const page = SITE_INFORMATION.find((p) => p.id === id)!;
  return (
    <div className="information-document">
      <main className="information-page">
        <nav className="information-top" aria-label="Main navigation">
          <a href="/">PSDevTool.</a>
          <a href="/">All tools</a>
        </nav>
        <header>
          <p className="search-eyebrow">PSDEVTOOL / SITE INFORMATION</p>
          <h1>{page.name}</h1>
          <p>{page.description}</p>
        </header>
        {page.sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            {section.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
            {section.links && (
              <ul>
                {section.links.map((link) => (
                  <li key={link.href}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
        <SiteFooter />
      </main>
    </div>
  );
}
