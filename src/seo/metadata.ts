import { HOME_PAGE, TOOL_PAGES, type SearchPage } from "./pages";
export const SITE_ORIGIN = "https://psdevtool.online";
export function structuredData(page: SearchPage) {
  const publisher = {
    "@type": "Organization",
    "@id": `${SITE_ORIGIN}/#publisher`,
    name: "PSDevTool",
    url: SITE_ORIGIN + "/",
    logo: {
      "@type": "ImageObject",
      url: SITE_ORIGIN + "/brand/icon-512.png",
      width: 512,
      height: 512,
    },
  };
  const graph: Record<string, unknown>[] = [
    publisher,
    {
      "@type": "WebSite",
      "@id": SITE_ORIGIN + "/#website",
      name: "PSDevTool",
      alternateName: "PS Dev Tool",
      url: SITE_ORIGIN + "/",
      publisher: { "@id": SITE_ORIGIN + "/#publisher" },
    },
  ];
  if (page.id === "home")
    graph.push({
      "@type": "ItemList",
      name: "Developer tools",
      itemListElement: TOOL_PAGES.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: p.name,
        url: SITE_ORIGIN + p.path,
      })),
    });
  else if (page.id === "portfolio")
    graph.push({
      "@type": "ProfilePage",
      "@id": SITE_ORIGIN + page.path,
      url: SITE_ORIGIN + page.path,
      mainEntity: {
        "@type": "Person",
        name: "Prakash Choudhary",
        jobTitle: "Senior Software Engineer",
        url: SITE_ORIGIN + page.path,
      },
    });
  else if (page.id !== "notfound")
    graph.push({
      "@type": "WebApplication",
      "@id": SITE_ORIGIN + page.path + "#app",
      name: page.name,
      url: SITE_ORIGIN + page.path,
      description: page.description,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web browser",
      browserRequirements: "JavaScript required for interactive tools.",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      publisher: { "@id": SITE_ORIGIN + "/#publisher" },
      featureList: page.features,
    });
  if (page.id !== "home" && page.id !== "notfound")
    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "PSDevTool",
          item: SITE_ORIGIN + "/",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: page.name,
          item: SITE_ORIGIN + page.path,
        },
      ],
    });
  return { "@context": "https://schema.org", "@graph": graph };
}
export function applyPageMetadata(page: SearchPage) {
  document.title = page.title;
  const set = (selector: string, content: string) => {
    const node = document.querySelector<HTMLMetaElement>(selector);
    if (node) node.content = content;
  };
  set('meta[name="title"]', page.title);
  set('meta[name="description"]', page.description);
  for (const prefix of ["og", "twitter"]) {
    const attr = prefix === "og" ? "property" : "name";
    set(`meta[${attr}="${prefix}:title"]`, page.title);
    set(`meta[${attr}="${prefix}:description"]`, page.description);
    set(`meta[${attr}="${prefix}:url"]`, SITE_ORIGIN + page.path);
  }
  const canonical = document.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  );
  if (canonical) canonical.href = SITE_ORIGIN + page.path;
  const schema = document.getElementById("page-structured-data");
  if (schema) schema.textContent = JSON.stringify(structuredData(page));
  set(
    'meta[name="robots"]',
    page.id === "notfound" ||
      document.documentElement.dataset.indexable === "false"
      ? "noindex, follow"
      : "index, follow, max-image-preview:large",
  );
}
export const DEFAULT_PAGE = HOME_PAGE;
