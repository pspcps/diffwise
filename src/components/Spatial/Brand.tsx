import BrandMark from "./BrandMark";
export default function Brand({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="space-brand"
      onClick={onClick}
      aria-label="PSDevTool home"
    >
      <span className="brand-mark">
        <BrandMark />
      </span>
      <span>
        PSDevTool<span className="brand-period">.</span>
        <small>YOUR DEVELOPER SPACE</small>
      </span>
    </button>
  );
}
