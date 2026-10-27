import { lazy, Suspense, useState, useEffect } from 'react';
import './index.css';
import Toolbar from './components/Layout/Toolbar';
import TextCompareView from './components/TextCompare/TextCompareView';
import FileCompareView from './components/FileCompare/FileCompareView';
import CaseConverterView from './components/CaseConverter/CaseConverterView';
import JsonToolsView from './components/JsonTools/JsonToolsView';
import TimeZoneView from './components/TimeZone/TimeZoneView';
import Base64ImageView from './components/Base64Image/Base64ImageView';
import MarkupStudioView from './components/MarkupStudio/MarkupStudioView';
import RegexLabView from './components/RegexLab/RegexLabView';
import UrlToolsView from './components/UrlTools/UrlToolsView';
import WelcomeScreen from './components/WelcomeScreen';
import AdBanner from './components/Ads/AdBanner';
import AboutPanel from './components/About/AboutPanel';
import PortfolioPage from './pages/PortfolioPage';
import type { ViewMode } from './types';

const ArchitectureLabView = lazy(() => import('./components/ArchitectureLab/ArchitectureLabView'));
const PdfStudioView = lazy(() => import('./components/PdfStudio/PdfStudioView'));
const ImageStudioView = lazy(() => import('./components/ImageStudio/ImageStudioView'));
const HarViewerView = lazy(() => import('./components/HarViewer/HarViewerView'));
const JwtStudioView = lazy(() => import('./components/JwtStudio/JwtStudioView'));
const UuidStudioView = lazy(() => import('./components/UuidStudio/UuidStudioView'));
const ApiStudioView = lazy(() => import('./components/ApiStudio/ApiStudioView'));
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
  const initialMode = HASH_TO_MODE[window.location.hash] || 'text';
  const [mode, setMode] = useState<ViewMode>(initialMode);
  const [showWelcome, setShowWelcome] = useState(true);
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

  // Sync mode when URL hash changes externally
  useEffect(() => {
    if (hash && HASH_TO_MODE[hash] && HASH_TO_MODE[hash] !== mode) {
      setMode(HASH_TO_MODE[hash]);
    }
  }, [hash]);

  // Update dynamic document title and meta description for SEO
  useEffect(() => {
    if (hash === '#/portfolio') {
      document.title = 'Prakash Choudhary — Senior Full Stack & Software Engineer';
      return;
    }
    const seo = MODE_SEO[mode];
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
    return <PortfolioPage onBack={goBack} />;
  }

  return (
    <div className="flex flex-col h-screen bg-[#1e1e2e] text-[#cdd6f4] overflow-hidden">
      {showWelcome && <WelcomeScreen onDone={() => setShowWelcome(false)} />}

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

      <Toolbar
        mode={mode}
        onModeChange={handleModeChange}
        onAbout={() => setAboutOpen(v => !v)}
        onOpenSearch={() => setCommandPaletteOpen(true)}
      />

      {/* All views stay mounted or dynamically loaded */}
      <div className="flex-1 min-h-0 relative">
        <div className={`absolute inset-0 flex flex-col${mode !== 'text' ? ' invisible pointer-events-none' : ''}`}>
          <TextCompareView />
        </div>
        <div className={`absolute inset-0 flex flex-col${mode !== 'file' ? ' invisible pointer-events-none' : ''}`}>
          <FileCompareView />
        </div>
        <div className={`absolute inset-0 flex flex-col${mode !== 'case' ? ' invisible pointer-events-none' : ''}`}>
          <CaseConverterView />
        </div>
        <div className={`absolute inset-0 flex flex-col${mode !== 'json' ? ' invisible pointer-events-none' : ''}`}>
          <JsonToolsView />
        </div>
        <div className={`absolute inset-0 flex flex-col${mode !== 'time' ? ' invisible pointer-events-none' : ''}`}>
          <TimeZoneView />
        </div>
        <div className={`absolute inset-0 flex flex-col${mode !== 'base64' ? ' invisible pointer-events-none' : ''}`}>
          <Base64ImageView />
        </div>
        <div className={`absolute inset-0 flex flex-col${mode !== 'markup' ? ' invisible pointer-events-none' : ''}`}>
          <MarkupStudioView />
        </div>
        <div className={`absolute inset-0 flex flex-col${mode !== 'regex' ? ' invisible pointer-events-none' : ''}`}>
          <RegexLabView />
        </div>
        <div className={`absolute inset-0 flex flex-col${mode !== 'url' ? ' invisible pointer-events-none' : ''}`}>
          <UrlToolsView />
        </div>

        {/* Dynamic Heavy Views */}
        {mode === 'har' && (
          <div className="absolute inset-0 flex flex-col">
            <Suspense fallback={<div className="flex h-full items-center justify-center text-xs text-[#9399b2]">Loading HAR Viewer…</div>}>
              <HarViewerView />
            </Suspense>
          </div>
        )}

        {mode === 'api' && (
          <div className="absolute inset-0 flex flex-col">
            <Suspense fallback={<div className="flex h-full items-center justify-center text-xs text-[#9399b2]">Loading ApiDesk Studio…</div>}>
              <ApiStudioView />
            </Suspense>
          </div>
        )}

        {mode === 'jwt' && (
          <div className="absolute inset-0 flex flex-col">
            <Suspense fallback={<div className="flex h-full items-center justify-center text-xs text-[#9399b2]">Loading JWT Debugger…</div>}>
              <JwtStudioView />
            </Suspense>
          </div>
        )}


        {mode === 'uuid' && (
          <div className="absolute inset-0 flex flex-col">
            <Suspense fallback={<div className="flex h-full items-center justify-center text-xs text-[#9399b2]">Loading UUID Generator…</div>}>
              <UuidStudioView />
            </Suspense>
          </div>
        )}

        {mode === 'architecture' && (
          <div className="absolute inset-0 flex flex-col">
            <Suspense fallback={<div className="flex h-full items-center justify-center text-xs text-[#9399b2]">Loading Architecture Lab…</div>}>
              <ArchitectureLabView />
            </Suspense>
          </div>
        )}

        {mode === 'image_studio' && (
          <div className="absolute inset-0 flex flex-col">
            <Suspense fallback={<div className="flex h-full items-center justify-center text-xs text-[#9399b2]">Loading Image Studio…</div>}>
              <ImageStudioView />
            </Suspense>
          </div>
        )}

        {/* PDF Studio */}
        {mode === 'pdf' && (
          <div className="absolute inset-0 flex flex-col">
            <Suspense fallback={<div className="flex h-full items-center justify-center text-xs text-[#9399b2]">Loading PDF Studio…</div>}>
              <PdfStudioView />
            </Suspense>
          </div>
        )}
      </div>
      <AdBanner />
    </div>
  );
}
