import { lazy, useState } from "react";
import {
  browserPreferences,
  chooseDesign,
  randomDesign,
  PORTFOLIO_DESIGNS,
  type PortfolioDesign,
} from "../../utils/designExperience";
import { navigateTo } from "../../seo/routes";
import { PortfolioDesignContext } from "./DesignContext";
const Original = lazy(() => import("../../pages/PortfolioPage"));
const Profile = lazy(() => import("../../pages/PortfolioV2Page"));
const Studio = lazy(() => import("../../pages/PortfolioV3Page"));
export default function PortfolioEntry({
  initialVersion,
  onBack,
}: {
  initialVersion?: PortfolioDesign;
  onBack: () => void;
}) {
  const [version, setVersion] = useState(() =>
    chooseDesign(
      PORTFOLIO_DESIGNS,
      "psdev-portfolio-design-v2",
      browserPreferences(),
      initialVersion,
      "v3",
    ),
  );
  function choose(next: PortfolioDesign) {
    setVersion(
      chooseDesign(
        PORTFOLIO_DESIGNS,
        "psdev-portfolio-design-v2",
        browserPreferences(),
        next,
        "v3",
      ),
    );
    if (window.location.pathname.replace(/\/+$/, "") !== "/portfolio")
      navigateTo("/portfolio/", true);
  }
  return (
    <PortfolioDesignContext.Provider
      value={{
        version,
        choose,
        surprise: () => choose(randomDesign(PORTFOLIO_DESIGNS, version)),
      }}
    >
      {version === "v1" ? (
        <Original onBack={onBack} />
      ) : version === "v2" ? (
        <Profile />
      ) : (
        <Studio />
      )}
    </PortfolioDesignContext.Provider>
  );
}
