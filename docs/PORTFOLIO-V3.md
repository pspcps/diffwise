# Portfolio v3 — Engineering Studio

`/portfolio/v3/` is an additional portfolio with an original interactive 3D desk, large typography and a light/dark editorial flow. The original `/portfolio/` and profile-oriented `/portfolio/v2/` remain available. Each version links to the others.

## Inspiration and original implementation

Visual inspiration: [David Heckhoff’s portfolio](https://david-hckh.com/) and [portfolio-2025](https://github.com/davidhckh/portfolio-2025). The reference’s license restricts commercial reuse of substantial portions. This implementation does not copy its source, models, textures, fonts, audio, project imagery or personal content. The desk, character, fallback SVG, CSS and interactions are independently authored for PSDevTool. A visible inspiration link is included in the footer.

## Experience

- The original Three.js scene uses procedural geometry: desk, seated developer with glasses and a waving hand, monitor, laptop, notebook, cup, books, lamp, plant and a small server tower.
- The laptop uses the selected language’s existing local technology logo. Changing language rebuilds the scene with that language’s accent and disposes the previous resources.
- Drag with a mouse, use Rotate left/right and Reset view, or select The work / The journey / Say hello. The monitor/laptop, notebook and cup also link to those sections through raycasting.
- Touch scrolling is retained with `touch-action: pan-y`; scene shortcuts are ordinary buttons and remain usable when WebGL is unavailable.
- An original SVG fallback stays visible until the first rendered frame, and returns on WebGL context loss. Resource loading does not gate the text or project links.
- DPR is capped at 1.5 and rendering at approximately 30 fps. Offscreen and hidden-document renders are skipped. Geometry, materials, textures, renderer, frame callbacks, observers and listeners are cleaned up on theme changes and unmount.
- Shared saved language/motion controls remain in use. The waving hand, role typing, reveal animation and hover motion respect those settings and system reduced motion. No audio starts automatically.

## Content

All twelve current projects remain available with category filters and direct public repository links. Private FleetMind remains identified as private; project illustrations are explicitly labeled. Expand Inside the build for existing implementation details, limitations and source evidence. Content continues to come from the shared resume/project data, rather than duplicate project claims.

Experience is calculated from 2 January 2017. The journey section includes all four employers and existing contribution descriptions. The toolkit uses existing local technology logos and includes AI-DLC. Email, LinkedIn, GitHub and resume links use current shared contact details; no phone number or unconnected contact form is added.

## Routing and verification

The page and its 3D scene are separately lazy-loaded. Text content is prerendered for the clean `/portfolio/v3/` route, with canonical metadata, ProfilePage schema, sitemap coverage and legacy `#/portfolio/v3` handling. Direct portfolio documents do not load AdSense.

`npm run test:portfolio` checks both newer portfolio routes and prerendered content; `npm run test:seo` checks the full generated route set. Browser-control tools are unavailable in this execution session, so actual WebGL rendering, desktop/mobile appearance, dragging, object picking and scroll interactions still require deployment-preview review.
