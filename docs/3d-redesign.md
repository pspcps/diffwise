# Interactive workspace and portfolio

The default route (`#/` or `#/home`) opens the new workspace overview. Existing deep links (including `#/text`, `#/json`, and `#/portfolio`) continue to work.

## Design and interactions

- A dark charcoal, warm white, and soft mint visual system with shared navigation.
- An actual Three.js sculpture on the workspace and portfolio. Drag to orbit; use the pause/play and reset controls below it.
- Tool search, category filters, and favorites saved to this browser's local storage. Storage failures do not prevent using tools.
- A portfolio built from `src/data/resumeData.ts`, including filtered projects, accessible project detail dialogs, experience, skills, education, certifications, and open-source contributions.
- Subtle card tilt and floating details. Reduced-motion preferences disable automatic movement; the sculpture can still be rotated manually.
- A CSS sculpture fallback when WebGL initialization is unavailable.

The 3D renderer caps pixel density, skips rendering when the page or scene is hidden, and releases its GPU resources when navigating away. The overview and portfolio are lazy-loaded, so direct tool routes do not load their 3D scenes.

## Development

```sh
npm install
npm run dev
npm run build
```

No additional runtime dependencies or credentials are required. The existing React, Three.js, Lucide, and browser-local tools are reused. External project, résumé, and contact links use the existing profile data.

## Previews

![Workspace overview](redesign/workspace.jpg)

![Portfolio](redesign/portfolio.jpg)

[Mobile overview](redesign/mobile.jpg)

## Validation

- Production build: `npm run build` (TypeScript and Vite).
- Focused ESLint checks on the new and redesigned components.
- Chromium checks against the production preview: featured and full tool catalogs, category filtering, search and empty states, persisted favorites, 3D drag/pause/reset, project filtering, project dialog and Escape, existing architecture walkthroughs, experience expansion, case conversion, keyboard command search, and Monaco diff rendering.
- Responsive screenshots at 1440px and 390px, plus a 320px overflow check; reduced-motion and unavailable-WebGL checks.
- No uncaught browser errors in the completed flow. Headless Chromium used the environment's installed CA pins to load the existing Monaco CDN; analytics and ads were blocked during QA.

The shared `ManagedDiffEditor` also fixes the existing Monaco 0.55 model-disposal error when closing a comparison. It releases anonymous models after the diff widget is disposed, including when returning to the new overview.
