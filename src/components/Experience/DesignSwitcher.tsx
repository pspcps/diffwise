import { useContext } from "react";
import { Shuffle } from "lucide-react";
import { navigateTo } from "../../seo/routes";
import type { HomeDesign } from "../../utils/designExperience";
import { HomeDesignContext } from "./DesignContext";
export default function DesignSwitcher({ design }: { design: HomeDesign }) {
  const actions = useContext(HomeDesignContext);
  return (
    <div className="experience-choice">
      <label className="homepage-design-switch">
        <span>Design</span>
        <select
          aria-label="Homepage design"
          value={design}
          onChange={(event) =>
            actions
              ? actions.choose(event.target.value as HomeDesign)
              : navigateTo(`/?design=${event.target.value}`)
          }
        >
          <option value="classic">Classic</option>
          <option value="studio">3D Studio</option>
        </select>
      </label>
      {actions && (
        <button
          type="button"
          className="experience-surprise"
          onClick={actions.surprise}
          title="Surprise me with another homepage design"
          aria-label="Surprise me with another homepage design"
        >
          <Shuffle size={15} />
          <span>Surprise me</span>
        </button>
      )}
    </div>
  );
}
