// Runs before `next build` (npm "prebuild"). Gives public/sw.js a new cache
// version on every deploy, so browsers install the new worker, drop the old
// caches, and reload any open app window that still shows an old version.
import { readFileSync, writeFileSync } from "node:fs";

const file = new URL("../public/sw.js", import.meta.url);
const version = `d${process.env.VERCEL_DEPLOYMENT_ID ?? Date.now()}`
  .replace(/[^a-zA-Z0-9_-]/g, "")
  .slice(0, 40);

const source = readFileSync(file, "utf8");
const next = source.replace(
  /const CACHE_VERSION = "[^"]*";/,
  `const CACHE_VERSION = "${version}";`
);

if (next === source && !source.includes(`"${version}"`)) {
  console.warn("[stamp-sw] CACHE_VERSION line not found; sw.js left unchanged.");
} else {
  writeFileSync(file, next);
  console.log(`[stamp-sw] CACHE_VERSION = ${version}`);
}
