import { HOME_PAGE, TOOL_PAGES, pageForId, type SearchPage } from "./pages";
export default function SearchContent({
  page = HOME_PAGE,
  primary = false,
}: {
  page?: SearchPage;
  primary?: boolean;
}) {
  const Heading = primary ? "h1" : "h2";
  return (
    <section
      className="search-content"
      id="how-to-use"
      aria-label={`${page.name} guide`}
    >
      {primary && (
        <nav className="search-brand">
          <a href="/" aria-label="PSDevTool home">
            <img src="/brand/logo.svg" width="42" height="42" alt="" />
            <strong>PSDevTool.</strong>
          </a>
          <a href="/">All tools</a>
        </nav>
      )}
      {primary && (
        <noscript>
          <p>
            JavaScript is required for the interactive workspace. The guides and
            tool links below remain available.
          </p>
        </noscript>
      )}
      <header>
        <span className="search-eyebrow">
          {page.id === "home"
            ? "BROWSER TOOLS FOR EVERYDAY WORK"
            : page.id === "portfolio"
              ? "ABOUT THE BUILDER"
              : "TOOL GUIDE"}
        </span>
        <Heading>
          {page.id === "home"
            ? "Free browser tools for developers"
            : page.id === "portfolio"
              ? page.name
              : page.title.split(" | ")[0]}
        </Heading>
        <p>{page.intro}</p>
      </header>
      {page.id === "notfound" ? (
        <a className="search-return" href="/">
          Browse all 19 tools →
        </a>
      ) : (
        <>
          {!!page.features.length && (
            <div className="search-guide-grid">
              <div>
                <h3>What you can do</h3>
                <ul>
                  {page.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
              {!!page.steps.length && (
                <div>
                  <h3>How to use {page.name}</h3>
                  <ol>
                    {page.steps.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
          {!!page.faq.length && (
            <div className="search-faq">
              <h3>Common questions</h3>
              {page.faq.map((item) => (
                <details key={item.question}>
                  <summary>{item.question}</summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          )}
          <nav
            className="search-tool-links"
            aria-label={
              page.id === "home" ? "All developer tools" : "Related tools"
            }
          >
            <h3>
              {page.id === "home" ? "Explore all 19 tools" : "Related tools"}
            </h3>
            {(page.id === "home"
              ? TOOL_PAGES
              : page.related.map((id) => pageForId(id as SearchPage["id"]))
            ).map((p) => (
              <a key={p.id} href={p.path}>
                {p.name}
                <span> ↗</span>
              </a>
            ))}
          </nav>
          {page.id !== "home" && (
            <p className="search-return">
              <a href="/">← All developer tools</a>
            </p>
          )}
        </>
      )}
      <footer>
        Built by <a href="/portfolio/">Prakash Choudhary</a> ·{" "}
        <a
          href="https://github.com/pspcps/diffwise"
          target="_blank"
          rel="noopener noreferrer"
        >
          Source and documentation
        </a>
      </footer>
    </section>
  );
}
