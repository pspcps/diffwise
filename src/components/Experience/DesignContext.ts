import { createContext } from "react";
import type { HomeDesign, PortfolioDesign } from "../../utils/designExperience";
export const HomeDesignContext = createContext<{
  choose: (design: HomeDesign) => void;
  surprise: () => void;
} | null>(null);
export const PortfolioDesignContext = createContext<{
  version: PortfolioDesign;
  choose: (version: PortfolioDesign) => void;
  surprise: () => void;
} | null>(null);
