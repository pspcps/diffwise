export interface JsonArrayLength {
  offset: number;
  length: number;
}
/** Scan valid JSON while ignoring brackets and commas inside quoted strings. */
export function jsonArrayLengths(text: string): JsonArrayLength[] {
  try {
    JSON.parse(text);
  } catch {
    return [];
  }
  const arrays: JsonArrayLength[] = [];
  const stack: {
    array: boolean;
    offset: number;
    length: number;
    expecting: boolean;
  }[] = [];
  const value = () => {
    const frame = stack[stack.length - 1];
    if (frame?.array && frame.expecting) {
      frame.length++;
      frame.expecting = false;
    }
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (/\s/.test(c)) continue;
    if (c === '"') {
      value();
      while (++i < text.length) {
        if (text[i] === "\\") i++;
        else if (text[i] === '"') break;
      }
      continue;
    }
    if (c === "[" || c === "{") {
      value();
      stack.push({ array: c === "[", offset: i, length: 0, expecting: true });
      continue;
    }
    if (c === "]" || c === "}") {
      const frame = stack.pop();
      if (frame?.array)
        arrays.push({ offset: frame.offset, length: frame.length });
      continue;
    }
    if (c === ",") {
      const frame = stack[stack.length - 1];
      if (frame?.array) frame.expecting = true;
      continue;
    }
    if (c !== ":") value();
  }
  return arrays.sort((a, b) => a.offset - b.offset);
}
