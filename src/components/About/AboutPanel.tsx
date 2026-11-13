import { useEffect, useRef } from "react";
import { X, Link2, ExternalLink } from "lucide-react";
import { RESUME } from "../../data/resumeData";
interface AboutPanelProps {
  onClose: () => void;
  onPortfolio: () => void;
}
export default function AboutPanel({ onClose, onPortfolio }: AboutPanelProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const panel = dialog.current;
    panel?.showModal();
    return () => panel?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="builder-panel"
      aria-labelledby="builder-panel-title"
      onCancel={onClose}
      onClose={onClose}
      onClick={(e) => {
        if (
          e.target === e.currentTarget &&
          e.clientX < e.currentTarget.getBoundingClientRect().left
        )
          onClose();
      }}
    >
      <header>
        <span>ABOUT THE BUILDER</span>
        <button onClick={onClose} aria-label="Close builder panel">
          <X size={18} />
        </button>
      </header>
      <div className="builder-panel-body">
        <img
          className="builder-portrait"
          src="/avatar.jpg"
          alt="Prakash Choudhary"
        />
        <h2 id="builder-panel-title">{RESUME.name}</h2>
        <p className="builder-role">{RESUME.title}</p>
        <p className="builder-focus">{RESUME.focus}</p>
        <hr />
        <p className="builder-bio">{RESUME.summary}</p>
        <a
          className="builder-social"
          href={RESUME.linkedin}
          target="_blank"
          rel="noreferrer"
        >
          <Link2 size={16} />
          <span>Connect on LinkedIn</span>
          <ExternalLink size={13} />
        </a>
      </div>
      <footer>
        <button
          className="primary-button"
          onClick={() => {
            onClose();
            onPortfolio();
          }}
        >
          View portfolio & projects <ExternalLink size={15} />
        </button>
      </footer>
    </dialog>
  );
}
