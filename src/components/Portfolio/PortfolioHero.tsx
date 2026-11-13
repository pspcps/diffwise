import { useCareerDuration } from "../../hooks/useCareerDuration";
import RotatingRole from "./RotatingRole";
import {
  ArrowUpRight,
  ArrowRight,
  Download,
  GitPullRequest,
  Mail,
} from "lucide-react";
import { RESUME } from "../../data/resumeData";
import { LANGUAGE_THEMES } from "./LanguageThemes";
import { useLanguageTheme } from "../Guide/LanguageThemeContext";
import TechnologyIcon from "../Common/TechnologyIcon";
import { tiltCard, resetTilt } from "../Spatial/cardMotion";
import { downloadProfile } from "../../utils/downloadProfile";
export default function PortfolioHero({
  onExplore,
}: {
  onExplore: () => void;
}) {
  const { theme, change } = useLanguageTheme();
  const experience = useCareerDuration();
  return (
    <section className="atelier-hero" aria-label="Meet Prakash Choudhary">
      <div className="atelier-hero-copy">
        <div className="hero-intro">
          <span /> SENIOR SOFTWARE ENGINEER{" "}
          <span className="hero-intro-divider">/</span>
          <span title={experience.description}>{experience.label} YEARS</span>
        </div>
        <p className="hero-greeting">Hi, I’m</p>
        <h1>
          Prakash
          <br />
          <span>
            Choudhary<span className="name-dot">.</span>
          </span>
        </h1>
        <p className="hero-position">
          <RotatingRole />
          <br />
          <strong>Systems thinker. AI builder.</strong>
        </p>
        <p className="hero-statement">
          I turn complex infrastructure into products people can rely on—from
          event-driven services to AI agents that connect the dots.
        </p>
        <div className="atelier-actions">
          <button className="primary-button" onClick={onExplore}>
            Explore my work <ArrowUpRight size={17} />
          </button>
          <a
            className="hero-resume"
            href={RESUME.resumeUrl}
            target="_blank"
            rel="noreferrer"
          >
            Résumé <Download size={15} />
          </a>
          <a
            className="hero-contact"
            href={`mailto:${RESUME.email}`}
            aria-label="Email Prakash"
          >
            <Mail size={18} />
          </a>
        </div>
        <button className="profile-download" onClick={downloadProfile}>
          Download text profile <ArrowRight size={12} />
        </button>
      </div>
      <div className="portrait-scene">
        <div className="portrait-atmosphere" aria-hidden="true">
          <div className="portrait-grid" />
          <div className="portrait-glow" />
        </div>
        <figure
          className="portrait-card"
          onPointerMove={tiltCard}
          onPointerLeave={resetTilt}
        >
          <div className="portrait-topline">
            <span>THE ENGINEER BEHIND THE BUILD</span>
            <span>PRAKASH CHOUDHARY</span>
          </div>
          <div className="portrait-image">
            <img src="/avatar.jpg" alt="Prakash Choudhary" />
            <div className="portrait-image-shade" />
          </div>
          <figcaption>
            <span>
              Prakash Choudhary
              <small>Backend · Distributed systems · Applied AI</small>
            </span>
            <a
              className="portrait-linkedin"
              href={RESUME.linkedin}
              target="_blank"
              rel="noreferrer"
              aria-label="Open Prakash Choudhary on LinkedIn"
            >
              <ArrowUpRight size={21} />
            </a>
          </figcaption>
        </figure>
        <a
          className="contribution-float"
          href="https://github.com/liquibase/liquibase/pull/2102"
          target="_blank"
          rel="noreferrer"
        >
          <span className="contribution-symbol">
            <GitPullRequest size={19} />
          </span>
          <span>
            Code beyond my own projects
            <strong>
              Liquibase contributor <ArrowUpRight size={12} />
            </strong>
          </span>
        </a>
        <div
          className="language-dock"
          role="group"
          aria-label="Choose a language theme"
        >
          {Object.values(LANGUAGE_THEMES).map((t) => (
            <button
              key={t.id}
              className={theme === t.id ? "selected" : ""}
              aria-pressed={theme === t.id}
              aria-label={`Use ${t.shortName} theme`}
              title={t.shortName}
              onClick={() => change(t.id)}
            >
              <TechnologyIcon name={t.shortName} />
            </button>
          ))}
        </div>
        <div className="portrait-caption">
          <span className="live-dot" /> One engineer. Many ways to build.
          <small>Choose a language. Make this space yours.</small>
        </div>
      </div>
    </section>
  );
}
