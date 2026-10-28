// Regenerates browser/<game>.json for FECK's Patches browser (the PatchBrowserFile type in FECK's ui/community/types.ts).
// Zero dependencies: node _tools/make-browser-json.mjs [--check]. Run make-index.mjs and make-browser-data.mjs first: INDEX.csv,
// DESCRIPTIONS.csv, VERIFIED.csv, CONFLICTS.csv and FILES.csv are read as they are. --check compares with the files on disk,
// ignoring the "commit" and "generated" fields (they change with every commit), and exits 1 when any file is stale.
// id = the patch file's repo path ("FE8U/05_Menu_UI/Foo/PATCH_Foo.txt"). Fields come from the patch file itself:
//   name = NAME.en, else NAME, else the file name; nameJp = NAME when NAME.en exists and differs; tags = TAG without "#"; author = AUTHOR.
//   detect = every PATCHED_IF:<offset>=<bytes> line with a numeric offset (the $GREP/$FGREP forms have none and are left out).
//   writes = every BIN:/BINF:<offset>=<file> line with a numeric offset; length is the file's size, bytes only when 64 or fewer.
//     BIN:$FREEAREA and JUMP lines have no fixed offset and are left out.
//   conflicts = CONFLICTS.csv overlaps (both directions) plus every CONFLICT_IF:<offset>=<bytes> line (with = null).
//   requires = string[][]: one group per REQUIRES entry (";"-separated), holding every patch id in the folder(s) it names ("|" alternatives merged); needs one from each group. [] when none.
//   tags drop ESSENTIALFIXES: the browser shows no ranking tags.
//   superseded = the patch sits under an "_older versions" folder (an extra field; supersededBy is always null: nothing in the files names the replacement).
//   verified = VERIFIED.csv rolled up: every row pass = pass, any fail/not assemblable with a pass = partial, only fails = fail, only "not checked" = null.
//   files = FILES.csv's rows for the patch folder; a folder with more than 60 files lists only the patch file, its readme-role files and the files its text names.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dec = (b) => { try { return new TextDecoder("utf-8", { fatal: true }).decode(b); } catch { return new TextDecoder("shift_jis").decode(b); } };
const GAMES = ["FE6", "FE7J", "FE7U", "FE8J", "FE8U"];

const parseCsv = (name) => {
  const t = readFileSync(join(root, name), "utf8").replace(/^﻿/, "");
  const rows = []; let row = [], v = "", inq = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (inq) { if (c === '"') { if (t[i + 1] === '"') { v += '"'; i++; } else inq = false; } else v += c; }
    else if (c === '"') inq = true;
    else if (c === ",") { row.push(v); v = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && t[i + 1] === "\n") i++; row.push(v); v = ""; rows.push(row); row = []; }
    else v += c;
  }
  if (v || row.length) { row.push(v); rows.push(row); }
  const head = rows.shift();
  return rows.filter((r) => r.length === head.length).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
};

const nul = (s) => (s === undefined || s === "" ? null : s);
const hex = (s) => s.trim().split(/\s+/).map((b) => (parseInt(b, 16) & 0xff).toString(16).toUpperCase().padStart(2, "0")).join("");
const num = (s) => parseInt(s, 16);

const index = parseCsv("INDEX.csv");
const descs = new Map(parseCsv("DESCRIPTIONS.csv").map((r) => [r.Folder + "/" + r.PatchFile, r.Description]));
const folderFiles = new Map();
for (const r of parseCsv("FILES.csv")) { const l = folderFiles.get(r.Folder) || []; l.push({ path: r.File, role: r.Role }); folderFiles.set(r.Folder, l); }

const verifiedRows = new Map();
for (const r of parseCsv("VERIFIED.csv")) { const id = r.Folder + "/" + r.PatchFile; (verifiedRows.get(id) || verifiedRows.set(id, []).get(id)).push(r); }
const verification = (game, id) => {
  const rows = verifiedRows.get(id);
  if (!rows) return null;
  const pass = rows.filter((r) => r.Result === "pass").length;
  const fail = rows.filter((r) => r.Result !== "pass" && r.Result !== "not checked").length;
  if (!pass && !fail) return null;
  const used = rows.filter((r) => r.Result !== "not checked");
  return {
    result: fail === 0 ? "pass" : pass ? "partial" : "fail",
    how: [...new Set(used.map((r) => r.Check))].join("; "),
    rom: game,
    note: nul([...new Set(used.map((r) => r.Note).filter(Boolean))].join("; ")),
  };
};

const overlaps = new Map();
for (const r of parseCsv("CONFLICTS.csv")) {
  const m = /^(0x[0-9a-f]+)(?:-(0x[0-9a-f]+))?$/i.exec(r.Region);
  if (!m) continue;
  const offset = num(m[1]), length = (m[2] ? num(m[2]) : offset) - offset + 1;
  for (const [a, b] of [[r.PatchA, r.PatchB], [r.PatchB, r.PatchA]]) (overlaps.get(a) || overlaps.set(a, []).get(a)).push({ kind: "overlap", offset, length, with: b });
}

const inFolder = new Map();
for (const r of index) { const f = r.Folder.replace(/\\/g, "/"); (inFolder.get(f) || inFolder.set(f, []).get(f)).push(f + "/" + r.PatchFile); }
const requires = new Map();
for (const r of parseCsv("CONFLICTS-BY-PATCH.csv")) if (r.Kind === "requires") {
  const id = r.Folder + "/" + r.PatchFile, l = requires.get(id) || requires.set(id, []).get(id);
  const group = [];
  for (const f of r.Other.split("|")) for (const x of inFolder.get(f) || []) if (!group.includes(x)) group.push(x);
  if (group.length) l.push(group);
}
const ids = new Set(index.map((r) => r.Folder.replace(/\\/g, "/") + "/" + r.PatchFile));

const build = (r) => {
  const folder = r.Folder.replace(/\\/g, "/"), id = folder + "/" + r.PatchFile, dir = join(root, ...folder.split("/"));
  const text = dec(readFileSync(join(dir, r.PatchFile))).replace(/^﻿/, "");
  const lines = text.split(/\r?\n/);
  const nameEn = nul(r.NameEn), nameJa = nul(r.NameJp);
  const detect = [], writes = [], conflicts = [...(overlaps.get(id) || [])];
  for (const l of lines) {
    let m;
    if ((m = /^PATCHED_IF:(0x[0-9a-f]+)=(.+)$/i.exec(l))) detect.push({ offset: num(m[1]), bytes: hex(m[2]) });
    else if ((m = /^CONFLICT_IF:(0x[0-9a-f]+)=(.+)$/i.exec(l))) conflicts.push({ kind: "conflict_if", offset: num(m[1]), length: m[2].trim().split(/\s+/).length, with: null });
    else if ((m = /^BINF?:(0x[0-9a-f]+)(?::\d+)?=(.+)$/i.exec(l))) {
      const file = m[2].trim().replace(/\\/g, "/"), p = join(dir, file);
      if (!existsSync(p) || !statSync(p).isFile()) continue;
      const size = statSync(p).size;
      writes.push({ offset: num(m[1]), length: size, file, bytes: size > 0 && size <= 64 ? readFileSync(p).toString("hex").toUpperCase() : null });
    }
  }
  const all = folderFiles.get(folder) || [];
  const lower = text.toLowerCase();
  const files = all.length <= 60 ? all : all.filter((f) => f.path === r.PatchFile || f.role === "readme" || lower.includes(f.path.toLowerCase()));
  const seg = folder.split("/");
  return {
    id,
    name: nameEn || nameJa || r.PatchFile.replace(/^PATCH_/i, "").replace(/\.txt$/i, ""),
    nameJp: nameEn && nameJa && nameEn !== nameJa ? nameJa : null,
    description: nul(descs.get(id)),
    category: seg[1].replace(/^\d+_/, ""),
    type: r.Type || "",
    tags: (r.Tag.match(/#[^#\s]+/g) || []).map((t) => t.slice(1)).filter((t) => t !== "ESSENTIALFIXES"),
    author: nul(r.Author),
    folder,
    superseded: seg.includes("_older versions"),
    supersededBy: null,
    removedUpstream: r.RemovedUpstream === "1",
    verified: verification(r.Game, id),
    detect,
    writes,
    conflicts,
    requires: requires.get(id) || [],
    files: files.map((f) => ({ path: f.path, role: f.role })).sort((a, b) => (a.path.toLowerCase() < b.path.toLowerCase() ? -1 : a.path.toLowerCase() > b.path.toLowerCase() ? 1 : 0)),
  };
};

let commit = "unknown";
try { commit = execFileSync("git", ["-C", root, "rev-parse", "HEAD"], { encoding: "utf8" }).trim(); } catch {}
const today = new Date().toISOString().slice(0, 10);
const lc = (s) => s.toLowerCase();
const outs = {};
let dangling = 0;
for (const game of GAMES) {
  const patches = index.filter((r) => r.Game === game).map(build);
  for (const p of patches) for (const c of p.conflicts) if (c.with && !ids.has(c.with)) dangling++;
  patches.sort((a, b) => (lc(a.category) < lc(b.category) ? -1 : lc(a.category) > lc(b.category) ? 1 : lc(a.name) < lc(b.name) ? -1 : lc(a.name) > lc(b.name) ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  outs[game] = { schema: 1, game, commit, generated: today, patches };
}

const file = (g) => join(root, "browser", g + ".json");
if (process.argv.includes("--check")) {
  let stale = false;
  for (const g of GAMES) {
    let cur = null; try { cur = JSON.parse(readFileSync(file(g), "utf8")); } catch {}
    const same = cur && JSON.stringify({ ...cur, commit: 0, generated: 0 }) === JSON.stringify({ ...outs[g], commit: 0, generated: 0 });
    console.log("browser/" + g + ".json", same ? "is current" : "is stale");
    if (!same) stale = true;
  }
  process.exit(stale ? 1 : 0);
}
mkdirSync(join(root, "browser"), { recursive: true });
for (const g of GAMES) {
  writeFileSync(file(g), JSON.stringify(outs[g]) + "\n");
  const p = outs[g].patches;
  console.log("browser/" + g + ".json:", p.length, "patches,", p.filter((x) => x.detect.length).length, "with detect,", p.filter((x) => x.writes.length).length, "with writes,",
    p.filter((x) => x.verified).length, "verified,", p.filter((x) => x.superseded).length, "superseded,", Math.round(statSync(file(g)).size / 1024) + " KB");
}
if (dangling) console.log("conflicts pointing at a missing patch:", dangling);
