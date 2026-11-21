// Runs every assert-based *.test.ts self-check with tsx; exits non-zero if any fails.
import { globSync } from "node:fs";
import { spawnSync } from "node:child_process";

const files = globSync("{src,scraper}/**/*.test.ts").sort();
let failed = 0;
for (const file of files) {
  const r = spawnSync("npx", ["tsx", file], { stdio: "pipe", encoding: "utf8", shell: true });
  if (r.status === 0) console.log(`PASS ${file}`);
  else {
    failed++;
    console.log(`FAIL ${file}\n${r.stdout}${r.stderr}`);
  }
}
console.log(`\n${files.length - failed}/${files.length} passed`);
process.exit(failed ? 1 : 0);
