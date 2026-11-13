import { createContext, useContext } from "react";
export const MotionContext = createContext({
  enabled: false,
  reduced: false,
  toggle: () => {},
});
export const useMotion = () => useContext(MotionContext);
