import { useContext } from "react";
import { Shuffle } from "lucide-react";
import { PortfolioDesignContext } from "./DesignContext";
import type { PortfolioDesign } from "../../utils/designExperience";
import { navigateTo } from "../../seo/routes";
import "./experience-choice.css";
export default function PortfolioVersionSwitcher({
  fallback,
}: {
  fallback: PortfolioDesign;
}) {
  const choice = useContext(PortfolioDesignContext);
  return (
    <div className="experience-choice portfolio-experience-choice">
      <label>
        <span>Version</span>
        <select
          aria-label="Portfolio version"
          value={choice?.version ?? fallback}
          onChange={(event) =>
            choice
              ? choice.choose(event.target.value as PortfolioDesign)
              : navigateTo(`/portfolio/${event.target.value}/`)
          }
        >
          <option value="v1">V1 · Original</option>
          <option value="v2">V2 · Profile</option>
          <option value="v3">V3 · Studio</option>
        </select>
      </label>
      {choice && (
        <button
          type="button"
          className="experience-surprise"
          onClick={choice.surprise}
          title="Surprise me with another portfolio version"
          aria-label="Surprise me with another portfolio version"
        >
          <Shuffle size={15} />
          <span>Surprise me</span>
        </button>
      )}
    </div>
  );
}
