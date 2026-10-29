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
//   superseded = the patch sits under an "_older versions" folder, or its name starts with "(Old)".
//   supersededBy = the id of the one current patch of the same game whose name is the same once "(Old)", dates and "(Editor)/(Installer)"-style brackets are dropped; null when none or more than one matches, or when the match's date (YYYYMMDD in the name or folder) is older than the superseded patch's.
//   author = AUTHOR with links taken out (the first one is in authorUrl) and literal \r\n sequences turned into spaces, a trailing source label ("Source:", "出典元:" or a bare colon) is dropped, and the value is null only when no letter or digit is left; authorUrl = the first http(s) link inside it, null when none.
//   description = INFO.en's first two sentences; a lone opening double quote (an odd number of quote marks) is dropped.
//   title = the short display title (at most 40 characters, sentence case, no "(Editor)" suffix) and summary = one or two plain sentences, both from METADATA.csv; name and description stay as the upstream text.
//   group = optional METADATA.csv Group column (a name from patch-groups.json), else null.
//   A patch without a METADATA.csv entry gets title = name with the suffix stripped and summary = null, so the browser falls back to description.
//   filesComplete = false when a folder has more than 60 files and "files" lists only part of them.
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
// Author text without its links; only a trailing source label ("Source:", "出典元:", a bare colon) and empty brackets are dropped, an unclosed bracket is closed, and the result is empty only when no letter or digit is left.
// authorName: the plain name, only for source-credit wordings that already contain it; author keeps the full credit.
const NAME_FORMS = [
  /^出典[:：]\s*([^\s@]+?)さんの(?:資料|書き込み)より$/,
  /^([^\s@:：]+?)さんの(?:資料|書き込み)より$/,
  /^出典[:：]\s*([^\s@]+)@/,
  /^Source[:：]\s*([A-Za-z0-9_]+)$/,
  /^Original work[:：]\s*([^/]+?)\s*\//,
  /^Animation Hacks by (\w+) Transplant:/,
];
const plainName = (a) => { for (const r of NAME_FORMS) { const m = r.exec(a); if (m) return m[1]; } return null; };
const cleanAuthor = (a) => {
  let s = a.replace(/\\r\\n|\\n/g, " ").replace(/https?:\/\/[^\s"'<>]+/gi, " ").replace(/\s+/g, " ").trim();
  s = s.replace(/\s+How to use\s*[:：]?$/i, "").replace(/\s+,/g, ",").replace(/\s*(?:プログラム)?(?:出典元|Source|Original author)?\s*[:：]\s*(?=[)）\]]*$)/iu, "").replace(/\(\s*\)|（\s*）|\[\s*\]/gu, "").replace(/[\s,、]+$/u, "").trim();
  if ((s.match(/\(/g) || []).length > (s.match(/\)/g) || []).length) s += ")";
  return /[\p{L}\p{N}]/u.test(s) ? s : "";
};
const hex = (s) => s.trim().split(/\s+/).map((b) => (parseInt(b, 16) & 0xff).toString(16).toUpperCase().padStart(2, "0")).join("");
const num = (s) => parseInt(s, 16);
const oldName = (n) => /^\s*\(old\)/i.test(n);
const sameName = (n) => n.replace(/^\s*\(old\)\s*/i, "").replace(/\([^)]*\)/g, "").replace(/\d{6,8}/g, "").toLowerCase().replace(/[^a-z0-9぀-ヿ一-鿿]/g, "");
const cleanDesc = (s) => (s && s.startsWith('"') && (s.match(/"/g) || []).length % 2 ? s.slice(1).trim() : s);

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

// METADATA.csv (Name,Type,DescStart,Title,Summary) holds the written titles and summaries. The key ignores the game, so one entry serves the same patch in every game.
const metaKey = (name, type, desc) => [name, type, (desc || "").slice(0, 60)].join("\t");
let meta = new Map();
try { meta = new Map(parseCsv("METADATA.csv").map((r) => [metaKey(r.Name, r.Type, r.DescStart), r])); } catch {}
// The group is an optional second-level heading under the category, one of patch-groups.json (the same list for every game); a patch without one lists as before.
const GROUPS = JSON.parse(readFileSync(join(root, "_tools", "patch-groups.json"), "utf8"));
// Fallback title when no entry exists: the "(Editor)"/"(Installer)"-style suffix and trailing full stops go, the first letter is capitalised.
const autoTitle = (n) => { const t = n.replace(/\s*[(（](?:editor|installer?|install)[)）]\s*$/i, "").replace(/[.。\s]+$/, "").trim() || n; return t.charAt(0).toUpperCase() + t.slice(1); };

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
  const rawName = nameEn || nameJa || r.PatchFile.replace(/^PATCH_/i, "").replace(/\.txt$/i, "");
  const rawDesc = nul(cleanDesc(descs.get(id)));
  const m = meta.get(metaKey(rawName, r.Type || "", rawDesc));
  return {
    id,
    group: m && GROUPS.includes(m.Group) ? m.Group : null,
    name: rawName,
    title: m && m.Title ? m.Title : autoTitle(rawName),
    nameJp: nameEn && nameJa && nameEn !== nameJa ? nameJa : null,
    description: rawDesc,
    summary: m && m.Summary ? m.Summary : null,
    category: seg[1].replace(/^\d+_/, ""),
    type: r.Type || "",
    tags: (r.Tag.match(/#[^#\s]+/g) || []).map((t) => t.slice(1)).filter((t) => t !== "ESSENTIALFIXES"),
    author: nul(cleanAuthor(r.Author || "")),
    ...(plainName(cleanAuthor(r.Author || "")) ? { authorName: plainName(cleanAuthor(r.Author || "")) } : {}),
    authorUrl: ((/https?:\/\/[^\s"'<>]+/i.exec(r.Author || "") || [null])[0] || "").replace(/^([^(]*)\)+$/, "$1") || null,
    folder,
    superseded: seg.includes("_older versions") || oldName(nameEn || nameJa || ""),
    supersededBy: null,
    removedUpstream: r.RemovedUpstream === "1",
    verified: verification(r.Game, id),
    detect,
    writes,
    conflicts,
    requires: requires.get(id) || [],
    filesComplete: files.length === all.length,
    files: files.map((f) => ({ path: f.path, role: f.role })).sort((a, b) => (a.path.toLowerCase() < b.path.toLowerCase() ? -1 : a.path.toLowerCase() > b.path.toLowerCase() ? 1 : 0)),
  };
};

let commit = "unknown";
try { commit = execFileSync("git", ["-C", root, "rev-parse", "HEAD"], { encoding: "utf8" }).trim(); } catch {}
const today = new Date().toISOString().slice(0, 10);
const lc = (s) => s.toLowerCase();
// Display titles carry no dates; a date, a type word, the author or the folder is added only where two patches in one game would otherwise share a title.
const DATE = /(?:20\d{6}|20\d{2}-\d{2}(?:-\d{2})?|20\d{2})/;
const fmtDate = (d) => (/^\d{8}$/.test(d) ? d.slice(0, 4) + "-" + d.slice(4, 6) + "-" + d.slice(6) : d);
const stripDates = (t) => t.replace(/\s*\((old)\s+(?:20\d{6}|20\d{2}-\d{2}(?:-\d{2})?|20\d{2})\)/i, " ($1)").replace(/\s*\((?:20\d{6}|20\d{2}-\d{2}(?:-\d{2})?|20\d{2})\)/g, "").replace(/(\s)(?:20\d{6}|20\d{2}-\d{2}(?:-\d{2})?|20\d{2})(?![\d-])/g, "").replace(/\(\s*\)/g, "").replace(/\s+/g, " ").trim();
const TYPE_WORD = { STRUCT: "settings", IMAGE: "image", ADDR: "value" };
const uniqueTitles = (patches) => {
  for (const p of patches) { p.dateInTitle = (DATE.exec(p.title) || [])[0] || ""; p.title = stripDates(p.title); p.parts = []; }
  const final = (p) => { for (let n = p.parts.length; n >= 0; n--) { const s = n ? " (" + p.parts.slice(0, n).join(", ") + ")" : ""; if (p.title.length + s.length <= 54) return p.title + s; } return p.title; };
  const dis = [
    (p) => TYPE_WORD[p.type] || "",
    (p) => fmtDate(p.dateInTitle || (/(20\d{6})(?!.*20\d{6})/.exec(p.id) || [])[1] || ""),
    (p) => (p.author && p.author.length <= 20 && !/http/.test(p.author) ? p.author : ""),
    (p) => p.id.split("/").slice(-2, -1)[0].replace(/[_-]+/g, " ").trim(),
    (p) => (p.id.split("/").pop().replace(/^PATCH_/i, "").replace(/\.txt$/i, "").split(/[_ ]/).pop().replace(/^(?:edit(?:or)?|install(?:er|ation)?)$/i, "") || ""),
    (p) => fmtDate((/(20\d{6})/.exec(p.id.split("/").slice(0, -1).join("/")) || [])[1] || ""),
    (p) => p.id.split("/").pop().replace(/^PATCH_/i, "").replace(/\.txt$/i, ""),
    (p) => p.id.split("/").pop().replace(/^PATCH_/i, "").split(" ")[0],
  ];
  // For each group sharing a title, the first combination of the words above that tells every member apart is appended; a group none of them separates stays as it is.
  const combos = [[0], [1], [2], [3], [4], [0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [0, 1, 2], [0, 1, 3], [0, 4], [1, 4], [0, 1, 4], [5], [0, 5], [4, 5], [3, 5], [6], [7]];
  const by = new Map();
  for (const p of patches) (by.get(lc(p.title)) || by.set(lc(p.title), []).get(lc(p.title))).push(p);
  for (const g of by.values()) {
    if (g.length < 2) continue;
    for (const c of combos) {
      const parts = g.map((p) => c.map((i) => dis[i](p)).filter(Boolean));
      if (new Set(parts.map((x) => x.join(", "))).size < g.length) continue;
      if (g.some((p, i) => p.title.length + (parts[i].length ? parts[i].join(", ").length + 3 : 0) > 54)) continue;
      g.forEach((p, i) => { p.parts = parts[i]; });
      break;
    }
  }
  for (const p of patches) { p.title = final(p); delete p.parts; delete p.dateInTitle; }
};
const outs = {};
let dangling = 0;
for (const game of GAMES) {
  const patches = index.filter((r) => r.Game === game).map(build);
  for (const p of patches) for (const c of p.conflicts) if (c.with && !ids.has(c.with)) dangling++;
  uniqueTitles(patches.filter((p) => !p.removedUpstream));
  const byId = new Map(patches.map((p) => [p.id, p]));
  const date = (p) => (/(20\d{6})(?!.*20\d{6})/.exec(p.name + " " + p.folder) || [])[1];
  const current = new Map();
  for (const p of patches) if (!p.superseded) { const k = sameName(p.name); if (k) (current.get(k) || current.set(k, []).get(k)).push(p.id); }
  for (const p of patches) if (p.superseded) { const c = current.get(sameName(p.name)) || []; if (c.length === 1 && !(date(p) && date(byId.get(c[0])) && date(byId.get(c[0])) < date(p))) p.supersededBy = c[0]; }
  patches.sort((a, b) => (lc(a.category) < lc(b.category) ? -1 : lc(a.category) > lc(b.category) ? 1 : lc(a.name) < lc(b.name) ? -1 : lc(a.name) > lc(b.name) ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  outs[game] = { schema: 1, game, commit, generated: today, patches };
}

const file = (g) => join(root, "browser", g + ".json");
// --work prints one JSON line per distinct patch (name, type, description start) that has no METADATA.csv entry yet, for writing titles and summaries.
if (process.argv.includes("--work")) {
  const seen = new Map();
  for (const g of GAMES) for (const p of outs[g].patches) {
    const k = metaKey(p.name, p.type, p.description);
    if (meta.has(k) || seen.has(k)) continue;
    seen.set(k, { name: p.name, type: p.type, descStart: (p.description || "").slice(0, 60), category: p.category, folder: p.folder.split("/").slice(1).join("/"), nameJp: p.nameJp, description: p.description, games: [g] });
  }
  for (const v of seen.values()) console.log(JSON.stringify(v));
  process.exit(0);
}
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
