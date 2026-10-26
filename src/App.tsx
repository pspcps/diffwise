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

const HASH_TO_MODE: Record<string, ViewMode> = {
  '#/text': 'text',
  '#/file': 'file',
  '#/case': 'case',
  '#/json': 'json',
  '#/time': 'time',
  '#/base64': 'base64',
  '#/markup': 'markup',
  '#/regex': 'regex',
  '#/url': 'url',
  '#/architecture': 'architecture',
  '#/pdf': 'pdf',
  '#/word-to-pdf': 'pdf',
  '#/image_studio': 'image_studio',
  '#/image': 'image_studio',
};

const MODE_SEO: Record<ViewMode, { title: string; desc: string }> = {
  text: {
    title: 'Code & Text Diff Checker Online — PSDevTool',
    desc: 'Compare code, text, and documents with side-by-side and inline visual diffs with live syntax highlighting.',
  },
  file: {
    title: 'Folder & File Diff Comparison Tool — PSDevTool',
    desc: 'Compare directories and files side by side. Detect modified, added, and removed lines instantly.',
  },
  case: {
    title: 'Text Case Converter (Camel, Snake, Pascal, Kebab) — PSDevTool',
    desc: 'Convert strings between camelCase, snake_case, PascalCase, kebab-case, CONSTANT_CASE, and more.',
  },
  json: {
    title: 'JSON Formatter, Validator & Minifier Online — PSDevTool',
    desc: 'Format, validate, query, fix, and minify JSON data with instant error highlighting and tree inspection.',
  },
  time: {
    title: 'Time Zone Converter & Unix Epoch Clock — PSDevTool',
    desc: 'Convert timestamps across global time zones, format ISO strings, and calculate Unix epoch timestamps.',
  },
  base64: {
    title: 'Base64 Image Converter & Decoder — PSDevTool',
    desc: 'Convert images to Base64 data URIs and decode Base64 strings to downloadable PNG/JPEG images.',
  },
  markup: {
    title: 'HTML, Markdown & XML Formatter Studio — PSDevTool',
    desc: 'Beautify, preview, and format HTML, Markdown, XML, and SQL code with instant syntax highlighting.',
  },
  regex: {
    title: 'Regex Tester & Interactive Debugger Online — PSDevTool',
    desc: 'Test and debug regular expressions in real-time with highlighted matches, capture groups, and explanations.',
  },
  url: {
    title: 'URL Encoder, Decoder & Query Parser — PSDevTool',
    desc: 'Encode, decode, parse, and analyze URLs and query parameters cleanly and securely in your browser.',
  },
  architecture: {
    title: 'System Architecture & Database Diagram Designer — PSDevTool',
    desc: 'Design system architectures, cloud infrastructure maps, and database ERDs with export to SVG and PNG.',
  },
  pdf: {
    title: 'Word to PDF Converter Online Free — PSDevTool PDF Studio',
    desc: 'Accurately convert Word (.docx) documents to PDF directly in your browser. Merge, split, and compress PDFs with zero server uploads.',
  },
  image_studio: {
    title: 'Image Studio: Crop, Resize, SVG & Filter Online — PSDevTool',
    desc: 'Edit, crop, resize, rotate, and convert PNG, JPG, and WebP images. Convert raster graphics to vector SVG.',
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

      <Toolbar mode={mode} onModeChange={handleModeChange} onAbout={() => setAboutOpen(v => !v)} />

      {/* Both views stay mounted; visibility:hidden preserves Monaco state across tab switches */}
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
        {mode === 'architecture' && <div className="absolute inset-0 flex flex-col">
          <Suspense fallback={<div className="flex h-full items-center justify-center text-xs text-[#9399b2]">Loading Architecture Lab…</div>}>
            <ArchitectureLabView />
          </Suspense>
        </div>}
        {mode === 'pdf' && <div className="absolute inset-0 flex flex-col">
          <Suspense fallback={<div className="flex h-full items-center justify-center text-xs text-[#9399b2]">Loading PDF Studio…</div>}>
            <PdfStudioView />
          </Suspense>
        </div>}
        {mode === 'image_studio' && <div className="absolute inset-0 flex flex-col">
          <Suspense fallback={<div className="flex h-full items-center justify-center text-xs text-[#9399b2]">Loading Image Studio…</div>}>
            <ImageStudioView />
          </Suspense>
        </div>}
      </div>
      <AdBanner />
    </div>
  );
}
