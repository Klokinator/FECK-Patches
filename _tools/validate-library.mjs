// Library validator (PatchLibraryPlan step 6). Zero dependencies: node _tools/validate-library.mjs [--details] [--json]
// Walks every PATCH_*.txt and checks, per file:
//   ERROR  payload   a BIN:/BINF:/EA= file the patch names is missing from its folder
//   ERROR  vanilla   a PATCHED_IF that is TRUE on that game's untouched ROM (needs ../ROMS; skipped if absent)
//   WARN   payloadsig a BIN:addr=file payload that does not hold the patch's own PATCHED_IF bytes at that address (catches damaged or truncated payloads)
//   WARN   weak      a PATCHED_IF of 2 bytes or fewer
//   WARN   nodetect  an installable patch (TYPE EA/BIN) with no PATCHED_IF (uninstallers, by file name, are exempt)
//   WARN   meta      missing NAME.en / INFO.en / TAG / TYPE
//   WARN   noauthor  no AUTHOR: no credit upstream; never guessed, left as is until a source names the author
//   WARN   empty     a PATCH file with no content at all (nothing to install or detect)
//   WARN   contained a PATCHED_IF lying wholly inside another patch's PATCHED_IF of the same game (same bytes there), so it reads as installed whenever the other is
//   WARN   duplicate two patches of one game share the same PATCHED_IF address and bytes
// Exit code 1 when any ERROR is found. Folders _removed-upstream and _older versions are counted but not warned on.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ROMS = resolve(root, "..", "ROMS");
const ROM_FILES = {
  FE6: "Fire Emblem 6 - Fuuin no Tsurugi (J).gba",
  FE7J: "Fire Emblem 7 - Rekka no Ken (J).gba",
  FE7U: "Fire Emblem 7 - (U).gba",
  FE8J: "Fire Emblem 8 - Seima no Kouseki (J).gba",
  FE8U: "Fire Emblem 8 - The Sacred Stones (U).gba",
};
const roms = {};
for (const [g, f] of Object.entries(ROM_FILES)) {
  const p = join(ROMS, f);
  if (existsSync(p)) roms[g] = readFileSync(p);
}

const details = process.argv.includes("--details");
const asJson = process.argv.includes("--json");

const decode = (buf) => {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buf);
  } catch {
    return new TextDecoder("shift_jis").decode(buf);
  }
};

const walk = (dir, out = []) => {
  for (const name of readdirSync(dir).sort()) {
    if (name.startsWith(".") || name === "_tools") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/^PATCH_.*\.txt$/i.test(name)) out.push(p);
  }
  return out;
};

const issues = [];
const add = (level, kind, file, msg) => issues.push({ level, kind, file: relative(root, file), msg });

const sigs = new Map();
const sigList = [];
let total = 0;
let installable = 0;
let detectable = 0;

for (const file of walk(root)) {
  const rel = relative(root, file).split(sep);
  const game = rel[0];
  if (!(game in ROM_FILES)) continue;
  total++;
  const archived = rel.some((s) => s === "_removed-upstream" || s === "_older versions");
  const dir = dirname(file);
  const keys = new Map();
  const lines = decode(readFileSync(file)).replace(/^﻿/, "").split(/\r\n|\n|\r/);
  const payloads = [];
  const binAt = [];
  const piList = [];
  for (let line of lines) {
    if (line.startsWith("//")) continue;
    const c = line.indexOf("//");
    if (c >= 0) line = line.slice(0, c);
    line = line.trim();
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq);
    const val = line.slice(eq + 1).trim();
    keys.set(key, val);
    if (/^BINF?:/.test(key) || key === "EA") payloads.push(val);
    if (/^BIN:(0x)?[0-9a-f]+$/i.test(key) && val && !val.includes("$")) binAt.push([parseInt(key.slice(4), 16), val]);
    if (key.startsWith("PATCHED_IF:")) piList.push([key.slice(11), val, false]);
    if (key.startsWith("PATCHED_IFNOT:")) piList.push([key.slice(14), val, true]);
  }
  if (lines.join("").trim() === "") add("warn", "empty", file, "file is empty");
  const type = keys.get("TYPE") ?? "";
  const quiet = archived ? "info" : "warn";
  for (const v of payloads) {
    if (!v || v.includes("$")) continue;
    if (!existsSync(join(dir, v))) add("error", "payload", file, `missing ${v}`);
  }
  if (!keys.has("NAME.en")) add(quiet, "meta", file, "NAME.en");
  if (!keys.has("INFO.en") && !keys.has("INFO")) add(quiet, "meta", file, "INFO.en");
  if (!keys.has("AUTHOR")) add(quiet, "noauthor", file, "AUTHOR");
  if (!keys.has("TAG")) add(quiet, "meta", file, "TAG");
  if (!type) add(quiet, "meta", file, "TYPE");
  const inst = type === "EA" || type === "BIN";
  if (inst) installable++;
  // An uninstaller's state is the absence of another patch, which PATCHED_IFNOT cannot express (it would read as applied on vanilla).
  if (inst && piList.length === 0 && !/uninstall/i.test(file)) add(quiet, "nodetect", file, "no PATCHED_IF");
  if (piList.length) detectable++;
  for (const [a, b, negated] of piList) {
    if (!/^(0x)?[0-9a-f]+$/i.test(a)) continue;
    const addr = parseInt(a, 16);
    const bytes = b.split(/\s+/).filter(Boolean).map((x) => parseInt(x, 16));
    if (!bytes.length || bytes.some(Number.isNaN)) continue;
    if (!negated) {
      for (const [a0, v] of binAt) {
        const p = join(dir, v);
        if (!existsSync(p)) continue;
        const d = readFileSync(p);
        if (addr < a0 || addr >= a0 + d.length) continue;
        if ([...keys.keys()].some((k) => k.startsWith("JUMP:"))) continue; // a JUMP rewrites the hook bytes the PATCHED_IF reads
        const rom0 = roms[game];
        const seg = bytes.map((_, i) => (addr - a0 + i < d.length ? d[addr - a0 + i] : rom0 ? rom0[addr + i] : undefined)); // payload over vanilla
        if (!bytes.every((x, i) => seg[i] === x)) add(quiet, "payloadsig", file, `${v} (${d.length} bytes) does not hold the PATCHED_IF bytes at 0x${addr.toString(16)}`);
      }
    }
    if (!negated && bytes.length <= 2) add(quiet, "weak", file, `${bytes.length} byte(s) at 0x${addr.toString(16)}`);
    const rom = roms[game];
    if (rom && addr + bytes.length <= rom.length) {
      const same = bytes.every((x, i) => rom[addr + i] === x);
      if (same !== negated) add("error", "vanilla", file, `${negated ? "PATCHED_IFNOT" : "PATCHED_IF"} reads as installed on vanilla ${game} at 0x${addr.toString(16)}`);
    }
    if (!archived) {
      const k = `${game}|${addr}|${bytes.join(",")}${negated ? "|not" : ""}`;
      if (!sigs.has(k)) sigs.set(k, []);
      sigs.get(k).push(file);
      if (!negated) sigList.push({ game, addr, bytes, file });
    }
  }
}
for (const [k, files] of sigs) {
  if (files.length > 1) for (const f of files) add("warn", "duplicate", f, `shares PATCHED_IF ${k.split("|")[0]} 0x${Number(k.split("|")[1]).toString(16)} with ${files.length - 1} other(s)`);
}
for (const a of sigList) {
  for (const b of sigList) {
    if (a === b || a.game !== b.game || a.file === b.file) continue;
    if (a.addr < b.addr || a.addr + a.bytes.length > b.addr + b.bytes.length) continue;
    if (a.bytes.length === b.bytes.length) continue; // equal signatures are reported as duplicates
    if (a.bytes.every((x, i) => b.bytes[a.addr - b.addr + i] === x)) {
      add("warn", "contained", a.file, `PATCHED_IF 0x${a.addr.toString(16)} (${a.bytes.length} bytes) lies inside that of ${relative(root, b.file)}`);
      break;
    }
  }
}

const count = (kind, level) => issues.filter((i) => i.kind === kind && (!level || i.level === level)).length;
const errors = issues.filter((i) => i.level === "error");
if (asJson) {
  console.log(JSON.stringify({ total, installable, detectable, issues }, null, 1));
} else {
  console.log(`patches: ${total}; installable (EA/BIN): ${installable}; with PATCHED_IF: ${detectable}; ROMs found: ${Object.keys(roms).join(",") || "none"}`);
  for (const kind of ["payload", "payloadsig", "vanilla", "contained", "empty", "weak", "nodetect", "meta", "noauthor", "duplicate"]) {
    console.log(`${kind.padEnd(10)} ${count(kind, "error") + count(kind, "warn") + count(kind, "info")} (${count(kind, "error")} error, ${count(kind, "warn")} warn, ${count(kind, "info")} archived)`);
  }
  if (details) for (const i of issues.filter((x) => x.level !== "info")) console.log(`${i.level.toUpperCase()} ${i.kind} ${i.file}: ${i.msg}`);
  else for (const i of errors.slice(0, 40)) console.log(`ERROR ${i.kind} ${i.file}: ${i.msg}`);
}
process.exit(errors.length ? 1 : 0);
