// Regenerates browser/files.json: path, size and git blob sha of every file under the game folders and the five browser/<game>.json files, so FECK can list the library
// from raw.githubusercontent.com at a pinned commit without the GitHub tree API. Zero dependencies: node _tools/make-browser-files.mjs [--check]
// The data is git's own (ls-tree of HEAD), so a sha is the blob sha GitHub serves and size is the stored size, whatever core.autocrlf does
// to the working tree. Generate it after the commit that holds the content: the file lists HEAD, not uncommitted changes, and leaves out
// browser/files.json itself. "commit" names that HEAD (the parent of the commit that adds the file). --check ignores "commit" and exits 1 when stale.
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const git = (...a) => execFileSync("git", ["-C", root, ...a], { encoding: "buffer", maxBuffer: 1 << 29 });
const commit = git("rev-parse", "HEAD").toString("utf8").trim();
const GAMES = new Set(["FE6", "FE7J", "FE7U", "FE8J", "FE8U"]);
const files = [];
for (const rec of git("ls-tree", "-r", "-l", "-z", "HEAD").toString("utf8").split("\0")) {
  const m = /^\d+ blob ([0-9a-f]{40}) +(\d+)\t([^]*)$/.exec(rec);
  if (!m || !(GAMES.has(m[3].split("/")[0]) || /^browser\/FE(6|7J|7U|8J|8U)\.json$/.test(m[3]))) continue;
  files.push({ path: m[3], size: Number(m[2]), sha: m[1] });
}
files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));

const body = (c) => '{"schema":1,"commit":' + JSON.stringify(c) + ',"count":' + files.length + ',"files":[\n' + files.map((f) => JSON.stringify(f)).join(",\n") + "\n]}\n";
const file = join(root, "browser", "files.json");
if (process.argv.includes("--check")) {
  let cur = ""; try { cur = readFileSync(file, "utf8"); } catch {}
  const old = /^\{"schema":1,"commit":"[0-9a-f]+"/.exec(cur);
  const same = !!old && cur === body(/"commit":"([0-9a-f]+)"/.exec(cur)[1]);
  console.log("browser/files.json", same ? "is current" : "is stale");
  process.exit(same ? 0 : 1);
}
mkdirSync(join(root, "browser"), { recursive: true });
writeFileSync(file, body(commit));
console.log("browser/files.json:", files.length, "files at", commit.slice(0, 8));
