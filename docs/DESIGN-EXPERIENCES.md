# Landing designs and portfolio versions

The homepage defaults to **Classic** and `/portfolio/` defaults to **V3 Studio**. These defaults are deterministic. Refreshing does not shuffle either experience.

Every homepage and portfolio design has one fixed **shuffle icon** at the top-right. Clicking it chooses a different available design and remembers the result in local storage, independently for the homepage and portfolio. The current design is named in the tooltip and accessibility label. There are no visible design dropdowns or Surprise me text labels. Ordinary renders and refreshes never invoke random selection.

The portfolio renders the selected version directly at `/portfolio/`, without redirecting to a versioned URL. Existing `/portfolio/v1/`, `/portfolio/v2/` and `/portfolio/v3/` links remain supported. Using the shuffle icon from one of those direct links returns to `/portfolio/` with that preference applied. The original portfolio is V1.

`/?design=classic` and `/?design=studio` remain explicit preview/selection links. Using the shuffle icon removes that query parameter while preserving other URL parameters. When storage is blocked or contains invalid data, stable defaults still work and manual choices remain active for the currently mounted page. No cookies or tracking identifiers are added. The previous automatically assigned session-storage choices are ignored; only the new preference keys are used.

## Studio homepage

The additional homepage uses light surfaces, typography and the original procedural 3D desk. Scene shortcuts open the catalog, JSON tool and builder portfolio. All twenty tools come from the shared catalog. Search, categories, the shared favorites list, recent tools, theme/motion controls, quick search, information links and the dedicated ad placement remain available. Tool workspace routes and processing logic are unchanged.

The homepage and scene are lazy-loaded. The scene retains its WebGL fallback, touch scrolling, frame/DPR caps and cleanup. Studio tool-link chips have explicit light backgrounds and dark text, including readable hover/focus states.

The root document retains its canonical URL and deterministic prerendered content. Direct portfolio URLs retain their own metadata and sitemap entries. Text and source links remain available without waiting for 3D rendering.

## Verification

`npm run test:designs` covers defaults, persistence, explicit overrides, independent preference keys, invalid/blocked storage, Surprise me alternatives, direct portfolio routes and all twenty Studio tool links. Portfolio, SEO, content/catalog and production build checks cover the integrated routes. Browser controls are unavailable in this session; actual desktop/mobile appearance and WebGL interactions still need deployment-preview review.
