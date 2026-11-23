import { lazy, useState } from "react";
import {
  browserPreferences,
  chooseDesign,
  randomDesign,
  HOME_DESIGNS,
  type HomeDesign,
} from "../../utils/designExperience";
import { HomeDesignContext } from "./DesignContext";
import type { ViewMode } from "../../types";
import "./experience-choice.css";
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
  const [design, setDesign] = useState(() =>
    chooseDesign(
      HOME_DESIGNS,
      "psdev-home-design-v2",
      browserPreferences(),
      new URLSearchParams(search).get("design"),
      "classic",
    ),
  );
  function choose(next: HomeDesign) {
    const url = new URL(window.location.href);
    if (url.searchParams.has("design")) {
      url.searchParams.delete("design");
      history.replaceState(
        history.state,
        "",
        url.pathname + url.search + url.hash,
      );
    }
    setDesign(
      chooseDesign(
        HOME_DESIGNS,
        "psdev-home-design-v2",
        browserPreferences(),
        next,
        "classic",
      ),
    );
  }
  return (
    <HomeDesignContext.Provider
      value={{
        choose,
        surprise: () => choose(randomDesign(HOME_DESIGNS, design)),
      }}
    >
      {design === "studio" ? (
        <StudioHomePage {...props} />
      ) : (
        <HomePage {...props} />
      )}
    </HomeDesignContext.Provider>
  );
}
