import { resolveLocation } from "../../seo/routes";
import { useEffect, useRef } from "react";
import { useMotion } from "./MotionContext";
import { useLanguageTheme } from "../Guide/LanguageThemeContext";
import { LANGUAGE_THEMES } from "../Portfolio/LanguageThemes";
const CARD_SELECTOR =
  ".tool-card,.project-space-card,.skill-space-card,.timeline-card,.portfolio-stats>div";
const REVEAL_SELECTOR =
  ".portfolio-section:not(#experience),.portfolio-stats>div,.builder-banner,.tool-section";
export default function MotionLayer() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const { enabled } = useMotion();
  const { theme } = useLanguageTheme();
  useEffect(() => {
    if (!enabled) return;
    const root = document.getElementById("root");
    if (!root) return;
    const seen = new WeakSet<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            entry.target.classList.remove("motion-reveal-pending");
            entry.target.classList.add("motion-revealed");
            observer.unobserve(entry.target);
          }
      },
      { threshold: 0.06 },
    );
    const scan = () => {
      root.querySelectorAll(REVEAL_SELECTOR).forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        el.classList.add("motion-reveal-pending");
        observer.observe(el);
      });
    };
    scan();
    const mutation = new MutationObserver(scan);
    mutation.observe(root, { childList: true });
    return () => {
      observer.disconnect();
      mutation.disconnect();
      root
        .querySelectorAll(".motion-reveal-pending")
        .forEach((el) => el.classList.remove("motion-reveal-pending"));
    };
  }, [enabled]);
  useEffect(() => {
    if (!enabled || !canvas.current) return;
    const node = canvas.current;
    const ctx = node.getContext("2d");
    if (!ctx) return;
    const fine = window.matchMedia("(pointer:fine)").matches;
    const color = LANGUAGE_THEMES[theme].primaryHex;
    let width = innerWidth,
      height = innerHeight,
      frame = 0,
      last = performance.now(),
      clock = 0;
    type Particle = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      size: number;
    };
    const particles: Particle[] = [];
    const rings: { x: number; y: number; life: number }[] = [];
    const resize = () => {
      width = innerWidth;
      height = innerHeight;
      const dpr = Math.min(devicePixelRatio, 1.5);
      node.width = width * dpr;
      node.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    let lastEmit = 0;
    let activeCard: HTMLElement | null = null;
    const isEditing = (target: EventTarget | null) =>
      target instanceof Element &&
      Boolean(
        target.closest(
          'input,textarea,select,.monaco-editor,[contenteditable="true"]',
        ),
      );
    const isPresentation = () => ["home", "portfolio"].includes(resolveLocation(window.location).page.id);
    const move = (e: PointerEvent) => {
      if (!isPresentation()) return;
      if (!fine || e.pointerType === "touch") return;
      const card =
        e.target instanceof Element
          ? e.target.closest<HTMLElement>(CARD_SELECTOR)
          : null;
      if (activeCard && activeCard !== card) {
        activeCard.style.setProperty("--motion-rx", "0deg");
        activeCard.style.setProperty("--motion-ry", "0deg");
      }
      activeCard = card;
      if (card) {
        const r = card.getBoundingClientRect();
        const x = e.clientX - r.left,
          y = e.clientY - r.top;
        card.style.setProperty("--glow-x", `${x}px`);
        card.style.setProperty("--glow-y", `${y}px`);
        card.style.setProperty(
          "--motion-rx",
          `${(y / r.height - 0.5) * -3}deg`,
        );
        card.style.setProperty("--motion-ry", `${(x / r.width - 0.5) * 3}deg`);
      }
      if (
        isEditing(e.target) ||
        performance.now() - lastEmit < 35 ||
        particles.length > 38
      )
        return;
      lastEmit = performance.now();
      particles.push({
        x: e.clientX,
        y: e.clientY,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -0.3,
        life: 0.6,
        size: 1.3,
      });
    };
    const click = (e: PointerEvent) => {
      if (!isPresentation() || isEditing(e.target)) return;
      rings.push({ x: e.clientX, y: e.clientY, life: 1 });
      if (rings.length > 4) rings.shift();
      for (let i = 0; i < 10 && particles.length < 60; i++) {
        const angle = (i / 10) * Math.PI * 2;
        particles.push({
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(angle) * 1.6,
          vy: Math.sin(angle) * 1.6,
          life: 1,
          size: 1.8,
        });
      }
    };
    const draw = (now: number) => {
      frame = 0;
      if (!isPresentation() || document.hidden) return;
      frame = requestAnimationFrame(draw);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (document.hidden) return;
      clock += dt;
      ctx.clearRect(0, 0, width, height);
      // Slow ambient points appear only on presentation pages, away from editor work.
      if (isPresentation())
        for (let i = 0; i < (fine ? 18 : 8); i++) {
          const x =
            (((i * 173 + 71) % 997) / 997) * width +
            Math.sin(clock * 0.15 + i) * 12;
          const y =
            (((i * 263 + 89) % 991) / 991) * height +
            Math.cos(clock * 0.12 + i) * 10;
          ctx.globalAlpha = 0.11 + Math.sin(clock + i) * 0.035;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(x, y, i % 3 === 0 ? 1.5 : 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt * 1.5;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt * 60;
        p.y += p.vy * dt * 60;
        ctx.globalAlpha = p.life * 0.6;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i];
        r.life -= dt * 2;
        if (r.life <= 0) {
          rings.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = r.life * 0.25;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(r.x, r.y, 5 + (1 - r.life) * 35, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };
    const wake = () => {
      cancelAnimationFrame(frame);
      ctx.clearRect(0, 0, width, height);
      particles.length = 0; rings.length = 0;
      if (isPresentation() && !document.hidden) { last = performance.now(); frame = requestAnimationFrame(draw); }
    };
    wake();
    window.addEventListener('hashchange', wake);
    window.addEventListener('popstate', wake);
    document.addEventListener('visibilitychange', wake);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", click, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", wake);
      window.removeEventListener("popstate", wake);
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", click);
      ctx.clearRect(0, 0, width, height);
      if (activeCard) {
        activeCard.style.setProperty("--motion-rx", "0deg");
        activeCard.style.setProperty("--motion-ry", "0deg");
      }
    };
  }, [enabled, theme]);
  return enabled ? (
    <canvas className="site-motion-canvas" ref={canvas} aria-hidden="true" />
  ) : null;
}
