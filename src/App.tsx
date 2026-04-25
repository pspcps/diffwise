import { useState, useEffect } from 'react';
import './index.css';
import Toolbar from './components/Layout/Toolbar';
import TextCompareView from './components/TextCompare/TextCompareView';
import FileCompareView from './components/FileCompare/FileCompareView';
import WelcomeScreen from './components/WelcomeScreen';
import AdBanner from './components/Ads/AdBanner';
import AboutPanel from './components/About/AboutPanel';
import PortfolioPage from './pages/PortfolioPage';
import type { ViewMode } from './types';

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
      </div>
      <AdBanner />
    </div>
  );
}
