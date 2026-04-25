import { useState, useEffect, useRef } from 'react';
import { RESUME } from '../data/resumeData';
import { Mail, Link2, Phone, ArrowLeft, ChevronUp, Code2 } from 'lucide-react';

// ── Scroll-reveal hook ────────────────────────────────────────────────────────
function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// ── Typewriter ────────────────────────────────────────────────────────────────
function useTypewriter(words: string[], speed = 80, pause = 1800) {
  const [display, setDisplay] = useState('');
  const [wordIdx, setWordIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const word = words[wordIdx];
    const delay = deleting ? speed / 2 : charIdx === word.length ? pause : speed;
    const t = setTimeout(() => {
      if (!deleting && charIdx < word.length) { setDisplay(word.slice(0, charIdx + 1)); setCharIdx(c => c + 1); }
      else if (!deleting && charIdx === word.length) { setDeleting(true); }
      else if (deleting && charIdx > 0) { setDisplay(word.slice(0, charIdx - 1)); setCharIdx(c => c - 1); }
      else { setDeleting(false); setWordIdx(i => (i + 1) % words.length); }
    }, delay);
    return () => clearTimeout(t);
  }, [charIdx, deleting, wordIdx, words, speed, pause]);
  return display;
}

// ── Section wrapper with fade-up animation ────────────────────────────────────
function Section({ children, id, className = '' }: { children: React.ReactNode; id: string; className?: string }) {
  const { ref, visible } = useInView();
  return (
    <section id={id} ref={ref}
      className={`pf-section ${visible ? 'pf-visible' : ''} ${className}`}>
      {children}
    </section>
  );
}

// ── Timeline Entry ─────────────────────────────────────────────────────────────
function TimelineEntry({ exp, idx }: { exp: typeof RESUME.experience[0]; idx: number }) {
  const { ref, visible } = useInView(0.1);
  return (
    <div ref={ref}
      className={`pf-timeline-entry ${visible ? 'pf-visible' : ''}`}
      style={{ transitionDelay: `${idx * 80}ms` }}>
      {/* Timeline dot */}
      <div className="pf-timeline-dot" style={{ background: exp.color, boxShadow: `0 0 12px ${exp.color}60` }} />

      {/* Card */}
      <div className="pf-timeline-card">
        {/* Card top accent */}
        <div className="absolute top-0 left-0 right-0 h-px rounded-t-2xl"
          style={{ background: `linear-gradient(90deg, transparent, ${exp.color}60, transparent)` }} />

        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
          <div>
            <h3 className="text-base font-bold text-white">{exp.company}</h3>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
              style={{ background: `${exp.color}18`, color: exp.color, border: `1px solid ${exp.color}30` }}>
              {exp.role}
            </span>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[11px] px-2 py-1 rounded-lg font-mono"
              style={{ background: 'rgba(255,255,255,0.04)', color: '#6c7086' }}>
              {exp.period}
            </span>
            {exp.current && (
              <div className="flex items-center justify-end gap-1 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] pf-pulse" />
                <span className="text-[10px] text-[#10b981]">Current</span>
              </div>
            )}
          </div>
        </div>

        <ul className="space-y-1.5">
          {exp.bullets.map((b, i) => (
            <li key={i} className="flex gap-2 text-[12px] leading-relaxed" style={{ color: '#8b8fa8' }}>
              <span className="mt-[5px] w-1 h-1 rounded-full shrink-0" style={{ background: exp.color }} />
              {b}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ── Project Card ───────────────────────────────────────────────────────────────
function ProjectCard({ p, idx }: { p: typeof RESUME.projects[0]; idx: number }) {
  const { ref, visible } = useInView(0.08);
  const extras = (p as any).githubExtra as { label: string; url: string }[] | undefined;
  return (
    <div ref={ref}
      className={`pf-project-card ${visible ? 'pf-visible' : ''}`}
      style={{ transitionDelay: `${idx * 60}ms` }}>
      {/* Top color bar */}
      <div className="h-0.5 rounded-t-2xl" style={{ background: `linear-gradient(90deg, ${p.color}, transparent)` }} />
      <div className="p-5 flex flex-col h-full">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-sm font-bold text-white">{p.title}</h3>
          <span className="text-[10px] shrink-0 font-mono" style={{ color: '#45475a' }}>{p.period}</span>
        </div>
        <p className="text-[11px] mb-3" style={{ color: p.color }}>{p.subtitle}</p>
        <ul className="space-y-1 mb-4 flex-1">
          {p.bullets.map((b, i) => (
            <li key={i} className="flex gap-2 text-[11px] leading-relaxed" style={{ color: '#6c7086' }}>
              <span className="mt-[5px] w-1 h-1 rounded-full shrink-0" style={{ background: p.color }} />
              {b}
            </li>
          ))}
        </ul>
        {/* Tech tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {p.tech.map(t => (
            <span key={t} className="px-2 py-0.5 rounded-md text-[10px] font-mono"
              style={{ background: `${p.color}12`, color: p.color, border: `1px solid ${p.color}25` }}>
              {t}
            </span>
          ))}
        </div>
        {/* GitHub links */}
        {p.github && (
          <div className="flex flex-wrap gap-2 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <a href={p.github} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all hover:scale-105"
              style={{ background: `${p.color}12`, color: p.color, border: `1px solid ${p.color}30` }}>
              <Code2 size={11} />
              {extras ? 'Resume AI' : 'View on GitHub'}
            </a>
            {extras?.map(e => (
              <a key={e.label} href={e.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all hover:scale-105"
                style={{ background: `${p.color}12`, color: p.color, border: `1px solid ${p.color}30` }}>
                <Code2 size={11} />
                {e.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main PortfolioPage ─────────────────────────────────────────────────────────
export default function PortfolioPage({ onBack }: { onBack: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const role = useTypewriter([
    'Senior Software Engineer',
    'Kafka & Microservices Expert',
    'Cloud-Native Builder',
    'GenAI Enthusiast',
    'Open Source Contributor',
  ]);

  useEffect(() => {
    const handler = () => { setScrolled(window.scrollY > 80); setShowTop(window.scrollY > 400); };
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="pf-root">

      {/* ── Sticky nav ───────────────────────────────────────────────────────── */}
      <nav className={`pf-nav ${scrolled ? 'pf-nav-visible' : ''}`}>
        <div className="pf-nav-inner">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
              style={{ overflow: 'hidden', padding: 0 }}><img src="/avatar.jpg" alt="PC" className="w-full h-full object-cover object-top" /></div>
            <span className="text-sm font-semibold text-white">{RESUME.name}</span>
          </div>
          <div className="flex items-center gap-1">
            {['experience', 'skills', 'projects', 'education', 'contact'].map(s => (
              <button key={s} onClick={() => scrollTo(s)}
                className="px-3 py-1 rounded-lg text-xs capitalize transition-all"
                style={{ color: '#6c7086' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#fff'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#6c7086'}>
                {s}
              </button>
            ))}
            <button onClick={onBack}
              className="ml-2 flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs transition-all"
              style={{ background: 'rgba(79,142,247,0.1)', color: '#4f8ef7', border: '1px solid rgba(79,142,247,0.2)' }}>
              <ArrowLeft size={11} /> Back
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section id="hero" className="pf-hero">
        {/* Mesh background */}
        <div className="pf-hero-mesh" />

        {/* Floating orbs */}
        <div className="absolute w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(79,142,247,0.08) 0%, transparent 70%)', top: '15%', left: '10%', animation: 'pfOrb 8s ease-in-out infinite' }} />
        <div className="absolute w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)', bottom: '20%', right: '12%', animation: 'pfOrb 10s ease-in-out infinite reverse' }} />

        <div className="relative flex flex-col items-center text-center px-6 max-w-3xl mx-auto">
          {/* Avatar */}
          <div className="w-28 h-28 rounded-3xl overflow-hidden mb-6 pf-hero-avatar"
            style={{
              boxShadow: '0 16px 48px rgba(79,142,247,0.35), 0 0 0 3px rgba(79,142,247,0.3)',
            }}>
            <img src="/avatar.jpg" alt="Prakash Choudhary"
              className="w-full h-full object-cover object-top" />
          </div>

          {/* Name */}
          <h1 className="pf-hero-name">{RESUME.name}</h1>

          {/* Typewriter role */}
          <div className="h-8 flex items-center justify-center mb-4">
            <span className="text-lg font-medium" style={{ color: '#4f8ef7' }}>
              {role}<span className="pf-cursor">|</span>
            </span>
          </div>

          {/* Summary */}
          <p className="text-sm leading-relaxed mb-8 max-w-xl" style={{ color: '#6c7086' }}>
            {RESUME.summary}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 w-full max-w-2xl">
            {RESUME.stats.map(s => (
              <div key={s.label} className="pf-stat-card">
                <div className="text-2xl font-black mb-0.5" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[11px]" style={{ color: '#45475a' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Tech focus */}
          <p className="text-xs mb-8 tracking-wide" style={{ color: '#3d3f55' }}>{RESUME.focus}</p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button onClick={() => scrollTo('experience')}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #4f8ef7, #8b5cf6)', boxShadow: '0 4px 20px rgba(79,142,247,0.35)' }}>
              View Experience ↓
            </button>
            <a href={`mailto:${RESUME.email}`}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105"
              style={{ background: 'rgba(255,255,255,0.04)', color: '#cdd6f4', border: '1px solid rgba(255,255,255,0.1)' }}>
              Contact Me →
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 pf-scroll-hint">
          <span className="text-[10px] tracking-widest uppercase" style={{ color: '#2a2b3d' }}>scroll</span>
          <div className="w-px h-8" style={{ background: 'linear-gradient(to bottom, #2a2b3d, transparent)' }} />
        </div>
      </section>

      {/* ── Experience ────────────────────────────────────────────────────────── */}
      <Section id="experience" className="pf-content-section">
        <div className="pf-section-header">
          <span className="pf-section-tag">Career</span>
          <h2 className="pf-section-title">Work Experience</h2>
          <p className="pf-section-sub">9+ years building high-scale systems across multiple industries</p>
        </div>

        <div className="pf-timeline">
          {/* Vertical line */}
          <div className="pf-timeline-line" />
          {RESUME.experience.map((exp, i) => (
            <TimelineEntry key={exp.company} exp={exp} idx={i} />
          ))}
        </div>
      </Section>

      {/* ── Skills ───────────────────────────────────────────────────────────── */}
      <Section id="skills" className="pf-content-section pf-alt-bg">
        <div className="pf-section-header">
          <span className="pf-section-tag">Expertise</span>
          <h2 className="pf-section-title">Skills & Technologies</h2>
          <p className="pf-section-sub">Full-stack engineering with cloud-native and AI capabilities</p>
        </div>

        <div className="space-y-5 max-w-3xl mx-auto">
          {Object.entries(RESUME.skills).map(([category, { color, items }]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>{category}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {items.map(skill => (
                  <span key={skill}
                    className="px-3 py-1 rounded-full text-xs font-medium transition-all hover:scale-105 cursor-default"
                    style={{ background: `${color}12`, color, border: `1px solid ${color}28` }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Projects ─────────────────────────────────────────────────────────── */}
      <Section id="projects" className="pf-content-section">
        <div className="pf-section-header">
          <span className="pf-section-tag">Portfolio</span>
          <h2 className="pf-section-title">Projects</h2>
          <p className="pf-section-sub">AI applications and core engineering systems</p>
        </div>

        <div className="pf-projects-grid">
          {RESUME.projects.map((p, i) => (
            <ProjectCard key={p.title} p={p} idx={i} />
          ))}
        </div>
      </Section>

      {/* ── Open Source ───────────────────────────────────────────────────────── */}
      <Section id="opensource" className="pf-content-section pf-alt-bg">
        <div className="pf-section-header">
          <span className="pf-section-tag">Community</span>
          <h2 className="pf-section-title">Open Source Contributions</h2>
        </div>
        <div className="space-y-3 max-w-2xl mx-auto">
          {RESUME.openSource.map(o => (
            <div key={o.project} className="flex gap-4 p-4 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(79,142,247,0.1)', border: '1px solid rgba(79,142,247,0.2)' }}>
                <Code2 size={14} color="#4f8ef7" />
              </div>
              <div>
                <span className="text-xs font-bold" style={{ color: '#4f8ef7' }}>{o.project}</span>
                <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: '#6c7086' }}>{o.contribution}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Education & Certs ─────────────────────────────────────────────────── */}
      <Section id="education" className="pf-content-section">
        <div className="pf-section-header">
          <span className="pf-section-tag">Background</span>
          <h2 className="pf-section-title">Education & Certifications</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {/* Education */}
          <div className="p-5 rounded-2xl relative"
            style={{ background: 'rgba(79,142,247,0.04)', border: '1px solid rgba(79,142,247,0.15)' }}>
            <div className="absolute top-0 left-0 right-0 h-px rounded-t-2xl"
              style={{ background: 'linear-gradient(90deg, #4f8ef7, transparent)' }} />
            <span className="text-[10px] tracking-widest uppercase mb-3 block" style={{ color: '#4f8ef7' }}>Education</span>
            <h3 className="text-sm font-bold text-white mb-1">{RESUME.education.degree}</h3>
            <p className="text-xs mb-1" style={{ color: '#8b5cf6' }}>{RESUME.education.institution}</p>
            <p className="text-[11px]" style={{ color: '#45475a' }}>{RESUME.education.location}</p>
            <p className="text-[11px] mt-1 font-mono" style={{ color: '#3d3f55' }}>{RESUME.education.period}</p>
          </div>
          {/* Certifications */}
          {RESUME.certifications.map(c => (
            <div key={c.name} className="p-5 rounded-2xl relative"
              style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)' }}>
              <div className="absolute top-0 left-0 right-0 h-px rounded-t-2xl"
                style={{ background: 'linear-gradient(90deg, #f59e0b, transparent)' }} />
              <span className="text-[10px] tracking-widest uppercase mb-3 block" style={{ color: '#f59e0b' }}>Certification</span>
              <h3 className="text-sm font-bold text-white mb-1">{c.name}</h3>
              <p className="text-xs" style={{ color: '#f59e0b' }}>{c.issuer}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Contact ───────────────────────────────────────────────────────────── */}
      <section id="contact" className="pf-contact-section">
        <div className="pf-contact-glow" />
        <div className="relative text-center max-w-lg mx-auto px-6">
          <span className="pf-section-tag">Let's Talk</span>
          <h2 className="text-3xl font-black text-white mt-3 mb-2">Open to Opportunities</h2>
          <p className="text-sm mb-8" style={{ color: '#6c7086' }}>
            Available for senior engineering roles, consulting, and interesting problems worth solving.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={`mailto:${RESUME.email}`}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #4f8ef7, #8b5cf6)', boxShadow: '0 4px 20px rgba(79,142,247,0.3)' }}>
              <Mail size={14} /> Send Email
            </a>
            <a href={RESUME.linkedin} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-105"
              style={{ background: 'rgba(255,255,255,0.04)', color: '#cdd6f4', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Link2 size={14} /> LinkedIn
            </a>
          </div>

          {/* Back to tool */}
          <button onClick={onBack}
            className="mt-10 flex items-center gap-2 mx-auto text-xs transition-all hover:opacity-100"
            style={{ color: '#3d3f55', opacity: 0.6 }}>
            <ArrowLeft size={11} />
            Back to DiffWise Tool
          </button>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="text-center py-6"
        style={{ borderTop: '1px solid rgba(255,255,255,0.04)', color: '#2a2b3d', fontSize: 11 }}>
        © 2025 Prakash Choudhary · Built with React & TypeScript
      </footer>

      {/* ── Back to top ──────────────────────────────────────────────────────── */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110 z-30"
          style={{ background: 'linear-gradient(135deg, #4f8ef7, #8b5cf6)', boxShadow: '0 4px 16px rgba(79,142,247,0.4)' }}>
          <ChevronUp size={16} color="white" />
        </button>
      )}
    </div>
  );
}
