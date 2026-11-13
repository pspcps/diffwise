import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ThemeProvider } from "./components/Guide/ThemeChoice";
import "./guide.css";
import MotionProvider from "./components/Motion/MotionProvider";
import MotionLayer from "./components/Motion/MotionLayer";
import "./motion.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <MotionProvider>
        <MotionLayer />
        <App />
      </MotionProvider>
    </ThemeProvider>
  </StrictMode>,
);
