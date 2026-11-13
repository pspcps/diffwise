import { useId, useState } from "react";
export default function CoordinateInput({
  value,
  onChange,
  axis,
  point,
}: {
  value: number;
  onChange: (n: number) => void;
  axis: "latitude" | "longitude";
  point: "A" | "B";
}) {
  const id = useId();
  const [draft, setDraft] = useState(String(value));
  const [previous, setPrevious] = useState(value);
  if (value !== previous) {
    setPrevious(value);
    setDraft(String(value));
  }
  const limit = axis === "latitude" ? 90 : 180;
  const number = Number(draft);
  const error = !draft.trim()
    ? `Enter a ${axis}.`
    : !Number.isFinite(number) || Math.abs(number) > limit
      ? `Use a ${axis} between −${limit} and ${limit}.`
      : "";
  return (
    <div className="coordinate-field">
      <label htmlFor={id}>
        {axis === "latitude" ? "Latitude" : "Longitude"} (°)
      </label>
      <input
        id={id}
        inputMode="decimal"
        type="text"
        aria-label={`Point ${point} ${axis}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        value={draft}
        onChange={(e) => {
          const text = e.target.value;
          setDraft(text);
          const next = Number(text);
          if (text.trim() && Number.isFinite(next) && Math.abs(next) <= limit) {
            setPrevious(next);
            onChange(next);
          }
        }}
      />
      {error && (
        <p id={`${id}-error`} className="coordinate-error">
          {error} The map keeps the last valid point.
        </p>
      )}
    </div>
  );
}
