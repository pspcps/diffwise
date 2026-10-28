import React, { useState, useEffect, useRef } from 'react';
import { RESUME } from '../data/resumeData';
import {
  Mail,
  Link2,
  ArrowLeft,
  ChevronUp,
  Code2,
  Sparkles,
  Cpu,
  BookOpen,
  Briefcase,
  Volume2,
  VolumeX,
  Palette,
} from 'lucide-react';
import { Projects3DSection } from '../components/Portfolio/Projects3DSection';
import {
  LANGUAGE_THEMES,
  type LanguageThemeKey,
} from '../components/Portfolio/LanguageThemes';
import { soundFX } from '../components/Portfolio/SoundFX';

// ── Scroll-reveal hook ────────────────────────────────────────────────────────
function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVisible(true);
      },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// ── Typewriter hook ───────────────────────────────────────────────────────────
function useTypewriter(words: string[], speed = 80, pause = 1800) {
  const [display, setDisplay] = useState('');
  const [wordIdx, setWordIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = words[wordIdx];
    const delay = deleting ? speed / 2 : charIdx === word.length ? pause : speed;
    const t = setTimeout(() => {
      if (!deleting && charIdx < word.length) {
        setDisplay(word.slice(0, charIdx + 1));
        setCharIdx(c => c + 1);
      } else if (!deleting && charIdx === word.length) {
        setDeleting(true);
      } else if (deleting && charIdx > 0) {
        setDisplay(word.slice(0, charIdx - 1));
        setCharIdx(c => c - 1);
      } else {
        setDeleting(false);
        setWordIdx(i => (i + 1) % words.length);
      }
    }, delay);
    return () => clearTimeout(t);
  }, [charIdx, deleting, wordIdx, words, speed, pause]);

  return display;
}

// ── Section wrapper with fade-up animation ────────────────────────────────────
function Section({
  children,
  id,
  className = '',
}: {
  children: React.ReactNode;
  id: string;
  className?: string;
}) {
  const { ref, visible } = useInView();
  return (
    <section
      id={id}
      ref={ref}
      className={`py-20 px-6 max-w-6xl mx-auto transition-all duration-700 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${className}`}
    >
      {children}
    </section>
  );
}

// ── Timeline Entry ─────────────────────────────────────────────────────────────
function TimelineEntry({
  exp,
  idx,
}: {
  exp: (typeof RESUME.experience)[0];
  idx: number;
}) {
  const { ref, visible } = useInView(0.1);
  return (
    <div
      ref={ref}
      className={`relative pl-8 md:pl-10 pb-12 transition-all duration-500 ${
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-6'
      }`}
      style={{ transitionDelay: `${idx * 80}ms` }}
    >
      {/* Timeline Node Dot */}
      <div
        className="absolute left-[-7px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-[#030712] z-10"
        style={{
          backgroundColor: exp.color,
          boxShadow: `0 0 14px ${exp.color}`,
        }}
      />

      {/* Card */}
      <div className="relative rounded-3xl bg-[#0c1024]/80 border border-white/10 p-6 md:p-7 shadow-xl hover:border-white/20 transition-all group">
        {/* Card top accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-0.5 rounded-t-3xl"
          style={{ background: `linear-gradient(90deg, ${exp.color}, transparent)` }}
        />

        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-bold text-white group-hover:text-[#89b4fa] transition-colors">
              {exp.company}
            </h3>
            <span
              className="inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: `${exp.color}15`,
                color: exp.color,
                border: `1px solid ${exp.color}35`,
              }}
            >
              {exp.role}
            </span>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xs px-3 py-1 rounded-xl font-mono bg-white/5 text-[#9399b2] border border-white/5">
              {exp.period}
            </span>
            {exp.current && (
              <div className="flex items-center justify-end gap-1.5 mt-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping" />
                <span className="text-[11px] font-bold text-[#10b981]">Active Role</span>
              </div>
            )}
          </div>
        </div>

        <ul className="space-y-2.5">
          {exp.bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2.5 text-xs text-[#a6adc8] leading-relaxed">
              <span
                className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: exp.color }}
              />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ── Main PortfolioPage Component ──────────────────────────────────────────────
export default function PortfolioPage({ onBack }: { onBack: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [soundActive, setSoundActive] = useState(true);
  const [currentLang, setCurrentLang] = useState<LanguageThemeKey>('nodejs');

  const theme = LANGUAGE_THEMES[currentLang];

  const role = useTypewriter([
    'Senior Software Engineer (9+ Years)',
    'Kafka Distributed Event Streaming Architect',
    'Full-Stack Developer (Node.js, TypeScript & React)',
    'AI Engineer & GenAI Systems Pipeline Builder',
    'High-Scale Microservices & Cloud-Native Lead',
  ]);

  useEffect(() => {
    const handler = () => {
      setScrolled(window.scrollY > 80);
      setShowTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const scrollTo = (id: string) => {
    soundFX.playHoverBlip();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSelectLanguage = (langKey: LanguageThemeKey) => {
    soundFX.playKeyClick();
    setCurrentLang(langKey);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-[#cdd6f4] font-sans selection:bg-[#89b4fa]/30 overflow-x-hidden">
      {/* ── Sticky Modern Navigation Bar ──────────────────────────────────────── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 ${
          scrolled
            ? 'py-3 bg-[#030712]/92 backdrop-blur-xl border-b border-white/10 shadow-2xl'
            : 'py-5 bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Brand & Avatar */}
          <div
            onClick={() => scrollTo('hero')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div
              className="w-8 h-8 rounded-xl overflow-hidden ring-2 transition-all"
              style={{ borderColor: theme.primaryHex }}
            >
              <img
                src="/avatar.jpg"
                alt="Prakash Choudhary"
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div>
              <span className="text-sm font-bold text-white transition-colors" style={{ color: theme.primaryHex }}>
                {RESUME.name}
              </span>
              <span
                className="hidden sm:inline-block ml-2 text-[10px] px-2 py-0.5 rounded-full font-mono border"
                style={{
                  backgroundColor: `${theme.primaryHex}18`,
                  color: theme.primaryHex,
                  borderColor: `${theme.primaryHex}35`,
                }}
              >
                9+ Yrs Lead SDE
              </span>
            </div>
          </div>

          {/* Navigation Links & Language Theme Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Nav anchors */}
            <div className="hidden lg:flex items-center gap-1">
              {[
                { id: 'experience', label: 'Experience' },
                { id: 'projects', label: 'Projects' },
                { id: 'skills', label: 'Tech Stack' },
                { id: 'education', label: 'Credentials' },
                { id: 'contact', label: 'Contact' },
              ].map(sec => (
                <button
                  key={sec.id}
                  onClick={() => scrollTo(sec.id)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#9399b2] hover:text-white hover:bg-white/5 transition-all"
                >
                  {sec.label}
                </button>
              ))}
            </div>

            {/* Language Theme Selector in Nav */}
            <div className="flex items-center gap-1 bg-[#0a0f24] p-1 rounded-2xl border border-white/10 shadow-inner">
              <span className="text-[10px] font-mono text-[#6c7086] px-1.5 hidden md:inline">
                <Palette size={12} className="inline mr-1" />
                Lang:
              </span>
              {(['nodejs', 'python', 'typescript', 'golang', 'rust'] as LanguageThemeKey[]).map(key => {
                const item = LANGUAGE_THEMES[key];
                const active = currentLang === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleSelectLanguage(key)}
                    title={`Switch portfolio theme to ${item.name}`}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold transition-all ${
                      active
                        ? 'shadow-lg scale-105'
                        : 'text-[#9399b2] hover:text-white hover:bg-white/5 opacity-70 hover:opacity-100'
                    }`}
                    style={
                      active
                        ? {
                            backgroundColor: `${item.primaryHex}25`,
                            color: item.primaryHex,
                            border: `1px solid ${item.primaryHex}60`,
                          }
                        : {}
                    }
                  >
                    <span>{item.iconSymbol}</span>
                    <span className="ml-1 hidden sm:inline">{item.shortName}</span>
                  </button>
                );
              })}
            </div>

            {/* Sound FX Toggle */}
            <button
              onClick={() => {
                setSoundActive(!soundActive);
                soundFX.enabled = !soundActive;
              }}
              title={soundActive ? 'Mute Audio FX' : 'Enable Audio FX'}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              style={{ color: theme.primaryHex }}
            >
              {soundActive ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>

            {/* Back to DevBench */}
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#334155] to-[#1e293b] hover:opacity-90 border border-white/10 transition-all hover:scale-105"
            >
              <ArrowLeft size={12} />
              <span className="hidden sm:inline">Tools</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero Section with 3D Architecture Nexus Centerpiece ──────────────── */}
      <section id="hero" className="relative pt-28 pb-16 px-6 max-w-6xl mx-auto">
        {/* Dynamic Ambient Background Glows matching active Language Theme */}
        <div
          className="absolute top-12 left-1/4 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none opacity-25 transition-all duration-700"
          style={{ background: theme.primaryHex }}
        />
        <div
          className="absolute top-36 right-1/4 w-[400px] h-[400px] rounded-full blur-[130px] pointer-events-none opacity-20 transition-all duration-700"
          style={{ background: theme.secondaryHex }}
        />

        <div className="flex flex-col items-center text-center space-y-6">
          {/* Availability Badge */}
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold animate-in fade-in duration-500"
            style={{
              backgroundColor: `${theme.primaryHex}12`,
              borderColor: `${theme.primaryHex}40`,
              color: theme.primaryHex,
            }}
          >
            <span
              className="w-2 h-2 rounded-full animate-ping"
              style={{ backgroundColor: theme.primaryHex }}
            />
            <span>Open for Principal / Senior Engineering Roles &amp; High-Scale Architectural Consulting</span>
          </div>

          {/* Name & Title */}
          <div className="space-y-2 max-w-3xl">
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white">
              Hi, I&apos;m{' '}
              <span
                className="bg-clip-text text-transparent bg-gradient-to-r transition-all duration-500"
                style={{
                  backgroundImage: `linear-gradient(90deg, ${theme.primaryHex}, #ffffff, ${theme.secondaryHex})`,
                }}
              >
                {RESUME.name}
              </span>
            </h1>
            <div className="h-9 flex items-center justify-center">
              <span className="text-lg sm:text-xl font-mono font-bold" style={{ color: theme.primaryHex }}>
                {role}
                <span className="animate-pulse">_</span>
              </span>
            </div>
          </div>

          {/* Executive Summary */}
          <p className="max-w-2xl text-sm sm:text-base text-[#9399b2] leading-relaxed">
            {RESUME.summary}
          </p>

          {/* Language Theme Description Bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <span className="text-xs font-mono text-[#6c7086]">Active Tech Mode:</span>
            <span
              className="px-3 py-1 rounded-xl text-xs font-bold font-mono border"
              style={{
                backgroundColor: `${theme.primaryHex}15`,
                color: theme.primaryHex,
                borderColor: `${theme.primaryHex}35`,
              }}
            >
              {theme.iconSymbol} {theme.name}
            </span>
            <span className="text-xs text-[#9399b2] hidden sm:inline">• {theme.tagline}</span>
          </div>

          {/* Key Impact Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-3xl pt-2">
            {RESUME.stats.map(s => (
              <div
                key={s.label}
                className="p-4 rounded-2xl bg-[#0c1024]/90 border border-white/10 hover:border-white/20 transition-all hover:scale-105 shadow-xl text-center"
              >
                <div className="text-2xl sm:text-3xl font-black mb-1" style={{ color: s.color }}>
                  {s.value}
                </div>
                <div className="text-xs font-medium text-[#6c7086]">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Hero Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
            <button
              onClick={() => scrollTo('projects')}
              className="px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold text-[#060814] shadow-xl transition-all hover:scale-105 active:scale-95"
              style={{
                backgroundColor: theme.primaryHex,
                boxShadow: `0 10px 25px ${theme.primaryHex}40`,
              }}
            >
              Explore Featured Projects ↓
            </button>
            <button
              onClick={() => scrollTo('experience')}
              className="px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold text-white bg-[#141834] hover:bg-[#1d234d] border border-white/10 transition-all hover:scale-105 active:scale-95"
            >
              View Work Experience
            </button>
            <a
              href={`mailto:${RESUME.email}`}
              className="px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold text-[#cdd6f4] hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:scale-105"
            >
              Contact Prakash →
            </a>
          </div>
        </div>
      </section>

      {/* ── Work Experience Timeline Section ───────────────────────────────────── */}
      <Section id="experience" className="bg-[#060818]/70 rounded-3xl border border-white/5 my-8">
        <div className="text-center space-y-3 mb-10">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider"
            style={{
              backgroundColor: `${theme.primaryHex}15`,
              color: theme.primaryHex,
              borderColor: `${theme.primaryHex}35`,
            }}
          >
            <Briefcase size={12} />
            <span>9+ Years High-Scale Journey</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Professional Experience
          </h2>
          <p className="text-sm text-[#9399b2] max-w-xl mx-auto">
            Designing event-driven streaming architectures, optimizing PostgreSQL queries, and delivering high-scale cloud microservices across 9+ years.
          </p>
        </div>

        {/* Detailed Timeline Entries */}
        <div className="relative border-l-2 border-[#1e2342] ml-4 md:ml-12 max-w-4xl mx-auto">
          {RESUME.experience.map((exp, idx) => (
            <TimelineEntry key={exp.company} exp={exp} idx={idx} />
          ))}
        </div>
      </Section>

      {/* ── Projects Showcase Section ───────────────────────────────────────────── */}
      <Section id="projects">
        <div className="text-center space-y-3 mb-12">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider"
            style={{
              backgroundColor: `${theme.primaryHex}15`,
              color: theme.primaryHex,
              borderColor: `${theme.primaryHex}35`,
            }}
          >
            <Sparkles size={12} />
            <span>Featured Engineering Showcase</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Featured Projects &amp; Systems
          </h2>
          <p className="text-sm text-[#9399b2] max-w-xl mx-auto">
            Interactive project gallery. Click any project card to inspect architectural highlights, system designs, and live GitHub repositories.
          </p>
        </div>

        <Projects3DSection />
      </Section>

      {/* ── Skills & Technical Ecosystem Section ──────────────────────────────── */}
      <Section id="skills">
        <div className="text-center space-y-3 mb-12">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider"
            style={{
              backgroundColor: `${theme.primaryHex}15`,
              color: theme.primaryHex,
              borderColor: `${theme.primaryHex}35`,
            }}
          >
            <Cpu size={12} />
            <span>Technical Mastery</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Skills &amp; Technology Ecosystem
          </h2>
          <p className="text-sm text-[#9399b2] max-w-xl mx-auto">
            Specialized in Kafka distributed streaming, microservices, cloud platforms, and generative AI pipelines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {Object.entries(RESUME.skills).map(([category, { color, items }]) => (
            <div
              key={category}
              className="p-6 rounded-3xl bg-[#0c1024]/90 border border-white/10 hover:border-white/20 transition-all hover:scale-[1.01] shadow-xl space-y-4"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
                />
                <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color }}>
                  {category}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {items.map(skill => (
                  <span
                    key={skill}
                    className="px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all hover:scale-105 cursor-default bg-[#151a38] text-[#cdd6f4] border border-white/5 hover:border-white/20"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Education & Open Source Contributions ─────────────────────────────── */}
      <Section id="education">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Education & Certs */}
          <div className="p-8 rounded-3xl bg-[#0c1024]/90 border border-white/10 shadow-xl space-y-6">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#4f8ef7]">
              <BookOpen size={14} />
              <span>Education &amp; Credentials</span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">{RESUME.education.degree}</h3>
              <p className="text-sm font-medium" style={{ color: theme.primaryHex }}>
                {RESUME.education.institution}
              </p>
              <p className="text-xs text-[#6c7086] mt-1">{RESUME.education.period} • {RESUME.education.location}</p>
            </div>

            <div className="pt-4 border-t border-white/10 space-y-3">
              <span className="text-xs font-bold text-[#f59e0b] uppercase tracking-wider block">
                Professional Certifications
              </span>
              {RESUME.certifications.map(c => (
                <div
                  key={c.name}
                  className="p-3.5 rounded-2xl bg-[#141834] border border-[#f59e0b]/20 flex items-center justify-between"
                >
                  <span className="text-xs font-bold text-white">{c.name}</span>
                  <span className="text-[10px] font-mono text-[#f59e0b] px-2 py-0.5 rounded-md bg-[#f59e0b]/15">
                    {c.issuer}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Open Source */}
          <div className="p-8 rounded-3xl bg-[#0c1024]/90 border border-white/10 shadow-xl space-y-6">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#a6e3a1]">
              <Code2 size={14} />
              <span>Open Source Contributions</span>
            </div>

            <div className="space-y-4">
              {RESUME.openSource.map(o => (
                <div
                  key={o.project}
                  className="p-4 rounded-2xl bg-[#141834] border border-white/5 space-y-1 hover:border-white/15 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#89b4fa]">{o.project}</span>
                    <Code2 size={12} className="text-[#6c7086]" />
                  </div>
                  <p className="text-xs text-[#9399b2] leading-relaxed">{o.contribution}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ── Contact Section ───────────────────────────────────────────────────── */}
      <section id="contact" className="py-24 px-6 text-center max-w-3xl mx-auto relative">
        <div className="p-10 md:p-14 rounded-3xl bg-gradient-to-b from-[#0c1028] to-[#060814] border border-white/15 shadow-2xl space-y-6 relative overflow-hidden">
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider"
            style={{
              backgroundColor: `${theme.primaryHex}15`,
              color: theme.primaryHex,
              borderColor: `${theme.primaryHex}35`,
            }}
          >
            <Sparkles size={12} />
            <span>Connect &amp; Collaborate</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Let&apos;s Build Something High-Scale
          </h2>

          <p className="text-sm text-[#9399b2] max-w-lg mx-auto leading-relaxed">
            Whether you are scaling distributed microservices, architecting Kafka streaming pipelines, or designing agentic AI systems, feel free to reach out.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <a
              href={`mailto:${RESUME.email}`}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold text-[#060814] transition-all hover:scale-105"
              style={{
                backgroundColor: theme.primaryHex,
                boxShadow: `0 8px 20px ${theme.primaryHex}35`,
              }}
            >
              <Mail size={16} />
              <span>{RESUME.email}</span>
            </a>

            <a
              href={RESUME.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold text-white bg-[#141834] hover:bg-[#1f2652] border border-white/10 transition-all hover:scale-105"
            >
              <Link2 size={16} />
              <span>LinkedIn Profile</span>
            </a>
          </div>

          <div className="pt-8">
            <button
              onClick={onBack}
              className="text-xs text-[#6c7086] hover:text-[#89b4fa] transition-colors flex items-center gap-1.5 mx-auto font-medium"
            >
              <ArrowLeft size={12} />
              <span>Return to PSDevTool Developer Workspace</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="text-center py-8 border-t border-white/5 text-xs text-[#6c7086] font-mono">
        © 2025 Prakash Choudhary • Senior Software Engineer &amp; Systems Architect
      </footer>

      {/* ── Back to Top Floating Button ───────────────────────────────────────── */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 w-11 h-11 rounded-2xl text-[#060814] flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all z-40"
          style={{
            backgroundColor: theme.primaryHex,
            boxShadow: `0 10px 25px ${theme.primaryHex}50`,
          }}
        >
          <ChevronUp size={20} />
        </button>
      )}
    </div>
  );
}
