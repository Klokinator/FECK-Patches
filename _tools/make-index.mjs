// Regenerates INDEX.csv: one row per PATCH_*.txt. Zero dependencies: node _tools/make-index.mjs [--check]
// --check compares with the INDEX.csv on disk and exits 1 when it is stale; without it the file is rewritten.
// Superseded = under an "_older versions" folder. RemovedUpstream = under "_removed-upstream" (which is also its Category).
// Name/Type/Tag/Author are the first NAME.en / NAME / TYPE / TAG / AUTHOR line of the file.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dec = (b) => { try { return new TextDecoder("utf-8", { fatal: true }).decode(b); } catch { return new TextDecoder("shift_jis").decode(b); } };
const rows = [];
const walk = (d) => {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    if (e.name.startsWith(".") || e.name === "_tools") continue;
    const p = join(d, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    if (!/^PATCH_.*\.txt$/i.test(e.name)) continue;
    const parts = relative(root, dirname(p)).split(sep);
    if (parts.length < 2) continue;
    const text = dec(readFileSync(p)).replace(/^﻿/, "");
    const key = (k) => { const m = new RegExp("^" + k.replace(".", "\\.") + "=(.*?)\\r?$", "m").exec(text); return m ? m[1].trim() : ""; };
    rows.push([parts[0], parts[1], parts.includes("_older versions") ? "1" : "0", parts.includes("_removed-upstream") ? "1" : "0",
      parts.join("\\"), e.name, key("NAME.en"), key("NAME"), key("TYPE"), key("TAG"), key("AUTHOR")]);
  }
};
walk(root);
rows.sort((a, b) => (a[4].toLowerCase() < b[4].toLowerCase() ? -1 : a[4].toLowerCase() > b[4].toLowerCase() ? 1 : a[5].toLowerCase() < b[5].toLowerCase() ? -1 : a[5].toLowerCase() > b[5].toLowerCase() ? 1 : 0));
const q = (v) => '"' + v.replace(/"/g, '""') + '"';
const out = "﻿" + ["Game", "Category", "Superseded", "RemovedUpstream", "Folder", "PatchFile", "NameEn", "NameJp", "Type", "Tag", "Author"].map(q).join(",") + "\n"
  + rows.map((r) => r.map(q).join(",") + "\n").join("");
const file = join(root, "INDEX.csv");
if (process.argv.includes("--check")) {
  const same = readFileSync(file, "utf8") === out;
  console.log(same ? "INDEX.csv is current" : "INDEX.csv is stale");
  process.exit(same ? 0 : 1);
}
writeFileSync(file, out);
console.log("INDEX.csv:", rows.length, "rows");
