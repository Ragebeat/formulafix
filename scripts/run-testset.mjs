#!/usr/bin/env node
/**
 * Runs the 20-case test set against /api/analyze.
 * Usage:
 *   1. Set TEST_MODE=1 in .env.local (bypasses the quota) and restart the server
 *   2. node scripts/run-testset.mjs [http://localhost:3000]
 * Output: a table in the console and test-results.json
 */

const BASE = process.argv[2] || "http://localhost:3001";
const DELAY_MS = 5000;      // pause between cases (free tiers rate-limit bursts)
const RETRY_WAIT_MS = 20000; // wait before retrying after a 429/502
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function callApi(c) {
  const res = await fetch(`${BASE}/api/analyze`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ formula: c.f, context: c.ctx, dialect: c.d }),
    signal: AbortSignal.timeout(60000),
  });
  return { res, raw: await res.text() };
}

const longIf = "=IF(A1>90,\"A\"," + "IF(A1>80,\"B\",".repeat(30) + "\"F\"" + ")".repeat(31);

// expect.verdict / expect.error: lists of accepted values; error [null] means "not checked"
const CASES = [
  { n: 1,  f: '=VLOOKUP(A2,B:C,3,FALSE)', ctx: "", d: "excel", expect: { verdict: ["broken"], error: ["#REF!"] } },
  { n: 2,  f: '=VLOOKUP(A2,Sheet2!A:B,2)', ctx: "sometimes returns values that don't match", d: "excel", expect: { verdict: ["broken"], error: ["logic"] } },
  { n: 3,  f: '=A1+B1', ctx: "B1 contains the text 'N/A', I get #VALUE!", d: "excel", expect: { verdict: ["broken"], error: ["#VALUE!"] } },
  { n: 4,  f: '=SUM(A1:A10', ctx: "", d: "excel", expect: { verdict: ["broken"], error: ["syntax"] } },
  { n: 5,  f: '=INDEX(A:A,MATCH(D1,B:B,0))', ctx: "returns #N/A but the value is in column B; D1 might have a trailing space", d: "excel", expect: { verdict: ["broken"], error: ["#N/A"] } },
  { n: 6,  f: '=A1/B1', ctx: "B1 is sometimes 0", d: "excel", expect: { verdict: ["broken", "ok"], error: ["#DIV/0!", null] } },
  { n: 7,  f: '=SUMIF(A:A,">100",B:B)', ctx: "", d: "excel", expect: { verdict: ["ok"], error: [null] } },
  { n: 8,  f: '=A1+1', ctx: "this formula is in cell A1", d: "excel", expect: { verdict: ["broken"], error: ["circular"] } },
  { n: 9,  f: '=VLOKUP(A2,B:C,2,FALSE)', ctx: "", d: "excel", expect: { verdict: ["broken"], error: ["#NAME?"] } },
  { n: 10, f: '=IF(A1>10,"yes")', ctx: "", d: "excel", expect: { verdict: ["broken", "ok"], error: ["logic", null] } },
  { n: 11, f: '=QUERY(A:C,"select A where B > 100 and")', ctx: "", d: "sheets", expect: { verdict: ["broken"], error: ["syntax", "#VALUE!", "logic"] } },
  { n: 12, f: '=IMPORTRANGE("https://docs.google.com/spreadsheets/d/abc","Sheet1!A:B")', ctx: "shows #REF! You don't have permissions", d: "sheets", expect: { verdict: ["broken", "ok"], error: ["#REF!", null] } },
  { n: 13, f: '=ARRAYFORMULA(SUM(A:A*B:B))', ctx: "", d: "sheets", expect: { verdict: ["ok", "broken"], error: [null, "logic"] } },
  { n: 14, f: '=FILTER(A:A,B1:B10)', ctx: "", d: "sheets", expect: { verdict: ["broken"], error: ["#VALUE!", "logic", "#N/A"] } },
  { n: 15, f: '=GOOGLEFINANCE("MCD","price")', ctx: "", d: "sheets", expect: { verdict: ["ok"], error: [null] } },
  { n: 16, f: longIf, ctx: "", d: "excel", expect: { verdict: ["ok", "broken"], error: [null, "logic", "syntax"] } },
  { n: 17, f: '=SUM(Лист2!A1:A10)', ctx: "sheet name is in Russian", d: "excel", expect: { verdict: ["ok"], error: [null] } },
  { n: 18, f: '=SUM(A1;A10)', ctx: "European locale, semicolons as separators", d: "excel", expect: { verdict: ["ok", "broken"], error: [null, "logic"] } },
  { n: 19, f: 'SUM(A1:A10)', ctx: "no equals sign", d: "excel", expect: { verdict: ["ok", "broken"], error: [null, "syntax"] } },
  { n: 20, f: 'помогите мне с формулой пожалуйста', ctx: "", d: "excel", expect: { verdict: ["unparseable"], error: [null] } },
];

function check(c, r) {
  const v = String(r.verdict || "").trim().toLowerCase();
  const vOk = c.expect.verdict.includes(v);
  const eOk = c.expect.error.includes(r.error_type) || c.expect.error.includes(null);
  // if the error list is only [null], check the verdict alone
  const strictE = c.expect.error.some((x) => x !== null);
  return vOk && (!strictE || c.expect.error.includes(r.error_type) || c.expect.verdict.length > 1 && r.verdict === "ok");
}

const results = [];
let pass = 0;

for (const c of CASES) {
  const started = Date.now();
  let row;
  try {
    let { res, raw } = await callApi(c);
    if (res.status === 502 || res.status === 429) {
      console.log(`   #${c.n}: got ${res.status}, waiting ${RETRY_WAIT_MS / 1000}s and retrying...`);
      await sleep(RETRY_WAIT_MS);
      ({ res, raw } = await callApi(c));
    }
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      row = {
        n: c.n, status: "HTTP " + res.status, verdict: "-", error: "-", ok: false,
        ms: Date.now() - started,
        note: `non-JSON (${res.headers.get("content-type")}): ${raw.replace(/\s+/g, " ").slice(0, 100)}`,
      };
      results.push(row);
      console.log(`❌ #${String(row.n).padStart(2)}  ${row.status}  ${row.note}`);
      continue;
    }
    if (!res.ok) {
      row = { n: c.n, status: "HTTP " + res.status, verdict: "-", error: "-", ok: false, ms: Date.now() - started, note: data.message || data.error };
    } else {
      const ok = check(c, data);
      row = {
        n: c.n, status: "OK", verdict: data.verdict, error: data.error_type ?? "-",
        ok, ms: Date.now() - started, model: data._meta?.model,
        fixed: (data.fixed_formula || "").slice(0, 60),
        expected: `${c.expect.verdict.join("|")} / ${c.expect.error.map((e) => e ?? "-").join("|")}`,
      };
      if (ok) pass++;
    }
  } catch (e) {
    row = { n: c.n, status: "FAIL", verdict: "-", error: "-", ok: false, ms: Date.now() - started, note: String(e).slice(0, 80) };
  }
  results.push(row);
  const mark = row.ok ? "✅" : "❌";
  console.log(`${mark} #${String(row.n).padStart(2)}  ${String(row.verdict).padEnd(12)} ${String(row.error).padEnd(9)} ${String(row.ms).padStart(6)}ms  ${row.note || row.fixed || ""}`);
  if (c !== CASES[CASES.length - 1]) await sleep(DELAY_MS);
}

console.log(`\nRESULT: ${pass}/${CASES.length} passed  (target: 18/20)`);
console.log(`Model: ${results.find((r) => r.model)?.model || "?"}`);

const fs = await import("fs");
fs.writeFileSync("test-results.json", JSON.stringify(results, null, 2));
console.log("Report: test-results.json");
