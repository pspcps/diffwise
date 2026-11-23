import { lazy, useState } from "react";
import {
  browserSession,
  chooseDesign,
  HOME_DESIGNS,
} from "../../utils/designExperience";
import type { ViewMode } from "../../types";
const HomePage = lazy(() => import("../../pages/HomePage"));
const StudioHomePage = lazy(() => import("../../pages/StudioHomePage"));
export default function HomeExperience({
  search,
  ...props
}: {
  search: string;
  onTool: (id: ViewMode) => void;
  onPortfolio: () => void;
  onSearch: () => void;
}) {
  const [design] = useState(() =>
    chooseDesign(
      HOME_DESIGNS,
      "psdev-home-design-v1",
      browserSession(),
      new URLSearchParams(search).get("design"),
    ),
  );
  return design === "studio" ? (
    <StudioHomePage {...props} />
  ) : (
    <HomePage {...props} />
  );
}
