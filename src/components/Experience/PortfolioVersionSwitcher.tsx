import { useContext } from "react";
import { PortfolioDesignContext } from "./DesignContext";
import {
  PORTFOLIO_DESIGNS,
  randomDesign,
  type PortfolioDesign,
} from "../../utils/designExperience";
import { navigateTo } from "../../seo/routes";
import DesignShuffleButton from "./DesignShuffleButton";
const names = { v1: "V1 Original", v2: "V2 Profile", v3: "V3 Studio" };
export default function PortfolioVersionSwitcher({
  fallback,
}: {
  fallback: PortfolioDesign;
}) {
  const choice = useContext(PortfolioDesignContext);
  const version = choice?.version ?? fallback;
  return (
    <DesignShuffleButton
      current={`Portfolio ${names[version]}`}
      onClick={() =>
        choice
          ? choice.surprise()
          : navigateTo(
              `/portfolio/${randomDesign(PORTFOLIO_DESIGNS, version)}/`,
            )
      }
    />
  );
}
