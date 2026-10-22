// Conflicts report (PatchLibraryPlan step 9). Zero dependencies: node _tools/conflicts.mjs [--csv]
// Two patches of one game conflict when their PATCHED_IF regions overlap but the bytes differ: both want the same
// ROM bytes, so only one of them can be installed. Equal bytes are duplicates (validate-library reports those).
// Folders _removed-upstream and _older versions are skipped. The signature is only the part of a patch it tests, so a
// patch can also conflict through bytes it writes outside its signature; this report is a lower bound.
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const asCsv = process.argv.includes("--csv");
const dec = (b) => { try { return new TextDecoder("utf-8", { fatal: true }).decode(b); } catch { return new TextDecoder("shift_jis").decode(b); } };
const sigs = []; // { game, file, start, bytes }
const walk = (d) => {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    if (e.name.startsWith(".") || e.name === "_tools" || e.name === "_removed-upstream" || e.name === "_older versions") continue;
    const p = join(d, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    if (!/^PATCH_.*\.txt$/.test(e.name)) continue;
    const rel = relative(root, p).split(sep).join("/");
    const game = rel.split("/")[0];
    for (const m of dec(readFileSync(p)).matchAll(/^PATCHED_IF:(0x[0-9a-fA-F]+)=((?:0x[0-9a-fA-F]{2}\s*)+)/gm)) {
      const bytes = m[2].trim().split(/\s+/).map((x) => parseInt(x, 16));
      sigs.push({ game, file: rel, start: parseInt(m[1], 16), bytes });
    }
  }
};
walk(root);

const byGame = new Map();
for (const s of sigs) (byGame.get(s.game) ?? byGame.set(s.game, []).get(s.game)).push(s);
const rows = [];
for (const [game, list] of byGame) {
  list.sort((a, b) => a.start - b.start);
  for (let i = 0; i < list.length; i++) {
    const a = list[i];
    const aEnd = a.start + a.bytes.length;
    for (let j = i + 1; j < list.length && list[j].start < aEnd; j++) {
      const b = list[j];
      if (dirname(a.file) === dirname(b.file)) continue; // variants and halves of one patch folder
      const lo = b.start, hi = Math.min(aEnd, b.start + b.bytes.length);
      let same = true;
      for (let k = lo; k < hi; k++) if (a.bytes[k - a.start] !== b.bytes[k - b.start]) { same = false; break; }
      if (same) continue;
      rows.push({ game, region: "0x" + lo.toString(16).toUpperCase() + "-0x" + (hi - 1).toString(16).toUpperCase(), a: a.file, b: b.file });
    }
  }
}
rows.sort((x, y) => x.game.localeCompare(y.game) || x.region.localeCompare(y.region));
if (asCsv) {
  console.log("Game,Region,PatchA,PatchB");
  for (const r of rows) console.log([r.game, r.region, r.a, r.b].map((v) => `"${v}"`).join(","));
} else {
  console.log(`signatures: ${sigs.length}; conflicting pairs: ${rows.length}`);
  for (const r of rows.slice(0, 60)) console.log(`${r.game} ${r.region}\n   ${r.a}\n   ${r.b}`);
  if (rows.length > 60) console.log(`... ${rows.length - 60} more (use --csv)`);
}
