import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const full = process.argv.includes("--full");
const cacheOnly = process.argv.includes("--cache");

const cachePaths = [
  join(".next", "cache"),
  ".cache",
  join("node_modules", ".cache"),
];

const fullPaths = [".next", ...cachePaths];

const paths = full || !cacheOnly ? fullPaths : cachePaths;

function removePath(relativePath) {
  const target = join(root, relativePath);
  if (!existsSync(target)) {
    console.log(`skip (not found): ${relativePath}`);
    return;
  }
  rmSync(target, { recursive: true, force: true });
  console.log(`removed: ${relativePath}`);
}

const label = full ? "full" : cacheOnly ? "cache" : "default";
console.log(`Cleaning Next.js build cache (${label})...\n`);

for (const path of paths) {
  removePath(path);
}

if (full) {
  console.log("\nFull clean: removing node_modules and reinstalling...\n");
  removePath("node_modules");
  execSync("npm install", { stdio: "inherit", cwd: root });
}

console.log("\nDone.");
