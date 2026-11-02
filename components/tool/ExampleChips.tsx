const EXAMPLES = [
  { formula: "=VLOOKUP(A2,B:C,3,FALSE)", context: "Getting #REF! error", label: "=VLOOKUP(A2,B:C,3,FALSE) → #REF!" },
  { formula: "=SUM(A1:A10", context: "", label: "=SUM(A1:A10 → missing paren" },
  { formula: "=VLOKUP(A2,B:C,2,FALSE)", context: "Shows #NAME?", label: "=VLOKUP(…) → #NAME?" },
];

export default function ExampleChips({ onPick }: { onPick: (formula: string, context: string) => void }) {
  return (
    <section className="examples">
      <h2>Try an example</h2>
      <div className="example-chips">
        {EXAMPLES.map((e) => (
          <button key={e.formula} className="chip" onClick={() => onPick(e.formula, e.context)}>
            {e.label}
          </button>
        ))}
      </div>
    </section>
  );
}
