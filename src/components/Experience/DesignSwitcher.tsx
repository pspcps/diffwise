import { navigateTo } from "../../seo/routes";
import type { HomeDesign } from "../../utils/designExperience";
export default function DesignSwitcher({ design }: { design: HomeDesign }) {
  return (
    <label className="homepage-design-switch">
      <span>Design</span>
      <select
        aria-label="Homepage design"
        value={design}
        onChange={(event) => navigateTo(`/?design=${event.target.value}`)}
      >
        <option value="classic">Classic</option>
        <option value="studio">3D Studio</option>
      </select>
    </label>
  );
}
