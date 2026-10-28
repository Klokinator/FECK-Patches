// Regenerates the patch-browser data: DESCRIPTIONS.csv, CONFLICTS-BY-PATCH.csv, FILES.csv. Zero dependencies: node _tools/make-browser-data.mjs [--check]
// --check compares with the files on disk and exits 1 when any is stale; without it the files are rewritten.
// A patch is Game + Folder + PatchFile, the same id VERIFIED.csv uses (Folder starts with the game and uses "/").
// DESCRIPTIONS.csv: Description = the first two sentences of INFO.en as written upstream (literal \r\n sequences become spaces), empty when the patch has none.
//   Source = "INFO.en" or empty. Status = verified / failed / untried, rolled up from VERIFIED.csv (every row pass = verified, any row failing or not assemblable = failed, otherwise untried; "not checked" and no row both count as untried).
// CONFLICTS-BY-PATCH.csv: Kind overlap = CONFLICTS.csv (Other is the other patch, Region the shared bytes); conflict_if = a CONFLICT_IF line of the patch
//   (Other is empty, Region is the address); requires = a REQUIRES entry (Other is the required folder, alternatives joined with "|"). Known conflicts only, not complete.
// FILES.csv: one row per file sitting directly in a patch folder (not its subfolders), Role from the name and extension. Patches in the same folder share its files.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dec = (b) => { try { return new TextDecoder("utf-8", { fatal: true }).decode(b); } catch { return new TextDecoder("shift_jis").decode(b); } };
const q = (v) => '"' + String(v).replace(/"/g, '""') + '"';
const csv = (head, rows) => "﻿" + head.map(q).join(",") + "\n" + rows.map((r) => r.map(q).join(",") + "\n").join("");
const cmp = (a, b) => { for (let i = 0; i < 3; i++) { const x = a[i].toLowerCase(), y = b[i].toLowerCase(); if (x !== y) return x < y ? -1 : 1; } return a[3] < b[3] ? -1 : a[3] > b[3] ? 1 : 0; };

const verified = new Map();
for (const line of readFileSync(join(root, "VERIFIED.csv"), "utf8").split(/\r?\n/).slice(1)) {
  if (!line) continue;
  const f = [];
  for (let p = 0; p <= line.length && f.length < 7;) {
    let v;
    if (line[p] === '"') { let e = p + 1; while (e < line.length && !(line[e] === '"' && line[e + 1] !== '"')) e += line[e] === '"' ? 2 : 1; v = line.slice(p + 1, e).replace(/""/g, '"'); p = e + 2; }
    else { let e = line.indexOf(",", p); if (e < 0) e = line.length; v = line.slice(p, e); p = e + 1; }
    f.push(v);
  }
  const id = f[0] + "|" + f[1] + "|" + f[2];
  const rank = { pass: 1, "not checked": 0 };
  const r = f[5] in rank ? rank[f[5]] : -1;
  const prev = verified.get(id);
  verified.set(id, prev === undefined ? r : prev === -1 || r === -1 ? -1 : Math.min(prev, r));
}

const role = (n) => {
  const l = n.toLowerCase(), x = extname(l);
  if (/^patch_.*\.txt$/.test(l)) return "patch";
  if (/readme|説明|说明|^info/.test(l) && (x === ".txt" || x === ".md" || x === ".html")) return "readme";
  if (x === ".event") return "event";
  if (x === ".dmp" || x === ".bin") return "binary";
  if ([".png", ".bmp", ".gif", ".jpg"].includes(x)) return "image";
  if ([".s", ".asm"].includes(x)) return "source";
  if ([".txt", ".md", ".html", ".pdf"].includes(x)) return "doc";
  return "other";
};

const desc = [], conf = [], files = [], seen = new Set();
const listed = new Set();
const walk = (d) => {
  const ents = readdirSync(d, { withFileTypes: true });
  for (const e of ents) {
    if (e.name.startsWith(".") || e.name === "_tools") continue;
    if (e.isDirectory()) walk(join(d, e.name));
  }
  const parts = relative(root, d).split(sep);
  if (parts.length < 2) return;
  const patches = ents.filter((e) => e.isFile() && /^PATCH_.*\.txt$/i.test(e.name));
  for (const pe of patches) {
    const folder = parts.join("/"), game = parts[0];
    const text = dec(readFileSync(join(d, pe.name))).replace(/^﻿/, "");
    const info = (/^INFO\.en=(.*?)\r?$/m.exec(text) || [, ""])[1].replace(/\\r\\n|\\n/g, " ").replace(/\s+/g, " ").trim();
    const sent = info ? (info.match(/[^.!?。]+[.!?。]+(?=\s|$)|[^.!?。]+$/g) || [info]).slice(0, 2).join(" ").trim() : "";
    const id = game + "|" + folder + "|" + pe.name;
    seen.add(id);
    const st = { 1: "verified", 0: "untried", "-1": "failed" }[verified.get(id) ?? 0];
    desc.push([game, folder, pe.name, sent, sent ? "INFO.en" : "", st]);
    for (const m of text.matchAll(/^CONFLICT_IF:(0x[0-9a-f]+)=/gim)) conf.push([game, folder, pe.name, "", m[1], "conflict_if"]);
    for (const m of text.matchAll(/^REQUIRES=(.*?)\r?$/gm))
      for (const req of m[1].split(";").map((s) => s.trim()).filter(Boolean))
        conf.push([game, folder, pe.name, req.split("|").map((a) => game + "/" + a.trim()).join("|"), "", "requires"]);
    if (!listed.has(folder)) { listed.add(folder); for (const f of ents) if (f.isFile()) files.push([game, folder, f.name, role(f.name), ""]); }
  }
};
walk(root);

for (const line of readFileSync(join(root, "CONFLICTS.csv"), "utf8").split(/\r?\n/).slice(1)) {
  const m = /^"([^"]*)","([^"]*)","([^"]*)","([^"]*)"$/.exec(line);
  if (!m) continue;
  for (const [a, b] of [[m[3], m[4]], [m[4], m[3]]]) {
    const i = a.lastIndexOf("/");
    conf.push([m[1], a.slice(0, i), a.slice(i + 1), b, m[2], "overlap"]);
  }
}

const sortKey = (r) => [r[0], r[1], r[2], r[3] + "|" + (r[4] || "") + "|" + (r[5] || "")];
const sortBy = (rows) => rows.sort((a, b) => cmp(sortKey(a), sortKey(b)));
const outs = {
  "DESCRIPTIONS.csv": csv(["Game", "Folder", "PatchFile", "Description", "Source", "Status"], sortBy(desc)),
  "CONFLICTS-BY-PATCH.csv": csv(["Game", "Folder", "PatchFile", "Other", "Region", "Kind"], sortBy(conf)),
  "FILES.csv": csv(["Game", "Folder", "File", "Role"], files.map((r) => r.slice(0, 4)).sort((a, b) => cmp([a[0], a[1], a[2], ""], [b[0], b[1], b[2], ""]))),
};
if (process.argv.includes("--check")) {
  let stale = false;
  for (const [n, t] of Object.entries(outs)) {
    let cur = ""; try { cur = readFileSync(join(root, n), "utf8"); } catch {}
    console.log(n, cur === t ? "is current" : "is stale");
    if (cur !== t) stale = true;
  }
  process.exit(stale ? 1 : 0);
}
for (const [n, t] of Object.entries(outs)) writeFileSync(join(root, n), t);
const empty = desc.filter((r) => !r[3]).length;
const stc = {}; for (const r of desc) stc[r[5]] = (stc[r[5]] || 0) + 1;
const orphan = [...verified.keys()].filter((k) => !seen.has(k)).length;
console.log("DESCRIPTIONS.csv:", desc.length, "rows,", empty, "empty,", JSON.stringify(stc), "| VERIFIED rows with no patch:", orphan);
console.log("CONFLICTS-BY-PATCH.csv:", conf.length, "rows");
console.log("FILES.csv:", files.length, "rows");
