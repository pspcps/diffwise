import { useRef, type TextareaHTMLAttributes } from "react";

function colorTokens(text: string) {
  let depth = 0;
  const parts = text.split(
    /("(?:\\.|[^"\\])*"\s*:|"(?:\\.|[^"\\])*"|'[^'\n]*'|\b(?:true|false|null|undefined)\b|\b-?\d+(?:\.\d+)?\b|[[\]{}()])/g,
  );
  const tokens: { part: string; kind: string }[] = [];
  for (const part of parts) {
    let kind = "";
    if (part.length === 1 && "})]".includes(part))
      depth = Math.max(0, depth - 1);
    if (part.length === 1 && "{}[]()".includes(part))
      kind = `bracket-${depth % 3}`;
    else if (/^".*:\s*$/.test(part)) kind = "key";
    else if (/^["']/.test(part)) kind = "string";
    else if (/^(true|false)$/.test(part)) kind = "boolean";
    else if (/^(null|undefined)$/.test(part)) kind = "null";
    else if (/^-?\d/.test(part)) kind = "number";
    if (part.length === 1 && "{[(".includes(part)) depth++;
    tokens.push({ part, kind });
  }
  return tokens;
}
export function SyntaxText({ text }: { text: string }) {
  return (
    <>
      {colorTokens(text).map(({ part, kind }, i) => (
        <span key={i} className={kind ? `syntax-${kind}` : undefined}>
          {part}
        </span>
      ))}
    </>
  );
}

export default function SyntaxInput(
  props: TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  const preview = useRef<HTMLPreElement>(null);
  const text = String(props.value ?? "");
  // Keep very large inputs responsive; the comparison editor still provides syntax coloring.
  const highlight = text.length < 150000;
  return (
    <div className="syntax-input">
      <pre ref={preview} aria-hidden="true" className="syntax-preview">
        {highlight ? <SyntaxText text={text} /> : text}
        {"\n"}
      </pre>
      <textarea
        {...props}
        className={`${props.className || ""} syntax-overlay`}
        onScroll={(event) => {
          if (preview.current) {
            preview.current.scrollTop = event.currentTarget.scrollTop;
            preview.current.scrollLeft = event.currentTarget.scrollLeft;
          }
          props.onScroll?.(event);
        }}
      />
    </div>
  );
}
