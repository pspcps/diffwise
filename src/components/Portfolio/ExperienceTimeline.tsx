import { useEffect, useRef } from "react";
import { RESUME } from "../../data/resumeData";
export default function ExperienceTimeline() {
  const timeline = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const list = timeline.current;
    if (!list) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const cards = Array.from(
      list.querySelectorAll<HTMLElement>(".timeline-entry"),
    );
    let observer: IntersectionObserver | undefined;
    const setup = () => {
      observer?.disconnect();
      if (motion.matches || !("IntersectionObserver" in window)) {
        list.classList.remove("timeline-ready");
        return;
      }
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries)
            if (entry.isIntersecting) {
              entry.target.classList.add("timeline-visible");
              observer?.unobserve(entry.target);
            }
        },
        {
          root: list.closest(".portfolio-space"),
          threshold: 0.12,
          rootMargin: "0px 0px -25px 0px",
        },
      );
      cards.forEach((card) => observer?.observe(card));
      list.classList.add("timeline-ready");
    };
    setup();
    motion.addEventListener("change", setup);
    return () => {
      observer?.disconnect();
      motion.removeEventListener("change", setup);
    };
  }, []);
  return (
    <ol
      ref={timeline}
      className="experience-timeline"
      aria-label="Career timeline"
    >
      {RESUME.experience.map((e) => (
        <li key={e.company} className="timeline-entry">
          <span className="timeline-node" aria-hidden="true" />
          <article className="timeline-card">
            <header>
              <div>
                <h3>{e.company}</h3>
                <p className="timeline-role">{e.role}</p>
              </div>
              <div className="timeline-meta">
                <p className="timeline-period">{e.period}</p>
                {e.current && (
                  <span className="timeline-current">
                    <span /> Current role
                  </span>
                )}
              </div>
            </header>
            <ul>
              {e.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </article>
        </li>
      ))}
    </ol>
  );
}
