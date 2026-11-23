import { useEffect } from "react";
import {
  browserSession,
  chooseDesign,
  PORTFOLIO_DESIGNS,
} from "../../utils/designExperience";
import { navigateTo } from "../../seo/routes";
export default function PortfolioEntry() {
  useEffect(() => {
    const version = chooseDesign(
      PORTFOLIO_DESIGNS,
      "psdev-portfolio-design-v1",
      browserSession(),
    );
    navigateTo(`/portfolio/${version}/`, true);
  }, []);
  return (
    <div className="space-loading" role="status">
      Opening your portfolio experience…
    </div>
  );
}
