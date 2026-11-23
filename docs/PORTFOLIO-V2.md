# Portfolio v2

`/portfolio/v2/` is an additional portfolio inspired by the profile-sidebar and tabbed-panel composition of [codewithsadee’s vCard](https://github.com/codewithsadee/vcard-personal-portfolio). The original `/portfolio/` remains available; both versions link to each other. This is an independent React implementation using PSDevTool’s existing portrait, technology icons and documented content. It does not copy the example identity, testimonials, project images, blog posts or skill percentages.

## Content and interaction

- About: full-stack, systems, cloud and applied AI focus, with career highlights and the existing animated role title.
- Experience: all four employers in a timeline, education, certification and existing contribution details.
- Projects: all twelve current portfolio projects, filterable by Applied AI, Developer tools and Android. Source links are directly on the cards; FleetMind remains identified as private. Expand Engineering details for the existing implementation, evidence and limitations.
- Toolkit: existing technology groups with local logos, plus AI-DLC.
- Contact: real email, LinkedIn, GitHub and resume links. No pretend submission form.

The project previews are workflow illustrations, labeled as such, rather than screenshots or claimed production dashboards. The source of truth for projects remains `src/data/resumeData.ts` and `src/data/projectCaseStudies.ts`. Experience continues to be calculated from 2 January 2017. No phone number is displayed.

The shared language theme and motion controls retain their existing local-storage behavior. The page scrolls continuously through About, Experience, Projects, Toolkit and Contact. Navigation buttons scroll to each section and the active item follows scrolling in either direction. Left/Right, Home and End keys remain supported. A sticky navigation layer stays above the content at every breakpoint. All sections remain visible; no tab panels are hidden. The layout switches from a sticky desktop profile sidebar to an expandable profile on smaller screens. Motion can be paused and respects system reduced-motion settings.

## Routing and indexing

The v2 page is lazy-loaded separately from tools and the original portfolio. It has its own canonical URL, ProfilePage metadata, sitemap entry and prerendered HTML. The legacy `#/portfolio/v2` route redirects through the existing route mechanism. Direct portfolio documents do not include AdSense. The existing portfolio and tools keep their routes.

## Reference attribution

Design inspiration: vCard by codewithsadee, MIT licensed, copyright 2022 codewithsadee. The upstream license notice is retained in [licenses/vcard-MIT.txt](licenses/vcard-MIT.txt).
