import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { corsHeaders } from "./http.ts";

// The browser sends the app's global Supabase headers with every function call
// (supabase.functions.invoke merges them in). A header the function does not list
// in Access-Control-Allow-Headers makes the browser block the call after the
// preflight, which surfaced as "Could not reach billing" when adding a branch.
const SAFELISTED = new Set(["accept", "accept-language", "content-language", "content-type"]);

function appGlobalHeaders(): string[] {
  const source = readFileSync(resolve(process.cwd(), "src/supabaseClient.ts"), "utf8");
  const block = /global:\s*\{\s*headers:\s*\{([^}]*)\}/s.exec(source)?.[1] ?? "";
  return [...block.matchAll(/["']([A-Za-z][\w-]*)["']\s*:/g)].map((m) => m[1].toLowerCase());
}

describe("corsHeaders", () => {
  const allowed = (corsHeaders("https://app.example", ["https://app.example"])["Access-Control-Allow-Headers"] ?? "")
    .split(",")
    .map((h) => h.trim().toLowerCase());

  it("allows every header the app's Supabase client sends", () => {
    const sent = appGlobalHeaders();
    expect(sent.length).toBeGreaterThan(0);
    for (const header of sent.filter((h) => !SAFELISTED.has(h))) {
      expect(allowed, `${header} is sent by src/supabaseClient.ts`).toContain(header);
    }
  });

  it("still allows the headers supabase-js itself adds", () => {
    for (const header of ["authorization", "apikey", "content-type", "x-client-info"]) expect(allowed).toContain(header);
  });

  it("gives nothing to an origin that is not on the list", () => {
    expect(corsHeaders("https://evil.example", ["https://app.example"])).toEqual({});
  });
});
