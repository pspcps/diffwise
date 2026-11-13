import { lazy, Suspense, useState, useEffect } from 'react';
import './index.css';
import Toolbar from './components/Layout/Toolbar';
import WorkbenchHeading from './components/Layout/WorkbenchHeading';
import './workbench.css';
import './workspace.css';
import { rememberTool } from './utils/toolHistory';
import ToolWorkspace from './components/Workspace/ToolWorkspace';
import AdBanner from './components/Ads/AdBanner';
import AboutPanel from './components/About/AboutPanel';
const PortfolioPage = lazy(() => import('./pages/PortfolioPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
import type { ViewMode } from './types';

import CommandPalette from './components/CommandPalette/CommandPalette';

const HASH_TO_MODE: Record<string, ViewMode> = {
  '#/text': 'text',
  '#/diff': 'text',
  '#/diff-checker': 'text',
  '#/code-compare': 'text',
  '#/text-diff': 'text',

  '#/file': 'file',
  '#/file-diff': 'file',
  '#/folder-diff': 'file',

  '#/case': 'case',
  '#/case-converter': 'case',

  '#/json': 'json',
  '#/json-converter': 'json',
  '#/json-to-table': 'json',
  '#/json-formatter': 'json',
  '#/json-validator': 'json',

  '#/time': 'time',
  '#/timezone': 'time',
  '#/timezone-converter': 'time',
  '#/epoch-converter': 'time',

  '#/base64': 'base64',
  '#/base64-converter': 'base64',
  '#/image-to-base64': 'base64',

  '#/markup': 'markup',
  '#/html-sandbox': 'markup',
  '#/sql-formatter': 'markup',
  '#/xml-formatter': 'markup',

  '#/regex': 'regex',
  '#/regex-tester': 'regex',
  '#/regex-debugger': 'regex',

  '#/url': 'url',
  '#/url-encoder': 'url',
  '#/url-decoder': 'url',

  '#/architecture': 'architecture',
  '#/database-diagram': 'architecture',
  '#/architecture-diagram': 'architecture',
  '#/erd-designer': 'architecture',

  '#/pdf': 'pdf',
  '#/word-to-pdf': 'pdf',
  '#/docx-to-pdf': 'pdf',
  '#/pdf-converter': 'pdf',

  '#/image_studio': 'image_studio',
  '#/image': 'image_studio',
  '#/image-studio': 'image_studio',
  '#/image-crop': 'image_studio',
  '#/image-compressor': 'image_studio',

  '#/har': 'har',
  '#/har-viewer': 'har',
  '#/har-file-viewer': 'har',
  '#/network-inspector': 'har',

  '#/jwt': 'jwt',
  '#/jwt-debugger': 'jwt',
  '#/jwt-parser': 'jwt',
  '#/jwt-token': 'jwt',

  '#/yaml': 'json',
  '#/yaml-converter': 'json',
  '#/yaml-to-json': 'json',
  '#/json-to-yaml': 'json',

  '#/uuid': 'uuid',
  '#/uuid-generator': 'uuid',
  '#/snowflake': 'uuid',
  '#/snowflake-generator': 'uuid',
  '#/ulid': 'uuid',
  '#/nanoid': 'uuid',

  '#/api': 'api',
  '#/apidesk': 'api',
  '#/postman': 'api',
  '#/swagger': 'api',
  '#/openapi': 'api',
  '#/graphql': 'api',

  '#/debug': 'debug',
  '#/debugflow': 'debug',
  '#/error-debugger': 'debug',
  '#/stacktrace': 'debug',
  '#/logs': 'debug',

  '#/measure': 'measure',
  '#/units': 'measure',
  '#/unit-converter': 'measure',
  '#/geometry': 'measure',
  '#/distance': 'distance',
  '#/geodistance': 'distance',
  '#/geo-distance': 'distance',
  '#/coordinates': 'distance',
  '#/lat-lon': 'distance',
  '#/latlon': 'distance',
  '#/haversine': 'distance',
};

const MODE_SEO: Record<ViewMode, { title: string; desc: string }> = {
  text: {
    title: 'Diff Checker & Code Compare Online Free — PSDevTool',
    desc: 'Compare code, text, and files with free side-by-side diff checker and live syntax highlighting for 50+ languages.',
  },
  file: {
    title: 'Folder Diff & File Compare Tool Online — PSDevTool',
    desc: 'Compare directories and local files side by side. Detect modified, added, and removed lines instantly.',
  },
  case: {
    title: 'Text Case Converter (CamelCase, snake_case, kebab-case) — PSDevTool',
    desc: 'Free text case converter: switch between camelCase, snake_case, PascalCase, kebab-case, CONSTANT_CASE, and more.',
  },
  json: {
    title: 'JSON Converter, JSON to Table & Formatter Online — PSDevTool',
    desc: 'Convert JSON to table, format, validate, fix, and minify JSON data with tree view and instant error detection.',
  },
  time: {
    title: 'Timezone Converter & Unix Epoch Clock Online — PSDevTool',
    desc: 'Convert timestamps across world time zones, calculate Unix epoch timestamps, and format ISO 8601 strings.',
  },
  base64: {
    title: 'Base64 Image Converter & Decoder Online — PSDevTool',
    desc: 'Convert PNG, JPG, and SVG to Base64 data URIs and decode Base64 strings to downloadable images.',
  },
  markup: {
    title: 'HTML Previewer, Markdown & XML Formatter Studio — PSDevTool',
    desc: 'Format, beautify, and preview HTML, Markdown, XML, and SQL code with instant syntax highlighting.',
  },
  regex: {
    title: 'Regex Tester & Interactive Debugger Online — PSDevTool',
    desc: 'Interactive regex tester: test regular expressions in real time with syntax validation and match breakdown.',
  },
  url: {
    title: 'URL Encoder, Decoder & Query Parser Online — PSDevTool',
    desc: 'Encode and decode URLs, parse query string parameters into editable tables, and sanitize web links.',
  },
  architecture: {
    title: 'Database Diagram & System Architecture Designer — PSDevTool',
    desc: 'Free online tool to design database ERD schemas, system architecture flows, and infrastructure diagrams.',
  },
  pdf: {
    title: 'Word to PDF Converter Online Free (No Upload) — PSDevTool',
    desc: 'Convert Microsoft Word DOCX to PDF online for free directly in your browser. Merge, split, and compress PDF files.',
  },
  image_studio: {
    title: 'Image Crop, Compressor & SVG Converter Online — PSDevTool',
    desc: 'Free image crop tool, image compressor, aspect ratio resizer, and vector SVG converter right in your browser.',
  },
  har: {
    title: 'HAR File Viewer & Network Waterfall Inspector — PSDevTool',
    desc: 'Inspect HTTP Archive (.har) files, analyze network waterfalls, debug headers, payloads, TTFB timing, and sanitize tokens locally.',
  },
  jwt: {
    title: 'JWT Debugger, Token Parser & Claims Inspector — PSDevTool',
    desc: 'Decode JSON Web Tokens, inspect claims and expiration timestamps, and verify HMAC-SHA256 signatures with 100% client-side privacy.',
  },
  uuid: {
    title: 'UUID & Unique ID Generator (v4, v7, Snowflake, ULID) — PSDevTool',
    desc: 'Generate UUID v4, UUID v7 (time-ordered), Twitter Snowflake, ULID, NanoID, and MongoDB ObjectIds in bulk.',
  },
  api: {
    title: 'ApiDesk Studio: Postman Client & Swagger OpenAPI Hub — PSDevTool',
    desc: 'Lightweight client-side Postman API tester and Swagger OpenAPI spec explorer. Send HTTP requests, inspect latency, import cURL, and convert Swagger to JSON/YAML.',
  },
  debug: {
    title: 'DebugFlow — Universal Error & Stack Trace Debugger — PSDevTool',
    desc: 'Analyze logs, exceptions, and stack traces across C#, Java, Python, Node.js, and Go with deterministic root cause analysis and execution flow mapping.',
  },
  measure: {
    title: 'Measure Lab — 3D Unit Converter, Geometry & Algebra — PSDevTool',
    desc: 'Convert length, mass, volume and more with interactive 3D illustrations. Calculate areas, volumes and algebra with visible formulas, locally in your browser.',
  },
  distance: {
    title: 'Geo Distance & Coordinates Calculator (Lat/Lon Haversine & Vincenty) — PSDevTool',
    desc: 'Calculate distance between two GPS coordinates (latitude and longitude) with high precision using Vincenty WGS-84 and Haversine formulas, coordinate delta breakdown, and travel times.',
  },
};

function useHashRoute() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const handler = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);
  return hash;
}

export default function App() {
  const hash = useHashRoute();
  const initialMode = HASH_TO_MODE[window.location.hash.split('?')[0]] || 'text';
  const [mode, setMode] = useState<ViewMode>(initialMode);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Global Cmd+K / Ctrl+K listener for quick search
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(v => !v);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  const routeHash = hash.split('?')[0];
  useEffect(() => { if (HASH_TO_MODE[routeHash]) rememberTool(HASH_TO_MODE[routeHash]); }, [routeHash]);

  // Sync mode when URL hash changes externally
  useEffect(() => {
    if (routeHash && HASH_TO_MODE[routeHash] && HASH_TO_MODE[routeHash] !== mode) {
      setMode(HASH_TO_MODE[routeHash]);
    }
  }, [hash]);

  // Update dynamic document title and meta description for SEO
  useEffect(() => {
    const isHome = !hash || hash === '#/' || hash === '#/home';
    const seo = hash === '#/portfolio'
      ? { title: 'Prakash Choudhary — Senior Software Engineer', desc: 'Explore projects, experience, and the engineering work of Prakash Choudhary: cloud-native systems, real-time platforms, and AI products.' }
      : isHome
        ? { title: 'PSDevTool — Your Developer Space', desc: 'A thoughtfully crafted developer workspace. Compare code, create diagrams, format data, and explore tools that keep you in flow.' }
        : MODE_SEO[mode];
    if (seo) {
      document.title = seo.title;
      const descEl = document.querySelector('meta[name="description"]');
      if (descEl) descEl.setAttribute('content', seo.desc);
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute('content', seo.title);
      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute('content', seo.desc);
    }

    // Send page_view event to Google Analytics (GA4) for tab and hash navigation
    if (typeof (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag === 'function') {
      (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', 'page_view', {
        page_title: document.title,
        page_location: window.location.href,
        page_path: window.location.pathname + window.location.hash,
      });
    }
  }, [mode, hash]);

  const handleModeChange = (newMode: ViewMode) => {
    setMode(newMode);
    window.location.hash = `#/${newMode}`;
  };

  const goPortfolio = () => { window.location.hash = '#/portfolio'; };
  const goBack      = () => { window.location.hash = `#/${mode}`; };

  // Portfolio is a full-page takeover
  if (hash === '#/portfolio') {
    return <Suspense fallback={<div className="space-loading">Opening portfolio…</div>}><PortfolioPage onBack={goBack} /></Suspense>;
  }

  if (!hash || hash === '#/' || hash === '#/home') {
    return (
      <>
        <Suspense fallback={<div className="space-loading">Opening your workspace…</div>}>
          <HomePage onTool={handleModeChange} onPortfolio={goPortfolio} onSearch={() => setCommandPaletteOpen(true)} />
        </Suspense>
        <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} onSelectTool={handleModeChange} onPortfolio={goPortfolio} />
      </>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#171d19] text-[#e4ebdd] overflow-hidden">
      {/* About Me slide-in panel */}
      {aboutOpen && (
        <AboutPanel onClose={() => setAboutOpen(false)} onPortfolio={goPortfolio} />
      )}

      {/* Cmd+K Quick Search Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onSelectTool={handleModeChange}
        onPortfolio={goPortfolio}
      />

      <a className="workspace-skip" href="#tool-workspace" onClick={e => { e.preventDefault(); document.getElementById('tool-workspace')?.focus(); }}>Skip to workspace</a>
      <Toolbar
        mode={mode}
        onModeChange={handleModeChange}
        onAbout={() => setAboutOpen(v => !v)}
        onOpenSearch={() => setCommandPaletteOpen(true)}
      />

      <WorkbenchHeading mode={mode} />
      <ToolWorkspace mode={mode} />
      <AdBanner />
    </div>
  );
}
