import guides from "./tool-guides.json";
interface Guide {
  title: string;
  scenario: string;
  input: string;
  output: string;
  explanation: string;
  notes: string[];
}
export default function ToolGuide({ toolId }: { toolId: string }) {
  const guide = (guides as Record<string, Guide>)[toolId];
  if (!guide) return null;
  return (
    <section
      className="worked-guide"
      aria-label="Worked example and limitations"
    >
      <p className="search-eyebrow">PRACTICAL WALKTHROUGH</p>
      <h3>{guide.title}</h3>
      <p>{guide.scenario}</p>
      <div className="worked-example-grid">
        <section>
          <h4>Example input or setup</h4>
          <pre>{guide.input}</pre>
        </section>
        <section>
          <h4>Expected result</h4>
          <pre>{guide.output}</pre>
        </section>
      </div>
      <p>{guide.explanation}</p>
      <h4>Before you rely on the result</h4>
      <ul>
        {guide.notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </section>
  );
}
