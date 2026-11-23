# Random landing designs

The public entry points select a presentation in the browser. There is no permanent redirect or server-side user segmentation.

- `/portfolio/`: selects `v1`, `v2` or `v3` with equal probability on first entry in a browsing tab, then replaces the entry URL with the chosen direct route. `/portfolio/v1/` is the stable original portfolio; v2 and v3 keep their direct routes. Explicitly visiting a version remembers that choice for subsequent entry visits in the same tab.
- `/`: selects the Classic or 3D Studio homepage with equal probability. The root URL remains unchanged. `/?design=classic` and `/?design=studio` explicitly select a design. Both homepage headers include a design selector.

`sessionStorage` remembers these two choices independently. Reloading or returning from a tool does not change the design. A fresh browsing session can receive a different selection; copied/duplicated tabs may inherit browser session storage. When storage is blocked, the currently mounted experience still works, but choices may not persist after navigation. No tracking IDs or cookies are added.

The root document retains the existing deterministic prerendered content and canonical URL for both query variants. Each direct portfolio version has its own generated page, canonical URL, ProfilePage schema and sitemap entry. The legacy `#/portfolio` entry canonicalizes before selecting a version, preventing competing redirects. Direct version links bypass random selection.

## Studio homepage

The additional homepage uses the 3D studio’s light surfaces, typography and original procedural desk. Its scene shortcuts open the catalog, JSON tool and builder portfolio. All twenty tools come from the shared catalog. Search, categories, the existing `psdev-favorites` local-storage list, recent tools, theme/motion controls, quick search, information links and the dedicated ad placement remain available. Tool workspace routes and processing logic are unchanged.

The homepage and scene are lazy-loaded. The shared scene keeps its WebGL fallback, touch-scroll behavior, frame/DPR caps and resource cleanup. The design selector can always return to Classic.

Validation: `npm run test:designs` covers random buckets, remembered choices, explicit override, independent selection keys, blocked storage, direct portfolio routes and all twenty Studio tool links. Portfolio, SEO, content/catalog and production build checks cover the integrated routes. Browser controls are unavailable in this environment; visual desktop/mobile and WebGL review remains necessary in the deployment preview.

This change also integrates portfolio v3 from its previously merged feature branch into the main application branch, keeping its existing navigation and corrected seated pose.
