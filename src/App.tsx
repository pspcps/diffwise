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
  const [mode, setMode] = useState<ViewMode>('text');
  const [showWelcome, setShowWelcome] = useState(true);
  const [aboutOpen, setAboutOpen] = useState(false);
  const hash = useHashRoute();

  const goPortfolio = () => { window.location.hash = '#/portfolio'; };
  const goBack      = () => { window.location.hash = ''; };

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

      <Toolbar mode={mode} onModeChange={setMode} onAbout={() => setAboutOpen(v => !v)} />

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
      </div>
      <AdBanner />
    </div>
  );
}
