export interface SeoPage {
  slug: string;
  h1: string;
  title: string;
  description: string;
  intro: string[];
  example: string;
  exampleContext: string;
  faq: { q: string; a: string }[];
}

export const seoPages: SeoPage[] = [
  {
    slug: "vlookup-na-error",
    h1: "How to Fix the VLOOKUP #N/A Error",
    title: "VLOOKUP #N/A Error — Instant Fix | FormulaFix",
    description: "VLOOKUP returning #N/A? Paste your formula and get a plain-English explanation plus a fixed version in seconds.",
    intro: [
      "The #N/A error is VLOOKUP's way of saying \"I looked, but I couldn't find your value.\" It's the single most common Excel error, and in most cases the formula itself is fine — the problem hides in the data.",
      "The top three causes: stray spaces in the lookup value or the table (invisible but fatal), numbers stored as text on one side and real numbers on the other, and searching in the wrong column — VLOOKUP only ever looks in the first column of the range you give it.",
      "Paste your formula below. We'll spot which cause applies and hand you a corrected version, often with TRIM or a switch to INDEX/MATCH or XLOOKUP.",
    ],
    example: "=VLOOKUP(D2,A:B,2,FALSE)",
    exampleContext: "Returns #N/A but I can see the value in column A",
    faq: [
      { q: "Why does VLOOKUP return #N/A when the value clearly exists?", a: "Almost always: invisible spaces or a text-vs-number mismatch. Wrap the lookup value in TRIM() or convert both sides to the same type." },
      { q: "How do I hide the #N/A error?", a: "Wrap the formula in IFERROR: =IFERROR(VLOOKUP(...),\"not found\"). But fix the cause first — hiding errors hides bugs." },
      { q: "Should I use XLOOKUP instead?", a: "If you're on Excel 2021+ or Microsoft 365 — yes. XLOOKUP searches any column, defaults to exact match, and has a built-in not-found argument." },
    ],
  },
  {
    slug: "vlookup-not-working",
    h1: "VLOOKUP Not Working? Here's the Fix",
    title: "VLOOKUP Not Working — Diagnose & Fix Instantly | FormulaFix",
    description: "VLOOKUP returning wrong values or errors? Paste it here and get the exact cause and a fixed formula.",
    intro: [
      "\"Not working\" usually means one of two things: VLOOKUP throws an error (#N/A, #REF!, #VALUE!) or — worse — it silently returns the wrong value.",
      "The silent-wrong-value case is almost always the missing 4th argument. Without FALSE at the end, VLOOKUP assumes your data is sorted and happily returns a \"close enough\" match. The #REF! case means your column number is bigger than your range is wide.",
      "Paste your formula below and we'll tell you which of these is biting you.",
    ],
    example: "=VLOOKUP(A2,Sheet2!A:B,2)",
    exampleContext: "Sometimes returns values that don't match",
    faq: [
      { q: "Why does VLOOKUP return the wrong value without any error?", a: "Missing FALSE as the 4th argument. VLOOKUP defaults to approximate match, which requires sorted data and silently returns near-matches." },
      { q: "Why does VLOOKUP return #REF!?", a: "Your column index number is larger than the number of columns in the range. VLOOKUP(A2,B:C,3,...) fails because B:C is only 2 columns wide." },
      { q: "Can VLOOKUP look to the left?", a: "No — it only searches the first column of the range and returns from columns to the right. Use INDEX/MATCH or XLOOKUP for left lookups." },
    ],
  },
  {
    slug: "value-error-excel",
    h1: "How to Fix the #VALUE! Error in Excel",
    title: "#VALUE! Error in Excel — Instant Fix | FormulaFix",
    description: "Excel showing #VALUE!? Paste your formula and find out exactly which part chokes and how to fix it.",
    intro: [
      "#VALUE! means Excel expected one type of data and got another — most often, it tried to do math on text. The formula =A1+B1 breaks the moment B1 contains \"N/A\", a space, or a number stored as text.",
      "It's sneaky because the cell can *look* like a number. A leading apostrophe, an import from a bank statement or a CSV, and Excel treats it as text while displaying it identically.",
      "Paste your formula below — we'll point at the argument that's causing it and suggest the conversion or the error-proof wrapper.",
    ],
    example: "=A1+B1",
    exampleContext: "B1 has a number but I get #VALUE!",
    faq: [
      { q: "Why do I get #VALUE! when both cells contain numbers?", a: "One of them is a number stored as text. Check with =ISTEXT(B1). Fix with VALUE(B1), or select the column and use Data → Text to Columns." },
      { q: "How do I make SUM ignore text?", a: "SUM already ignores text cells. #VALUE! from arithmetic means you used + instead — replace =A1+B1+C1 with =SUM(A1:C1)." },
      { q: "Does #VALUE! ever come from dates?", a: "Yes — dates stored as text in a formula that expects real dates. Use DATEVALUE() to convert." },
    ],
  },
  {
    slug: "ref-error-excel",
    h1: "How to Fix the #REF! Error in Excel",
    title: "#REF! Error in Excel — Instant Fix | FormulaFix",
    description: "Excel showing #REF!? It means a reference points to cells that no longer exist. Paste your formula for an instant fix.",
    intro: [
      "#REF! means \"the cells this formula pointed to are gone.\" It appears when you delete rows or columns a formula depended on, or when a lookup asks for a column outside its range.",
      "Once #REF! is baked into a formula (=A1+#REF!), Excel can't recover the original reference — you have to restore it yourself or rebuild the formula. Prevention beats cure: ranges like A:C survive deletions better than fixed cells.",
      "Paste the formula below (even with #REF! inside) and we'll reconstruct the most likely intended version.",
    ],
    example: "=VLOOKUP(A2,B:C,3,FALSE)",
    exampleContext: "",
    faq: [
      { q: "Can I undo a #REF! error?", a: "If you just deleted the rows — Ctrl+Z restores everything. If the file was saved after, you'll need to rebuild the reference manually." },
      { q: "Why does my VLOOKUP show #REF! without deleting anything?", a: "Your column index exceeds the range width. Asking for column 3 in a 2-column range B:C is a #REF! by definition." },
      { q: "How do I find all #REF! errors in a sheet?", a: "Home → Find & Select → Go To Special → Formulas → Errors. Or filter with =ISREF()." },
    ],
  },
  {
    slug: "name-error-excel",
    h1: "How to Fix the #NAME? Error in Excel",
    title: "#NAME? Error in Excel — Instant Fix | FormulaFix",
    description: "Excel showing #NAME?? It doesn't recognize something in your formula. Paste it and get the corrected version instantly.",
    intro: [
      "#NAME? means Excel doesn't recognize a word in your formula. Ninety percent of the time it's a typo in a function name — VLOKUP, SUMM, COUNTIIF — the other ten percent: missing quotes around text, or a function your Excel version doesn't have yet.",
      "Version gaps are the sneaky case: XLOOKUP, TEXTSPLIT, FILTER and LAMBDA don't exist in Excel 2016/2019. A file from a colleague on Microsoft 365 opens on your machine full of #NAME? errors, and nothing is \"wrong\" with the formula.",
      "Paste your formula below — typos get corrected automatically, and version issues get flagged with the compatible alternative.",
    ],
    example: "=VLOKUP(A2,B:C,2,FALSE)",
    exampleContext: "",
    faq: [
      { q: "The function name is spelled right — why #NAME??", a: "Your Excel version may not have it (XLOOKUP needs 2021+), or text arguments are missing quotes: =IF(A1=yes,1,0) needs \"yes\"." },
      { q: "Why does my named range show #NAME??", a: "The name was deleted or is scoped to another workbook. Check Formulas → Name Manager." },
      { q: "Do I need to enable anything for new functions?", a: "No — if your version has them, they work. #NAME? on XLOOKUP means your Excel is older than 2021." },
    ],
  },
  {
    slug: "circular-reference-excel",
    h1: "How to Find and Fix Circular References in Excel",
    title: "Circular Reference in Excel — Find & Fix | FormulaFix",
    description: "Excel warns about a circular reference? Learn how to find the loop and break it, or paste your formula for instant help.",
    intro: [
      "A circular reference means a formula depends on its own result — directly (=A1+1 sitting in A1) or through a chain (A1 depends on B1, which depends on A1). Excel either shows a warning, or silently displays 0.",
      "Finding the loop is the hard part in big workbooks. Excel helps: Formulas → Error Checking → Circular References shows the cell address of one link in the chain. Fix that one and the next link (if any) appears.",
      "Paste your formula and tell us which cell it lives in — we'll spot self-references immediately.",
    ],
    example: "=SUM(A1:A10)",
    exampleContext: "This formula is in cell A10",
    faq: [
      { q: "Where does Excel show circular references?", a: "Formulas tab → Error Checking dropdown → Circular References. The status bar bottom-left also shows the cell address." },
      { q: "Why does the cell show 0 instead of a warning?", a: "Iterative calculation is enabled (File → Options → Formulas). Excel runs the loop a fixed number of times instead of stopping." },
      { q: "Are circular references ever intentional?", a: "Rarely — some financial models use them with iterative calc on purpose. If you didn't plan one, it's a bug." },
    ],
  },
  {
    slug: "xlookup-na-error",
    h1: "How to Fix the XLOOKUP #N/A Error",
    title: "XLOOKUP #N/A Error — Instant Fix | FormulaFix",
    description: "XLOOKUP returning #N/A? Paste your formula and get the cause and corrected version in seconds.",
    intro: [
      "XLOOKUP fixed most of VLOOKUP's problems, but #N/A survived: it still means \"value not found.\" The good news — XLOOKUP has a built-in cure that most people don't use: the 4th argument, if_not_found.",
      "=XLOOKUP(A2,B:B,C:C,\"not found\") replaces the ugly error with your own text, no IFERROR wrapper needed. If the value *should* exist, the usual suspects apply: stray spaces and text-vs-number mismatches.",
      "Paste your XLOOKUP below and we'll tell you whether it's a data issue or a formula issue.",
    ],
    example: "=XLOOKUP(A2,B:B,C:C)",
    exampleContext: "Returns #N/A but the value is in column B",
    faq: [
      { q: "How is XLOOKUP's #N/A different from VLOOKUP's?", a: "Same meaning — not found. But XLOOKUP has the built-in if_not_found argument, so you rarely need IFERROR." },
      { q: "Does XLOOKUP have the approximate-match trap?", a: "No — it defaults to exact match. That whole class of silent VLOOKUP bugs doesn't exist with XLOOKUP." },
      { q: "Why does XLOOKUP show #NAME? instead?", a: "Your Excel is older than 2021 — XLOOKUP doesn't exist there. Use INDEX/MATCH as the compatible alternative." },
    ],
  },
  {
    slug: "sumif-not-working",
    h1: "SUMIF Not Working? Here's Why",
    title: "SUMIF Not Working — Diagnose & Fix | FormulaFix",
    description: "SUMIF returning 0 or wrong totals? Paste your formula and get the exact cause plus a fixed version.",
    intro: [
      "SUMIF \"not working\" usually means it returns 0 or a wrong total, not an error. The formula runs fine — it just doesn't match what you think it should match.",
      "Classic causes: criteria as a number when the column holds text-numbers (or vice versa), comparison operators without quotes (>100 must be \">100\"), and mismatched range sizes between the criteria range and the sum range.",
      "Paste your SUMIF below — we'll spot the mismatch and hand you the corrected version, or suggest SUMIFS where it's cleaner.",
    ],
    example: "=SUMIF(A:A,>100,B:B)",
    exampleContext: "Returns 0",
    faq: [
      { q: "Why does SUMIF with a condition like >100 return 0?", a: "Operators must be quoted: =SUMIF(A:A,\">100\",B:B). Unquoted, Excel reads it as a syntax error or a literal name." },
      { q: "SUMIF matches nothing but the values are there — why?", a: "Text vs number mismatch. If column A holds text-formatted numbers, the numeric criteria 100 won't match \"100\"." },
      { q: "When should I use SUMIFS instead?", a: "Always, arguably — SUMIFS handles one or many conditions with a cleaner argument order (sum range first) and is the modern standard." },
    ],
  },
  {
    slug: "index-match-na",
    h1: "How to Fix INDEX MATCH Returning #N/A",
    title: "INDEX MATCH #N/A — Instant Fix | FormulaFix",
    description: "INDEX/MATCH combo returning #N/A? Paste your formula and get a plain-English diagnosis and a fix.",
    intro: [
      "In an INDEX/MATCH combo, the #N/A always comes from MATCH — it couldn't find your value. INDEX just passes the error along.",
      "Check three things: the third MATCH argument must be 0 for exact match (omit it and you get the same silent-wrong-value trap as VLOOKUP), the lookup value must be truly identical (spaces! text-numbers!), and the MATCH range must be a single column or row.",
      "Paste the full combo below — we'll isolate which argument breaks it.",
    ],
    example: "=INDEX(C:C,MATCH(E2,A:A))",
    exampleContext: "Returns wrong rows sometimes, #N/A other times",
    faq: [
      { q: "Why does MATCH need the ,0 at the end?", a: "Without it MATCH defaults to approximate search on sorted data — wrong or missing values on unsorted data. Always add ,0 for exact match." },
      { q: "INDEX MATCH or XLOOKUP?", a: "XLOOKUP if your Excel is 2021+. INDEX/MATCH remains the compatible workhorse for older versions and left-lookups in legacy files." },
      { q: "Can MATCH search a 2D range?", a: "No — one row or one column only. A 2D range in MATCH returns #N/A regardless of the data." },
    ],
  },
  {
    slug: "div0-error-excel",
    h1: "How to Fix and Hide the #DIV/0! Error in Excel",
    title: "#DIV/0! Error in Excel — Fix & Hide | FormulaFix",
    description: "Excel showing #DIV/0!? Learn the one-line fix with IFERROR and when your data — not the formula — is the real problem.",
    intro: [
      "#DIV/0! is the most honest Excel error: you divided by zero or by an empty cell. Averages over empty ranges produce it too — AVERAGEIF with no matching rows divides by zero internally.",
      "The one-line fix is wrapping the division in IFERROR: =IFERROR(A1/B1,0) shows 0 instead of the error. Choose the fallback deliberately — 0, empty text \"\", or \"n/a\" mean different things in a report.",
      "Paste your formula below and we'll wrap it correctly, or flag when the empty divisor is the real bug to fix upstream.",
    ],
    example: "=A1/B1",
    exampleContext: "B1 is sometimes empty",
    faq: [
      { q: "Should I use IFERROR or IF(B1=0,...)?", a: "IF(B1=0,0,A1/B1) is more precise — it only guards division by zero. IFERROR also swallows other errors, which can hide real bugs." },
      { q: "Why does AVERAGEIF show #DIV/0!?", a: "No rows matched your criteria, so it averaged zero cells. Wrap in IFERROR or check the criteria." },
      { q: "How do I hide #DIV/0! in a whole column?", a: "Wrap the formula in IFERROR and fill down. There's no sheet-wide setting to suppress it." },
    ],
  },
];

export function getPage(slug: string): SeoPage | undefined {
  return seoPages.find((p) => p.slug === slug);
}
