import { numberText as n } from "./units";
export const ALGEBRA = [
  {
    id: "linear",
    name: "Linear equation",
    formula: "ax + b = c  →  x = (c − b) / a",
    fields: ["a", "b", "c"],
    defaults: { a: 2, b: 3, c: 11 },
  },
  {
    id: "quadratic",
    name: "Quadratic equation",
    formula: "ax² + bx + c = 0  →  x = [−b ± √(b² − 4ac)] / 2a",
    fields: ["a", "b", "c"],
    defaults: { a: 1, b: -5, c: 6 },
  },
  {
    id: "system",
    name: "Two linear equations",
    formula:
      "ax + by = c; dx + ey = f  →  Δ = ae − bd; x = (ce − bf)/Δ; y = (af − cd)/Δ",
    fields: ["a", "b", "c", "d", "e", "f"],
    defaults: { a: 2, b: 1, c: 7, d: 1, e: -1, f: 2 },
  },
  {
    id: "percent",
    name: "Percentage",
    formula: "Part = whole × percentage / 100",
    fields: ["whole", "percentage"],
    defaults: { whole: 250, percentage: 15 },
  },
  {
    id: "arithmetic",
    name: "Arithmetic sequence",
    formula: "aₙ = a₁ + (n − 1)d; Sₙ = n[2a₁ + (n − 1)d] / 2",
    fields: ["first", "difference", "n"],
    defaults: { first: 2, difference: 3, n: 10 },
  },
  {
    id: "geometric",
    name: "Geometric sequence",
    formula: "aₙ = a₁rⁿ⁻¹; Sₙ = a₁(1 − rⁿ)/(1 − r); if r = 1: Sₙ = na₁",
    fields: ["first", "ratio", "n"],
    defaults: { first: 2, ratio: 2, n: 5 },
  },
];
export function solveAlgebra(
  id: string,
  v: Record<string, number>,
): { lines: string[]; plot: [number, number][]; note: string } {
  const item = ALGEBRA.find((x) => x.id === id);
  if (!item || item.fields.some((k) => !Number.isFinite(v[k])))
    throw new Error("Enter a finite number for every coefficient.");
  const { a, b, c, d, e, f, whole, percentage, first, difference, ratio } = v;
  const lines: string[] = [];
  let plot: [number, number][] = [];
  let note = "";
  if (id === "linear") {
    if (a === 0) {
      lines.push(b === c ? "Infinitely many solutions" : "No solution");
      note = "A constant equation has no unique x.";
    } else {
      const x = (c - b) / a;
      lines.push(`x = (${n(c)} − ${n(b)}) / ${n(a)} = ${n(x)}`);
      note = "The plot shows y = ax + b − c; its zero is the solution.";
      const span = Math.max(5, Math.abs(x) * 0.3);
      plot = Array.from({ length: 61 }, (_, i) => {
        const t = x - span + (2 * span * i) / 60;
        return [t, a * t + b - c];
      });
    }
  } else if (id === "quadratic") {
    if (a === 0) return solveAlgebra("linear", { a: b, b: c, c: 0 });
    const disc = b * b - 4 * a * c;
    if (!Number.isFinite(disc))
      throw new Error("Coefficients exceed the supported numerical range.");
    lines.push(`Discriminant = ${n(disc)}`);
    if (disc < 0)
      lines.push(
        `x = ${n(-b / (2 * a))} ± ${n(Math.sqrt(-disc) / Math.abs(2 * a))}i`,
      );
    else if (disc === 0) lines.push(`x = ${n(-b / (2 * a))} (repeated root)`);
    else {
      const q = -0.5 * (b + (b >= 0 ? 1 : -1) * Math.sqrt(disc));
      lines.push(`x₁ = ${n(q / a)}`, `x₂ = ${n(c / q)}`);
    }
    const center = -b / (2 * a),
      span = Math.max(3, (Math.sqrt(Math.abs(disc)) / Math.abs(2 * a)) * 1.5);
    plot = Array.from({ length: 81 }, (_, i) => {
      const t = center - span + (2 * span * i) / 80;
      return [t, a * t * t + b * t + c];
    });
    note =
      "The plot shows y = ax² + bx + c. Complex roots do not cross the x axis.";
  } else if (id === "system") {
    const det = a * e - b * d;
    lines.push(`Determinant = ${n(det)}`);
    if (det === 0) {
      const zeroContradiction =
        (a === 0 && b === 0 && c !== 0) || (d === 0 && e === 0 && f !== 0);
      lines.push(
        !zeroContradiction && a * f === c * d && b * f === c * e
          ? "Infinitely many solutions"
          : "No solution",
      );
    } else
      lines.push(
        `x = ${n((c * e - b * f) / det)}`,
        `y = ${n((a * f - c * d) / det)}`,
      );
    note =
      "A unique solution requires a nonzero determinant. Very small determinants are numerically sensitive.";
  } else if (id === "percent") {
    lines.push(
      `${n(percentage)}% of ${n(whole)} = ${n((whole * percentage) / 100)}`,
    );
    note = "Percentages can exceed 100% or be negative.";
  } else {
    const count = v.n;
    if (!Number.isInteger(count) || count < 1 || count > 10000)
      throw new Error("Use a whole term count from 1 to 10,000.");
    const nth =
      id === "arithmetic"
        ? first + (count - 1) * difference
        : first * ratio ** (count - 1);
    const sum =
      id === "arithmetic"
        ? (count * (2 * first + (count - 1) * difference)) / 2
        : ratio === 1
          ? count * first
          : (first * (1 - ratio ** count)) / (1 - ratio);
    if (!Number.isFinite(nth) || !Number.isFinite(sum))
      throw new Error("This sequence exceeds the supported numerical range.");
    lines.push(
      `Term ${count} = ${n(nth)}`,
      `Sum of ${count} terms = ${n(sum)}`,
    );
    plot = Array.from({ length: Math.min(count, 60) }, (_, i) => [
      i + 1,
      id === "arithmetic" ? first + i * difference : first * ratio ** i,
    ]);
    note = `Plot shows the first ${Math.min(count, 60)} terms.`;
  }
  if (plot.some((p) => p.some((x) => !Number.isFinite(x)))) plot = [];
  return { lines, plot, note };
}
