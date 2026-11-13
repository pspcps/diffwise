import { useMemo, useState } from "react";
import {
  ArrowLeftRight,
  Calculator,
  Copy,
  Cuboid,
  FlaskConical,
  RotateCcw,
  Sigma,
} from "lucide-react";
import MeasurementScene from "./MeasurementScene";
import { QUANTITIES, convert, numberText } from "./units";
import { SHAPES, calculateShape } from "./geometry";
import { ALGEBRA, solveAlgebra } from "./algebra";
import "./measure-lab.css";

const initialDimensions = { a: 3, b: 4, c: 5, h: 5, r: 2 };
const labelFor: Record<string, string> = {
  a: "a",
  b: "b",
  c: "c",
  d: "d",
  e: "e",
  f: "f",
  whole: "Whole amount",
  percentage: "Percentage (%)",
  first: "First term (a₁)",
  difference: "Common difference (d)",
  ratio: "Common ratio (r)",
  n: "Term count (n)",
};
function parseInput(text: string) {
  if (!text.trim() || !Number.isFinite(Number(text)))
    throw new Error("Enter a finite number.");
  return Number(text);
}
function equivalent(
  quantity: (typeof QUANTITIES)[number],
  value: string,
  from: string,
  to: string,
) {
  try {
    return numberText(convert(quantity, Number(value), from, to).result);
  } catch {
    return "Outside numerical range";
  }
}
export default function MeasureLabView() {
  const [tab, setTab] = useState<"convert" | "geometry" | "algebra">("convert");
  const [category, setCategory] = useState("length");
  const quantity = QUANTITIES.find((q) => q.id === category)!;
  const [from, setFrom] = useState("cm"),
    [to, setTo] = useState("ft"),
    [input, setInput] = useState("175");
  const [copied, setCopied] = useState(false);
  const calculation = useMemo(() => {
    try {
      return {
        data: convert(quantity, parseInput(input), from, to),
        error: "",
      };
    } catch (e) {
      return { data: null, error: (e as Error).message };
    }
  }, [quantity, input, from, to]);
  const chooseCategory = (id: string) => {
    const q = QUANTITIES.find((q) => q.id === id)!;
    setCategory(id);
    const defaults: Record<string, [string, string]> = {
      length: ["cm", "ft"],
      mass: ["kg", "g"],
      volume: ["L", "mL"],
      area: ["m²", "ft²"],
      temperature: ["°C", "°F"],
      time: ["h", "min"],
      speed: ["km/h", "mph"],
      pressure: ["bar", "psi"],
      energy: ["kWh", "J"],
      power: ["kW", "hp"],
      angle: ["°", "rad"],
      data: ["GB", "MiB"],
      frequency: ["Hz", "rpm"],
      force: ["N", "lbf"],
      density: ["kg/m³", "g/cm³"],
      current: ["A", "mA"],
      voltage: ["V", "kV"],
    };
    const [source, target] = defaults[id];
    setFrom(source);
    setTo(target);
    const unit = q.units.find((u) => u.id === source)!;
    const base = id === "temperature" ? 298.15 : q.reference * 0.5;
    setInput(
      String(
        Number(((base - (unit.offset || 0)) / unit.factor).toPrecision(10)),
      ),
    );
  };
  const [shapeId, setShapeId] = useState("cuboid"),
    [lengthUnit, setLengthUnit] = useState("m");
  const [dimensions, setDimensions] = useState<Record<string, string>>({
    a: "3",
    b: "4",
    c: "5",
    h: "5",
    r: "2",
  });
  const shape = SHAPES.find((s) => s.id === shapeId)!;
  const geometry = useMemo(() => {
    try {
      const d = Object.fromEntries(
        shape.fields.map((f) => [f.key, parseInput(dimensions[f.key])]),
      );
      return { dimensions: d, results: calculateShape(shapeId, d), error: "" };
    } catch (e) {
      return {
        dimensions: initialDimensions,
        results: [],
        error: (e as Error).message,
      };
    }
  }, [shape, shapeId, dimensions]);
  const lengthFactor = QUANTITIES[0].units.find(
    (u) => u.id === lengthUnit,
  )!.factor;
  const [algebraId, setAlgebraId] = useState("quadratic");
  const algebra = ALGEBRA.find((a) => a.id === algebraId)!;
  const [coefficients, setCoefficients] = useState<Record<string, string>>({
    a: "1",
    b: "-5",
    c: "6",
  });
  const solution = useMemo(() => {
    try {
      return {
        data: solveAlgebra(
          algebraId,
          Object.fromEntries(
            algebra.fields.map((f) => [f, parseInput(coefficients[f])]),
          ),
        ),
        error: "",
      };
    } catch (e) {
      return { data: null, error: (e as Error).message };
    }
  }, [algebra, algebraId, coefficients]);
  async function copyResult() {
    if (!calculation.data) return;
    try {
      await navigator.clipboard.writeText(
        `${numberText(calculation.data.result)} ${to}`,
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }
  const base = calculation.data?.base || 0;
  return (
    <div className="measure-lab">
      <div className="measure-intro">
        <span className="measure-eyebrow">MEASURE. UNDERSTAND. EXPLORE.</span>
        <h1>
          Make numbers tangible<span>.</span>
        </h1>
        <p>
          Convert everyday measurements, explore shapes, and solve
          equations—with formulas you can follow.
        </p>
      </div>
      <nav className="measure-tabs" aria-label="Measurement workspace">
        <button
          type="button"
          aria-current={tab === "convert" ? "page" : undefined}
          onClick={() => setTab("convert")}
        >
          <FlaskConical size={17} /> Unit converter
        </button>
        <button
          type="button"
          aria-current={tab === "geometry" ? "page" : undefined}
          onClick={() => setTab("geometry")}
        >
          <Cuboid size={17} /> Geometry
        </button>
        <button
          type="button"
          aria-current={tab === "algebra" ? "page" : undefined}
          onClick={() => setTab("algebra")}
        >
          <Sigma size={17} /> Algebra
        </button>
      </nav>
      {tab === "convert" && (
        <>
          <div className="quantity-picker">
            <label htmlFor="quantity">What are you measuring?</label>
            <select
              id="quantity"
              value={category}
              onChange={(e) => chooseCategory(e.target.value)}
            >
              {QUANTITIES.map((q) => (
                <option value={q.id} key={q.id}>
                  {q.name}
                </option>
              ))}
            </select>
            <span>
              {quantity.units.length} compatible units · calculated locally
            </span>
          </div>
          <div className="measure-workspace">
            <section className="measure-card">
              <span className="measure-eyebrow">YOUR MEASUREMENT</span>
              <label className="measure-input-label" htmlFor="measurement">
                Value
              </label>
              <input
                className="measure-number"
                id="measurement"
                type="number"
                step="any"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setCopied(false);
                }}
              />
              <div className="unit-pair">
                <label>
                  From
                  <select
                    aria-label="Convert from"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                  >
                    {quantity.units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.label} ({u.id})
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  aria-label="Swap conversion units"
                  onClick={() => {
                    if (calculation.data)
                      setInput(String(calculation.data.result));
                    setFrom(to);
                    setTo(from);
                  }}
                >
                  <ArrowLeftRight size={19} />
                </button>
                <label>
                  To
                  <select
                    aria-label="Convert to"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                  >
                    {quantity.units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.label} ({u.id})
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {calculation.error ? (
                <p className="measure-error" role="status">
                  {calculation.error}
                </p>
              ) : (
                <div className="measure-result" aria-live="polite">
                  <span>EQUALS</span>
                  <output data-testid="conversion-result">
                    {numberText(calculation.data!.result)} <small>{to}</small>
                  </output>
                  <button type="button" onClick={copyResult}>
                    <Copy size={14} />
                    {copied ? "Copied" : "Copy result"}
                  </button>
                </div>
              )}
              <div className="measure-formula">
                <strong>How it converts</strong>
                <code>
                  base = value × source factor + source offset
                  <br />
                  result = (base − target offset) / target factor
                </code>
                {calculation.data && (
                  <p>
                    ({input} × {numberText(calculation.data.from.factor)} +{" "}
                    {numberText(calculation.data.from.offset || 0)} −{" "}
                    {numberText(calculation.data.to.offset || 0)}) ÷{" "}
                    {numberText(calculation.data.to.factor)} ={" "}
                    {numberText(calculation.data.result)} {to}
                  </p>
                )}
                <small>
                  Base unit: {quantity.base}. Floating-point results are rounded
                  for display. All units follow the definitions named in the
                  selector.
                </small>
              </div>
            </section>
            <section className="measure-visual-card">
              <div className="visual-caption">
                <span>LIVE 3D · {quantity.name.toUpperCase()}</span>
                <span>Drag to orbit · scroll to zoom</span>
              </div>
              <MeasurementScene
                kind={quantity.scene}
                fraction={base / quantity.reference}
                description={quantity.context}
              />
              <p>{quantity.context}</p>
              <label className="visual-slider">
                Explore the scale{" "}
                <input
                  aria-label="Explore measurement scale"
                  type="range"
                  min="0"
                  max="1000"
                  value={Math.max(
                    0,
                    Math.min(1000, (base / quantity.reference) * 1000),
                  )}
                  onChange={(e) => {
                    const unit = quantity.units.find((u) => u.id === from)!;
                    setInput(
                      String(
                        Number(
                          (
                            ((Number(e.target.value) / 1000) *
                              quantity.reference -
                              (unit.offset || 0)) /
                            unit.factor
                          ).toPrecision(10),
                        ),
                      ),
                    );
                  }}
                />
              </label>
              <small>
                Illustration range: 0–{numberText(quantity.reference)}{" "}
                {quantity.base}.
                {Math.abs(base) > quantity.reference
                  ? " Visual is capped; the numeric conversion above is unchanged."
                  : ""}
              </small>
            </section>
          </div>
          <section className="measure-card equivalents">
            <h2>One measurement. Every compatible unit.</h2>
            <p>
              Length converts to length; mass converts to mass. To relate mass
              and volume, you need a material’s density.
            </p>
            <div className="equivalent-grid">
              {quantity.units.map((u) => (
                <div key={u.id}>
                  <span>{u.label}</span>
                  <strong>
                    {calculation.data
                      ? equivalent(quantity, input, from, u.id)
                      : "—"}{" "}
                    <small>{u.id}</small>
                  </strong>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
      {tab === "geometry" && (
        <>
          <div className="quantity-picker">
            <label htmlFor="shape">Explore a shape</label>
            <select
              id="shape"
              value={shapeId}
              onChange={(e) => setShapeId(e.target.value)}
            >
              {SHAPES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <label>
              Length unit
              <select
                aria-label="Geometry length unit"
                value={lengthUnit}
                onChange={(e) => setLengthUnit(e.target.value)}
              >
                {QUANTITIES[0].units
                  .filter((u) =>
                    ["mm", "cm", "m", "km", "in", "ft", "yd"].includes(u.id),
                  )
                  .map((u) => (
                    <option key={u.id}>{u.id}</option>
                  ))}
              </select>
            </label>
          </div>
          <div className="measure-workspace">
            <section className="measure-card">
              <span className="measure-eyebrow">
                {shape.name.toUpperCase()} DIMENSIONS
              </span>
              <div className="geometry-inputs">
                {shape.fields.map((f) => (
                  <label key={f.key}>
                    {f.label} ({lengthUnit})
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={dimensions[f.key]}
                      onChange={(e) =>
                        setDimensions({
                          ...dimensions,
                          [f.key]: e.target.value,
                        })
                      }
                    />
                  </label>
                ))}
              </div>
              {geometry.error && (
                <p className="measure-error" role="status">
                  {geometry.error}
                </p>
              )}
              <div className="geometry-results" aria-live="polite">
                {geometry.results.map((r) => (
                  <div key={r.name}>
                    <span>{r.name}</span>
                    <strong>
                      {numberText(r.value)} {lengthUnit}
                      {r.power === 2 ? "²" : r.power === 3 ? "³" : ""}
                    </strong>
                    {r.power > 1 && (
                      <small>
                        {numberText(r.value * lengthFactor ** r.power)} m
                        {r.power === 2 ? "²" : "³"}
                        {r.power === 3
                          ? ` · ${numberText(r.value * lengthFactor ** 3 * 1000)} L`
                          : ""}
                      </small>
                    )}
                  </div>
                ))}
              </div>
              <div className="measure-formula">
                <strong>Formulas · {shape.name}</strong>
                {shape.formulas.map((f) => (
                  <code key={f}>{f}</code>
                ))}
                <small>
                  All input dimensions use {lengthUnit}. Surface areas include
                  bases. Shape models are rescaled to fit the stage; dimension
                  ratios are preserved.
                </small>
              </div>
            </section>
            <section className="measure-visual-card">
              <div className="visual-caption">
                <span>LIVE 3D · {shape.name.toUpperCase()}</span>
                <span>Drag to orbit</span>
              </div>
              <MeasurementScene
                kind="geometry"
                fraction={1}
                shape={shapeId}
                dimensions={geometry.dimensions}
                description={`Interactive ${shape.name} model; proportions follow the entered dimensions.`}
              />
              <p>
                {geometry.error
                  ? "Correct the dimensions to calculate this shape. A sample model is displayed."
                  : "Change a dimension to reshape the model. Thin surfaces represent plane shapes."}
              </p>
            </section>
          </div>
        </>
      )}
      {tab === "algebra" && (
        <>
          <div className="quantity-picker">
            <label htmlFor="algebra">Choose a calculation</label>
            <select
              id="algebra"
              value={algebraId}
              onChange={(e) => {
                const item = ALGEBRA.find((a) => a.id === e.target.value)!;
                setAlgebraId(item.id);
                setCoefficients(
                  Object.fromEntries(
                    Object.entries(item.defaults).map(([k, v]) => [
                      k,
                      String(v),
                    ]),
                  ),
                );
              }}
            >
              {ALGEBRA.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="measure-workspace">
            <section className="measure-card">
              <span className="measure-eyebrow">
                {algebra.name.toUpperCase()}
              </span>
              <div className="measure-formula">
                <code>{algebra.formula}</code>
              </div>
              <div className="geometry-inputs">
                {algebra.fields.map((f) => (
                  <label key={f}>
                    {labelFor[f]}
                    <input
                      type="number"
                      step={f === "n" ? "1" : "any"}
                      aria-label={`Coefficient ${f}`}
                      value={coefficients[f] || ""}
                      onChange={(e) =>
                        setCoefficients({
                          ...coefficients,
                          [f]: e.target.value,
                        })
                      }
                    />
                  </label>
                ))}
              </div>
              {solution.error && (
                <p className="measure-error" role="status">
                  {solution.error}
                </p>
              )}
              <div className="algebra-solution" aria-live="polite">
                {solution.data?.lines.map((l) => (
                  <p key={l}>{l}</p>
                ))}
              </div>
              <p className="measure-note">{solution.data?.note}</p>
              <button
                className="measure-reset"
                type="button"
                onClick={() =>
                  setCoefficients(
                    Object.fromEntries(
                      Object.entries(algebra.defaults).map(([k, v]) => [
                        k,
                        String(v),
                      ]),
                    ),
                  )
                }
              >
                <RotateCcw size={14} /> Reset example
              </button>
            </section>
            <section className="measure-visual-card">
              {solution.data?.plot.length ? (
                <>
                  <div className="visual-caption">
                    <span>INTERACTIVE GRAPH</span>
                    <span>Drag to inspect</span>
                  </div>
                  <MeasurementScene
                    kind="algebra"
                    fraction={1}
                    plot={solution.data.plot}
                    description="A plot of the equation or sequence. Each axis is scaled independently to fit the stage."
                  />
                  <p>{solution.data.note}</p>
                  <small>
                    Axes are scaled independently to fit the curve. Use the
                    numerical solutions for exact values.
                  </small>
                </>
              ) : (
                <div className="formula-poster">
                  <Calculator size={48} />
                  <span>THE RELATIONSHIP</span>
                  <h2>{algebra.name}</h2>
                  <code>{algebra.formula}</code>
                  <p>
                    {solution.data?.note ||
                      "Enter values to follow the calculation."}
                  </p>
                </div>
              )}
            </section>
          </div>
        </>
      )}
      <footer className="measure-footer">
        17 measurement categories · 15 shapes · 6 algebra tools · Runs locally ·
        Open-source Three.js visuals{" "}
        <a href="#/distance">Explore coordinates & maps ↗</a>
      </footer>
    </div>
  );
}
