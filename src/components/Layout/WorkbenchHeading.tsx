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
      <div className="workbench-heading">
        <span className="workbench-heading-icon">
          <tool.icon size={20} />
        </span>
        <div>
          <h1>{tool.name}</h1>
          <p>{tool.description}</p>
        </div>
        {["text", "file", "json", "markup", "api", "jwt", "har"].includes(
          mode,
        ) && (
          <div className="syntax-legend" aria-label="Syntax color guide">
            <span className="syntax-key">Keys</span>
            <span className="syntax-string">Strings</span>
            <span className="syntax-number">Numbers</span>
            <span className="syntax-bracket-0">{"{ }"}</span>
          </div>
        )}
      </div>
    </>
  );
}
