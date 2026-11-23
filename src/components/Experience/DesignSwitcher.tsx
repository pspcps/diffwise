import { useContext } from "react";
import { navigateTo } from "../../seo/routes";
import type { HomeDesign } from "../../utils/designExperience";
import { HomeDesignContext } from "./DesignContext";
import DesignShuffleButton from "./DesignShuffleButton";
export default function DesignSwitcher({ design }: { design: HomeDesign }) {
  const actions = useContext(HomeDesignContext);
  return (
    <DesignShuffleButton
      current={`Homepage ${design === "classic" ? "Classic" : "3D Studio"}`}
      onClick={() =>
        actions
          ? actions.surprise()
          : navigateTo(
              `/?design=${design === "classic" ? "studio" : "classic"}`,
            )
      }
    />
  );
}
