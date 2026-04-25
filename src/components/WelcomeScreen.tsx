import { useState, useEffect, useRef } from 'react';
import { GitCompare } from 'lucide-react';

const PARTICLES = Array.from({ length: 35 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2.5 + 0.5,
  delay: Math.random() * 6,
  duration: Math.random() * 5 + 4,
  color: ['#89b4fa', '#cba6f7', '#a6e3a1', '#f5c2e7'][i % 4],
}));

export default function WelcomeScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'in' | 'out'>('in');
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const exiting = useRef(false);

  useEffect(() => {
    const t = setTimeout(handleExit, 5500);
    return () => clearTimeout(t);
  }, []);

  const handleExit = () => {
    if (exiting.current) return;
    exiting.current = true;
    setPhase('out');
    setTimeout(onDone, 900);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientY - rect.top) / rect.height - 0.5;
    const ny = (e.clientX - rect.left) / rect.width - 0.5;
    setTilt({ x: nx * -18, y: ny * 18 });
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center overflow-hidden cursor-pointer ${phase === 'out' ? 'wsc-exit' : 'wsc-enter'}`}
      style={{ background: 'radial-gradient(ellipse at 50% 35%, #141430 0%, #0a0a18 55%, #000 100%)' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      onClick={handleExit}
    >
      {/* Floating star particles */}
      {PARTICLES.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full wsc-star"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}

      {/* Perspective grid floor */}
      <div className="absolute inset-x-0 bottom-0 h-[55%] overflow-hidden pointer-events-none">
        <div className="wsc-grid-inner" />
      </div>

      {/* Ambient glow orbs */}
      <div className="absolute w-96 h-96 rounded-full pointer-events-none wsc-orb1"
        style={{ background: 'radial-gradient(circle, rgba(137,180,250,0.07) 0%, transparent 70%)', top: '10%', left: '10%' }} />
      <div className="absolute w-72 h-72 rounded-full pointer-events-none wsc-orb2"
        style={{ background: 'radial-gradient(circle, rgba(203,166,247,0.06) 0%, transparent 70%)', bottom: '15%', right: '10%' }} />

      {/* Card entrance animation wrapper */}
      <div className="wsc-card-anim">
        {/* Tilt wrapper — responds to mouse */}
        <div
          style={{
            transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transition: 'transform 0.12s ease',
          }}
        >
          {/* Card */}
          <div className="relative rounded-3xl px-14 py-11 flex flex-col items-center gap-5 text-center"
            style={{
              background: 'linear-gradient(145deg, rgba(30,30,60,0.9) 0%, rgba(20,20,40,0.95) 100%)',
              border: '1px solid rgba(137,180,250,0.18)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.03) inset, 0 8px 80px rgba(0,0,0,0.6), 0 0 60px rgba(137,180,250,0.06)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* Shimmer top edge */}
            <div className="absolute top-0 left-8 right-8 h-px rounded-full"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(137,180,250,0.4), rgba(203,166,247,0.3), transparent)' }} />

            {/* Logo */}
            <div className="wsc-logo relative flex items-center justify-center">
              {/* Pulse rings */}
              <div className="absolute rounded-full wsc-ring1"
                style={{ width: 90, height: 90, border: '1px solid rgba(137,180,250,0.25)' }} />
              <div className="absolute rounded-full wsc-ring2"
                style={{ width: 116, height: 116, border: '1px solid rgba(203,166,247,0.15)' }} />
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(137,180,250,0.12), rgba(203,166,247,0.08))',
                  border: '1px solid rgba(137,180,250,0.3)',
                  boxShadow: '0 0 24px rgba(137,180,250,0.25), inset 0 1px 0 rgba(255,255,255,0.06)',
                }}>
                <GitCompare size={30} color="#89b4fa" />
              </div>
            </div>

            {/* Welcome label */}
            <div className="wsc-t1 flex flex-col items-center gap-0.5">
              <span className="text-[10px] tracking-[0.35em] uppercase text-[#45475a] font-medium">Welcome to</span>
              <h1 className="text-5xl font-bold tracking-tight leading-none"
                style={{
                  background: 'linear-gradient(130deg, #e2e8f8 0%, #89b4fa 45%, #cba6f7 85%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                DiffWise
              </h1>
            </div>

            {/* Tagline */}
            <div className="wsc-t2">
              <p className="text-[#585b70] text-sm leading-relaxed max-w-[260px]">
                The precise way to compare files &amp; text.<br />
                Built for developers who care.
              </p>
            </div>

            {/* Divider */}
            <div className="wsc-t3 w-24 h-px rounded-full"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(137,180,250,0.3), transparent)' }} />

            {/* Thank-you */}
            <div className="wsc-t4">
              <p className="text-[11px] text-[#3d3f55] leading-relaxed">
                Your presence here means a lot to us.<br />
                Thank you for choosing DiffWise ✦
              </p>
            </div>

            {/* CTA */}
            <div className="wsc-t5">
              <button
                className="px-8 py-2.5 rounded-xl text-sm font-semibold text-[#1e1e2e] transition-all duration-150 hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #89b4fa 0%, #cba6f7 100%)',
                  boxShadow: '0 4px 24px rgba(137,180,250,0.35), 0 1px 0 rgba(255,255,255,0.2) inset',
                }}
                onClick={e => { e.stopPropagation(); handleExit(); }}
              >
                Start Comparing →
              </button>
              <p className="mt-2.5 text-[10px] text-[#2a2b3d]">Click anywhere to continue</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
