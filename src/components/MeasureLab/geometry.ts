export interface Shape {
  id: string;
  name: string;
  fields: { key: string; label: string }[];
  formulas: string[];
}
const field = (key: string, label: string) => ({ key, label });
export const SHAPES: Shape[] = [
  {
    id: "rectangle",
    name: "Rectangle",
    fields: [field("a", "Length"), field("b", "Width")],
    formulas: ["Area = a × b", "Perimeter = 2(a + b)", "Diagonal = √(a² + b²)"],
  },
  {
    id: "square",
    name: "Square",
    fields: [field("a", "Side")],
    formulas: ["Area = a²", "Perimeter = 4a", "Diagonal = a√2"],
  },
  {
    id: "circle",
    name: "Circle",
    fields: [field("r", "Radius")],
    formulas: ["Area = πr²", "Circumference = 2πr", "Diameter = 2r"],
  },
  {
    id: "triangle",
    name: "Triangle (three sides)",
    fields: [field("a", "Side a"), field("b", "Side b"), field("c", "Side c")],
    formulas: [
      "s = (a + b + c) / 2",
      "Area = √[s(s − a)(s − b)(s − c)]",
      "Perimeter = a + b + c",
    ],
  },
  {
    id: "right-triangle",
    name: "Right triangle",
    fields: [field("a", "Leg a"), field("b", "Leg b")],
    formulas: [
      "Area = ab / 2",
      "Hypotenuse = √(a² + b²)",
      "Perimeter = a + b + hypotenuse",
    ],
  },
  {
    id: "parallelogram",
    name: "Parallelogram",
    fields: [field("a", "Base"), field("h", "Perpendicular height")],
    formulas: ["Area = a × h"],
  },
  {
    id: "trapezoid",
    name: "Trapezoid",
    fields: [
      field("a", "Parallel side a"),
      field("b", "Parallel side b"),
      field("h", "Height"),
    ],
    formulas: ["Area = (a + b)h / 2"],
  },
  {
    id: "ellipse",
    name: "Ellipse",
    fields: [field("a", "Semi-major axis"), field("b", "Semi-minor axis")],
    formulas: [
      "Area = πab",
      "Perimeter ≈ π(a + b)[1 + 3q / (10 + √(4 − 3q))]",
      "q = (a − b)² / (a + b)²; Ramanujan approximation",
    ],
  },
  {
    id: "cube",
    name: "Cube",
    fields: [field("a", "Side")],
    formulas: ["Volume = a³", "Surface area = 6a²", "Space diagonal = a√3"],
  },
  {
    id: "cuboid",
    name: "Cuboid",
    fields: [field("a", "Length"), field("b", "Width"), field("h", "Height")],
    formulas: [
      "Volume = abh",
      "Surface area = 2(ab + ah + bh)",
      "Space diagonal = √(a² + b² + h²)",
    ],
  },
  {
    id: "sphere",
    name: "Sphere",
    fields: [field("r", "Radius")],
    formulas: ["Volume = 4πr³ / 3", "Surface area = 4πr²"],
  },
  {
    id: "cylinder",
    name: "Cylinder",
    fields: [field("r", "Radius"), field("h", "Height")],
    formulas: ["Volume = πr²h", "Total surface area = 2πr(r + h)"],
  },
  {
    id: "cone",
    name: "Right circular cone",
    fields: [field("r", "Radius"), field("h", "Height")],
    formulas: [
      "Slant height = √(r² + h²)",
      "Volume = πr²h / 3",
      "Total surface area = πr(r + slant height)",
    ],
  },
  {
    id: "pyramid",
    name: "Right square pyramid",
    fields: [field("a", "Base side"), field("h", "Height")],
    formulas: [
      "Volume = a²h / 3",
      "Slant height = √[h² + (a/2)²]",
      "Total surface area = a² + 2a × slant height",
    ],
  },
  {
    id: "triangular-prism",
    name: "Right triangular prism",
    fields: [
      field("a", "Triangle leg a"),
      field("b", "Triangle leg b"),
      field("h", "Prism length"),
    ],
    formulas: [
      "Volume = abh / 2",
      "Total surface area = ab + h(a + b + √(a² + b²))",
    ],
  },
];
export interface ShapeResult {
  name: string;
  value: number;
  power: 1 | 2 | 3;
}
export function calculateShape(
  id: string,
  d: Record<string, number>,
): ShapeResult[] {
  const shape = SHAPES.find((s) => s.id === id);
  if (
    !shape ||
    shape.fields.some((f) => !Number.isFinite(d[f.key]) || d[f.key] <= 0)
  )
    throw new Error("Enter a positive, finite value for every dimension.");
  const { a = 1, b = 1, c = 1, r = 1, h = 1 } = d;
  const results: ShapeResult[] = [];
  const add = (name: string, value: number, power: 1 | 2 | 3) =>
    results.push({ name, value, power });
  switch (id) {
    case "rectangle":
    case "square": {
      const w = id === "square" ? a : b;
      add("Area", a * w, 2);
      add("Perimeter", 2 * (a + w), 1);
      add("Diagonal", Math.hypot(a, w), 1);
      break;
    }
    case "circle":
      add("Area", Math.PI * r * r, 2);
      add("Circumference", 2 * Math.PI * r, 1);
      add("Diameter", 2 * r, 1);
      break;
    case "triangle": {
      if (a + b <= c || a + c <= b || b + c <= a)
        throw new Error(
          "Any two triangle sides must add up to more than the third side.",
        );
      const s = (a + b + c) / 2;
      add("Area", Math.sqrt(s * (s - a) * (s - b) * (s - c)), 2);
      add("Perimeter", 2 * s, 1);
      break;
    }
    case "right-triangle":
      add("Area", (a * b) / 2, 2);
      add("Hypotenuse", Math.hypot(a, b), 1);
      add("Perimeter", a + b + Math.hypot(a, b), 1);
      break;
    case "parallelogram":
      add("Area", a * h, 2);
      break;
    case "trapezoid":
      add("Area", ((a + b) * h) / 2, 2);
      break;
    case "ellipse": {
      const q = (a - b) ** 2 / (a + b) ** 2;
      add("Area", Math.PI * a * b, 2);
      add(
        "Perimeter (approx.)",
        Math.PI * (a + b) * (1 + (3 * q) / (10 + Math.sqrt(4 - 3 * q))),
        1,
      );
      break;
    }
    case "cube":
      add("Volume", a ** 3, 3);
      add("Surface area", 6 * a * a, 2);
      add("Space diagonal", a * Math.sqrt(3), 1);
      break;
    case "cuboid":
      add("Volume", a * b * h, 3);
      add("Surface area", 2 * (a * b + a * h + b * h), 2);
      add("Space diagonal", Math.hypot(a, b, h), 1);
      break;
    case "sphere":
      add("Volume", (4 * Math.PI * r ** 3) / 3, 3);
      add("Surface area", 4 * Math.PI * r * r, 2);
      break;
    case "cylinder":
      add("Volume", Math.PI * r * r * h, 3);
      add("Surface area", 2 * Math.PI * r * (r + h), 2);
      break;
    case "cone": {
      const l = Math.hypot(r, h);
      add("Volume", (Math.PI * r * r * h) / 3, 3);
      add("Surface area", Math.PI * r * (r + l), 2);
      add("Slant height", l, 1);
      break;
    }
    case "pyramid": {
      const l = Math.hypot(h, a / 2);
      add("Volume", (a * a * h) / 3, 3);
      add("Surface area", a * a + 2 * a * l, 2);
      add("Slant height", l, 1);
      break;
    }
    case "triangular-prism":
      add("Volume", (a * b * h) / 2, 3);
      add("Surface area", a * b + h * (a + b + Math.hypot(a, b)), 2);
      break;
  }
  if (results.some((r) => !Number.isFinite(r.value)))
    throw new Error("These dimensions exceed the supported numerical range.");
  return results;
}
