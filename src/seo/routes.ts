import { useSyncExternalStore } from "react";
import { HASH_TO_MODE } from "./legacyRoutes";
import {
  HOME_PAGE,
  NOT_FOUND,
  PORTFOLIO_PAGE,
  TOOL_PAGES,
  pageForId,
} from "./pages";
import type { SearchPage } from "./pages";
export interface SiteRoute {
  page: SearchPage;
  legacy: boolean;
  search: string;
}
export function resolveLocation(
  location: Pick<Location, "pathname" | "search" | "hash">,
): SiteRoute {
  const key = location.hash.split("?")[0];
  if (key.startsWith("#/")) {
    const search = location.hash.includes("?")
      ? "?" + location.hash.split("?").slice(1).join("?")
      : "";
    if (key === "#/" || key === "#/home")
      return { page: HOME_PAGE, legacy: true, search };
    if (key === "#/portfolio")
      return { page: PORTFOLIO_PAGE, legacy: true, search };
    if (HASH_TO_MODE[key])
      return { page: pageForId(HASH_TO_MODE[key]), legacy: true, search };
    return { page: NOT_FOUND, legacy: false, search: "" };
  }
  const path = location.pathname.replace(/\/+$/, "") + "/";
  const page =
    path === "/"
      ? HOME_PAGE
      : path === "/portfolio/"
        ? PORTFOLIO_PAGE
        : TOOL_PAGES.find((p) => p.path === path) || NOT_FOUND;
  return { page, legacy: false, search: location.search };
}
function subscribe(callback: () => void) {
  window.addEventListener("hashchange", callback);
  window.addEventListener("popstate", callback);
  return () => {
    window.removeEventListener("hashchange", callback);
    window.removeEventListener("popstate", callback);
  };
}
const snapshot = () => location.pathname + location.search + location.hash;
export function useSiteRoute() {
  useSyncExternalStore(subscribe, snapshot);
  return resolveLocation(window.location);
}
export function navigateTo(path: string, replace = false) {
  if (!path.startsWith("/") || path.startsWith("//")) return;
  history[replace ? "replaceState" : "pushState"]({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
