import { createContext, useContext } from "react";
export const ToolActivity = createContext(true);
export const useToolActive = () => useContext(ToolActivity);
