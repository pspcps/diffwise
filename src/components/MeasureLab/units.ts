export interface Unit {
  id: string;
  label: string;
  factor: number;
  offset?: number;
}
export interface Quantity {
  id: string;
  name: string;
  base: string;
  reference: number;
  scene: string;
  context: string;
  units: Unit[];
}
const u = (id: string, label: string, factor: number, offset = 0): Unit => ({
  id,
  label,
  factor,
  offset,
});
export const QUANTITIES: Quantity[] = [
  {
    id: "length",
    name: "Length & height",
    base: "m",
    reference: 2.5,
    scene: "height",
    context:
      "A person beside a 2.5 m measuring scale. The figure grows with the height.",
    units: [
      u("mm", "Millimeter", 0.001),
      u("cm", "Centimeter", 0.01),
      u("m", "Meter", 1),
      u("km", "Kilometer", 1000),
      u("in", "Inch", 0.0254),
      u("ft", "Foot", 0.3048),
      u("yd", "Yard", 0.9144),
      u("mi", "Mile", 1609.344),
      u("nmi", "Nautical mile", 1852),
      u("µm", "Micrometer", 1e-6),
    ],
  },
  {
    id: "mass",
    name: "Mass & weight",
    base: "kg",
    reference: 5,
    scene: "mass",
    context:
      "Sugar fills a 5 kg container. Mass is shown without assuming a sugar density.",
    units: [
      u("mg", "Milligram", 1e-6),
      u("g", "Gram", 0.001),
      u("kg", "Kilogram", 1),
      u("t", "Metric tonne", 1000),
      u("oz", "Ounce (avoirdupois)", 0.028349523125),
      u("lb", "Pound", 0.45359237),
      u("st", "Stone", 6.35029318),
      u("µg", "Microgram", 1e-9),
    ],
  },
  {
    id: "volume",
    name: "Volume & liquid",
    base: "L",
    reference: 5,
    scene: "liquid",
    context:
      "Water rises in a 5 L vessel. Liters measure volume; mass depends on density.",
    units: [
      u("mL", "Milliliter", 0.001),
      u("L", "Liter", 1),
      u("m³", "Cubic meter", 1000),
      u("cm³", "Cubic centimeter", 0.001),
      u("gal US", "US liquid gallon", 3.785411784),
      u("gal imp", "Imperial gallon", 4.54609),
      u("qt US", "US liquid quart", 0.946352946),
      u("pt US", "US liquid pint", 0.473176473),
      u("cup US", "US customary cup", 0.2365882365),
      u("fl oz US", "US fluid ounce", 0.0295735295625),
      u("tbsp US", "US tablespoon", 0.01478676478125),
      u("tsp US", "US teaspoon", 0.00492892159375),
      u("ft³", "Cubic foot", 28.316846592),
      u("in³", "Cubic inch", 0.016387064),
    ],
  },
  {
    id: "area",
    name: "Area & land",
    base: "m²",
    reference: 25,
    scene: "area",
    context: "A 5 × 5 m floor fills with tiles as the area increases.",
    units: [
      u("mm²", "Square millimeter", 1e-6),
      u("cm²", "Square centimeter", 0.0001),
      u("m²", "Square meter", 1),
      u("km²", "Square kilometer", 1e6),
      u("ha", "Hectare", 10000),
      u("acre", "Acre", 4046.8564224),
      u("ft²", "Square foot", 0.09290304),
      u("in²", "Square inch", 0.00064516),
      u("yd²", "Square yard", 0.83612736),
      u("mi²", "Square mile", 2589988.110336),
    ],
  },
  {
    id: "temperature",
    name: "Temperature",
    base: "K",
    reference: 373.15,
    scene: "temperature",
    context:
      "A thermometer spans absolute zero to 100 °C. The result is not limited to this illustration.",
    units: [
      u("°C", "Celsius", 1, 273.15),
      u("°F", "Fahrenheit", 5 / 9, 255.3722222222222),
      u("K", "Kelvin", 1),
      u("°R", "Rankine", 5 / 9),
    ],
  },
  {
    id: "time",
    name: "Time",
    base: "s",
    reference: 3600,
    scene: "time",
    context:
      "A clock hand completes one turn per hour. Calendar months and years vary and are excluded.",
    units: [
      u("ns", "Nanosecond", 1e-9),
      u("µs", "Microsecond", 1e-6),
      u("ms", "Millisecond", 0.001),
      u("s", "Second", 1),
      u("min", "Minute", 60),
      u("h", "Hour", 3600),
      u("day", "Day (24 h)", 86400),
      u("week", "Week (7 days)", 604800),
    ],
  },
  {
    id: "speed",
    name: "Speed",
    base: "m/s",
    reference: 40,
    scene: "speed",
    context:
      "A vehicle travels faster as speed rises. The visual scale tops out at 40 m/s.",
    units: [
      u("m/s", "Meters per second", 1),
      u("km/h", "Kilometers per hour", 1 / 3.6),
      u("mph", "Miles per hour", 0.44704),
      u("kn", "Knot", 1852 / 3600),
      u("ft/s", "Feet per second", 0.3048),
    ],
  },
  {
    id: "pressure",
    name: "Pressure",
    base: "Pa",
    reference: 200000,
    scene: "pressure",
    context:
      "A piston compresses as pressure increases. This is an illustration, not a gas-law simulation.",
    units: [
      u("Pa", "Pascal", 1),
      u("kPa", "Kilopascal", 1000),
      u("MPa", "Megapascal", 1e6),
      u("bar", "Bar", 1e5),
      u("mbar", "Millibar", 100),
      u("atm", "Standard atmosphere", 101325),
      u("psi", "Pounds per square inch", 6894.757293168),
      u("Torr", "Torr", 101325 / 760),
    ],
  },
  {
    id: "energy",
    name: "Energy",
    base: "J",
    reference: 3600000,
    scene: "energy",
    context: "A battery fills to represent up to 1 kWh of stored energy.",
    units: [
      u("J", "Joule", 1),
      u("kJ", "Kilojoule", 1000),
      u("MJ", "Megajoule", 1e6),
      u("Wh", "Watt-hour", 3600),
      u("kWh", "Kilowatt-hour", 3600000),
      u("cal", "Thermochemical calorie", 4.184),
      u("kcal", "Kilocalorie", 4184),
      u("BTU IT", "International table BTU", 1055.05585262),
    ],
  },
  {
    id: "power",
    name: "Power",
    base: "W",
    reference: 1000,
    scene: "power",
    context: "A lamp becomes brighter up to 1 kW. Power is energy per second.",
    units: [
      u("mW", "Milliwatt", 0.001),
      u("W", "Watt", 1),
      u("kW", "Kilowatt", 1000),
      u("MW", "Megawatt", 1e6),
      u("hp", "Mechanical horsepower", 745.6998715822702),
    ],
  },
  {
    id: "angle",
    name: "Angle",
    base: "rad",
    reference: Math.PI * 2,
    scene: "angle",
    context: "A hinged arm turns through a full circle at 2π radians.",
    units: [
      u("°", "Degree", Math.PI / 180),
      u("rad", "Radian", 1),
      u("grad", "Gradian", Math.PI / 200),
      u("turn", "Full turn", 2 * Math.PI),
      u("arcmin", "Arcminute", Math.PI / 10800),
      u("arcsec", "Arcsecond", Math.PI / 648000),
    ],
  },
  {
    id: "data",
    name: "Digital storage",
    base: "bit",
    reference: 8e9,
    scene: "data",
    context:
      "Storage blocks fill a 1 GB rack. SI kB uses 1,000; IEC KiB uses 1,024.",
    units: [
      u("bit", "Bit", 1),
      u("B", "Byte", 8),
      u("kB", "Kilobyte (SI)", 8e3),
      u("MB", "Megabyte (SI)", 8e6),
      u("GB", "Gigabyte (SI)", 8e9),
      u("TB", "Terabyte (SI)", 8e12),
      u("KiB", "Kibibyte (IEC)", 8192),
      u("MiB", "Mebibyte (IEC)", 8388608),
      u("GiB", "Gibibyte (IEC)", 8589934592),
      u("TiB", "Tebibyte (IEC)", 8796093022208),
    ],
  },
  {
    id: "frequency",
    name: "Frequency",
    base: "Hz",
    reference: 10,
    scene: "frequency",
    context: "A wave displays up to ten cycles per illustrated time span.",
    units: [
      u("Hz", "Hertz", 1),
      u("kHz", "Kilohertz", 1000),
      u("MHz", "Megahertz", 1e6),
      u("GHz", "Gigahertz", 1e9),
      u("rpm", "Revolutions per minute", 1 / 60),
    ],
  },
  {
    id: "force",
    name: "Force",
    base: "N",
    reference: 100,
    scene: "force",
    context:
      "A spring stretches as force rises to 100 N. This is an illustrative linear spring.",
    units: [
      u("N", "Newton", 1),
      u("kN", "Kilonewton", 1000),
      u("lbf", "Pound-force", 4.4482216152605),
      u("kgf", "Kilogram-force", 9.80665),
      u("dyn", "Dyne", 1e-5),
    ],
  },
  {
    id: "density",
    name: "Density",
    base: "kg/m³",
    reference: 2000,
    scene: "density",
    context:
      "A fixed vessel contains more particles as density increases. Particle count is illustrative.",
    units: [
      u("kg/m³", "Kilograms per cubic meter", 1),
      u("g/cm³", "Grams per cubic centimeter", 1000),
      u("kg/L", "Kilograms per liter", 1000),
      u("g/mL", "Grams per milliliter", 1000),
      u("lb/ft³", "Pounds per cubic foot", 16.01846337396),
    ],
  },
  {
    id: "current",
    name: "Electric current",
    base: "A",
    reference: 10,
    scene: "current",
    context:
      "More charge markers move through a wire as current increases to 10 A.",
    units: [
      u("µA", "Microampere", 1e-6),
      u("mA", "Milliampere", 0.001),
      u("A", "Ampere", 1),
      u("kA", "Kiloampere", 1000),
    ],
  },
  {
    id: "voltage",
    name: "Voltage",
    base: "V",
    reference: 240,
    scene: "voltage",
    context:
      "A potential meter rises to 240 V. The visual does not model electrical safety or a real circuit.",
    units: [
      u("µV", "Microvolt", 1e-6),
      u("mV", "Millivolt", 0.001),
      u("V", "Volt", 1),
      u("kV", "Kilovolt", 1000),
    ],
  },
];
export function convert(
  quantity: Quantity,
  value: number,
  fromId: string,
  toId: string,
) {
  const from = quantity.units.find((u) => u.id === fromId),
    to = quantity.units.find((u) => u.id === toId);
  if (!from || !to || !Number.isFinite(value))
    throw new Error("Enter a finite number and choose two units.");
  const base = value * from.factor + (from.offset || 0);
  if (base < -1e-10 && quantity.id !== "angle")
    throw new Error(
      quantity.id === "temperature"
        ? "Temperature cannot be below absolute zero."
        : "Use a non-negative measurement.",
    );
  const result =
    (Math.max(quantity.id === "angle" ? -Infinity : 0, base) -
      (to.offset || 0)) /
    to.factor;
  if (!Number.isFinite(result))
    throw new Error("This number exceeds the supported numerical range.");
  return {
    result,
    base: Math.max(quantity.id === "angle" ? -Infinity : 0, base),
    from,
    to,
  };
}
export function numberText(value: number) {
  if (!Number.isFinite(value)) return "Outside numerical range";
  if (value !== 0 && (Math.abs(value) < 1e-6 || Math.abs(value) >= 1e12))
    return value.toExponential(8).replace(/\.?0+e/, "e");
  return Number(value.toPrecision(12)).toLocaleString(undefined, {
    maximumFractionDigits: 10,
  });
}
