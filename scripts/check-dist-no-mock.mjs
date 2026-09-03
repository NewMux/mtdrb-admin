// Fails the build if the mock Supabase backend (src/mocks/) made it into
// the production bundle. This is a safety net for the fix that made mock
// mode a build-time-only concept (import.meta.env.DEV), never a runtime
// hostname check -- see IS_MOCK_MODE in src/supabaseClient.ts. Rollup's
// tree-shaking should already drop src/mocks/ entirely once the mock
// branch is provably dead in production, but this check catches a
// regression directly rather than relying on that optimization holding.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const DIST_DIR = "dist";
// Distinctive strings unique to the mock client, unlikely to appear in
// legitimate bundled code.
const MOCK_MARKERS = [
  "mock-user-localhost",
  "createMockSupabaseClient",
];

function collectFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...collectFiles(fullPath));
    } else if (entry.endsWith(".js")) {
      files.push(fullPath);
    }
  }
  return files;
}

let distStat;
try {
  distStat = statSync(DIST_DIR);
} catch {
  console.error(`check-dist-no-mock: ${DIST_DIR}/ not found. Run this after \`vite build\`.`);
  process.exit(1);
}

if (!distStat.isDirectory()) {
  console.error(`check-dist-no-mock: ${DIST_DIR} is not a directory.`);
  process.exit(1);
}

const offenders = [];
for (const file of collectFiles(DIST_DIR)) {
  const content = readFileSync(file, "utf8");
  for (const marker of MOCK_MARKERS) {
    if (content.includes(marker)) {
      offenders.push({ file, marker });
    }
  }
}

if (offenders.length > 0) {
  console.error(
    "check-dist-no-mock: the production build contains the mock Supabase backend. " +
      "This must never ship -- it auto-authenticates as an admin with no login. " +
      "Found:",
  );
  for (const { file, marker } of offenders) {
    console.error(`  - "${marker}" in ${file}`);
  }
  process.exit(1);
}

console.log("check-dist-no-mock: production build does not contain the mock backend.");
