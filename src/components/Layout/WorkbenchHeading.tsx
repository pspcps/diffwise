import { TOOL_TIPS } from "../../data/toolTips";
import CharacterGuide from "../Guide/CharacterGuide";
import { TOOLS } from "../../data/tools";
import type { ViewMode } from "../../types";
export default function WorkbenchHeading({ mode }: { mode: ViewMode }) {
  const tool = TOOLS.find((t) => t.id === mode)!;
  return (
    <>
      <CharacterGuide
        compact
        key={mode}
        stories={[
          `${tool.name}: ${tool.description}`,
          TOOL_TIPS[mode],
          "Your language theme is saved in this browser. Use Quick search or Ctrl / Command K to find another tool.",
        ]}
      />
    </>
  );
}
