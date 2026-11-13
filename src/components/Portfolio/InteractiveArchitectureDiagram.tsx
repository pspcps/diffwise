import { useState } from "react";
import { ArrowRight, Code2, ExternalLink, Layers } from "lucide-react";
import { PROJECT_CASE_STUDIES } from "../../data/projectCaseStudies";

export default function InteractiveArchitectureDiagram({
  projectTitle,
}: {
  projectTitle: string;
  projectColor?: string;
}) {
  const study = PROJECT_CASE_STUDIES[projectTitle];
  const [selected, setSelected] = useState(0);
  if (!study) return null;
  const stage = study.stages[selected];
  return (
    <section
      className="architecture-study"
      aria-label={`${projectTitle} architecture`}
    >
      <header>
        <div>
          <Layers size={17} />
          <h3>Architecture & engineering decisions</h3>
        </div>
        <span>{study.access}</span>
      </header>
      <p className="architecture-intro">
        Select a stage to understand its responsibility in the system.
      </p>
      <div className="architecture-stages">
        {study.stages.map((s, i) => (
          <button
            key={s.title}
            aria-pressed={selected === i}
            onClick={() => setSelected(i)}
            className={selected === i ? "selected" : ""}
          >
            <span className="stage-number">
              {String(i + 1).padStart(2, "0")}
            </span>
            <strong>{s.title}</strong>
            <ArrowRight size={15} />
          </button>
        ))}
      </div>
      <div className="architecture-inspector" aria-live="polite">
        <span className="eyebrow muted">STAGE {selected + 1}</span>
        <h4>{stage.title}</h4>
        <p>{stage.description}</p>
      </div>
      <div className="study-engineering">
        <h4>Engineering focus</h4>
        <p>{study.engineering}</p>
        <h4>Scope & tradeoffs</h4>
        <p>{study.scope}</p>
      </div>
      {study.sources.length > 0 && (
        <div className="study-sources">
          <h4>
            <Code2 size={15} /> Explore the implementation
          </h4>
          {study.sources.map((s) => (
            <a key={s.url} href={s.url} target="_blank" rel="noreferrer">
              {s.label}
              <ExternalLink size={12} />
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
