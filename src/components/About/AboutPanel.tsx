import { useEffect } from 'react';
import { X, Link2, ExternalLink, Code2 } from 'lucide-react';
import { RESUME } from '../../data/resumeData';

interface AboutPanelProps {
  onClose: () => void;
  onPortfolio: () => void;
}

export default function AboutPanel({ onClose, onPortfolio }: AboutPanelProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 flex flex-col about-panel-slide"
        style={{
          width: 320,
          background: 'linear-gradient(160deg, #0f0f1e 0%, #0a0a16 100%)',
          borderLeft: '1px solid rgba(137,180,250,0.12)',
          boxShadow: '-20px 0 60px rgba(0,0,0,0.6)',
        }}
      >
        {/* Ambient top glow */}
        <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(79,142,247,0.08) 0%, transparent 70%)' }} />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <span className="text-[10px] tracking-[0.25em] uppercase text-[#3d3f55]">About the Builder</span>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#45475a] hover:text-[#cdd6f4] hover:bg-white/5 transition-all">
            <X size={14} />
          </button>
        </div>

        {/* Avatar + Identity */}
        <div className="flex flex-col items-center px-5 pt-4 pb-5 shrink-0">
          <div className="relative mb-4">
            {/* Avatar photo */}
            <div className="w-20 h-20 rounded-2xl overflow-hidden"
              style={{ boxShadow: '0 8px 32px rgba(79,142,247,0.3), 0 0 0 2px rgba(79,142,247,0.25)' }}>
              <img src="/avatar.jpg" alt="Prakash Choudhary"
                className="w-full h-full object-cover object-top" />
            </div>
            {/* Online dot */}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#10b981] border-2 border-[#0a0a16]"
              style={{ boxShadow: '0 0 8px #10b981' }} />
          </div>

          <h2 className="text-lg font-bold text-white">{RESUME.name}</h2>
          <p className="text-sm mt-0.5" style={{ color: '#4f8ef7' }}>{RESUME.title}</p>
          <p className="text-[11px] mt-1 text-center leading-relaxed" style={{ color: '#45475a' }}>
            {RESUME.focus}
          </p>
        </div>

        {/* Divider */}
        <div className="mx-5 h-px mb-4 shrink-0"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(137,180,250,0.15), transparent)' }} />

        {/* Bio */}
        <div className="px-5 mb-5 shrink-0">
          <p className="text-[12px] leading-relaxed" style={{ color: '#6c7086' }}>
            {RESUME.summary.slice(0, 160)}...
          </p>
        </div>

        {/* LinkedIn only */}
        <div className="px-5 flex flex-col gap-2 mb-5 shrink-0">
          <a href={RESUME.linkedin} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all"
            style={{ color: '#6c7086', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.3)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.05)'}
          >
            <Link2 size={13} color="#8b5cf6" />
            <span>linkedin.com/in/prakashseervi63</span>
          </a>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Portfolio CTA */}
        <div className="px-5 pb-6 shrink-0 flex flex-col gap-2">
          <button
            onClick={() => { onClose(); onPortfolio(); }}
            className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #4f8ef7 0%, #8b5cf6 100%)',
              color: '#fff',
              boxShadow: '0 4px 20px rgba(79,142,247,0.35)',
            }}
          >
            <ExternalLink size={14} />
            View Full Portfolio
          </button>
          <p className="text-center text-[10px]" style={{ color: '#2a2b3d' }}>
            <Code2 size={10} className="inline mr-1" />
            Also built DiffWise — this tool
          </p>
        </div>
      </div>
    </>
  );
}
