# VS Code extension implementation

The extension reuses all 20 existing tool views; it does not embed the hosted website. `vscode-webview.html` and `src/vscode/main.tsx` provide an independent entry with no ads, analytics or website navigation shell. The website keeps its normal path routes and build.

## Build and install

```sh
npm ci
npm --prefix vscode-extension ci --ignore-scripts
npm run package:extension
code --install-extension vscode-extension/psdevtool-0.1.0.vsix
```

See [the extension README](../vscode-extension/README.md) for commands, network behavior, selection import, export limits and printing. The GitHub Actions workflow also produces a VSIX artifact for pull requests or a manual workflow run. Marketplace publication is separate and requires a verified publisher account; no Marketplace publishing token is stored in this project.

## Boundaries

- The native host reads only its own packaged HTML/catalog. It does not discover or execute workspace code.
- Editor selection is sent only through the explicit selection command. The webview asks before replacing existing tool input.
- Clipboard actions use `vscode.env.clipboard`; exports require a native Save dialog. The host never accepts an arbitrary destination path from the webview.
- Validated messages have bounded text/file sizes and a small action allowlist. External URL handling excludes `command:`, `javascript:`, `file:` and `vscode:` messages.
- Local resource roots are restricted to the app bundle. CSP permits local scripts, inline styles and blob workers; it does not permit remote scripts or `unsafe-eval`.
- Maps and API requests retain their explicit network behavior. No server-side proxy, certificate bypass, ad script or tracking script is added.
- Hash routes preserve the original webview document URL, independently of its cross-origin resource base. Monaco and regex workers are bundled as blob workers to satisfy webview origin restrictions.
- Resume print and native Word print export static, script-free printable HTML. Existing direct PDF exports remain native downloads. Closing the panel resets unsaved tool inputs; opted-in resume profiles are separate local storage and have backup/import.

## Verification

- Production website build, SEO/static output, structured conversion, resume profiles and tool catalog checks.
- Extension build, focused TypeScript/React lint, packaging and a successful VSIX CLI installation.
- Six automated host-protocol/routing/catalog checks, including executable-link rejection, destination-path rejection, payload bounds and the cross-origin route regression.
- Browser checks opening all 20 views with external network blocked; selection import, clipboard, export with immediate blob URL revocation, nested resume routes, inline QR, printable export and narrow layouts.
- Actual installed-VSIX tool checks and desktop VS Code development-host activation and a ready handshake, plus JSON Studio, regex matching, diagrams, unit/geometry tools, PDF Studio, API Desk, Resume Builder and native clipboard checks.

The browser checks cover local tool loading and shared workflows, not every operation in each tool. Public map/routing availability, arbitrary third-party API CORS behavior, hardware camera permissions and the full matrix of operating systems/VS Code versions are not guaranteed by these checks.
