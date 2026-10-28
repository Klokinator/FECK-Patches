// Case-only path mismatches. Zero dependencies: node _tools/check-case.mjs [--fix] [--csv]
// The ROM tools (FEBuilder, Windows) match file names without case; raw.githubusercontent.com and the browser's index match them exactly,
// so a reference that differs from the real name only in case installs in FEBuilder and fails in FECK.
// Checks (1) the file references of every PATCH_*.txt (EA=, BIN:, BINF:, TEXTADV:, JUMP:, SYMBOL=, UPDATE_*=, EDIT_PATCH:, ...), resolved from the patch's folder,
// and (2) #include / #incbin / #incext lines of the .event files, resolved from the including file's folder (not fixed: the .event is patch content).
// An entry is listed only when the exact path is missing and a path differing only in case exists. --fix rewrites the PATCH reference to the real
// spelling (the file name stays as upstream has it), byte-for-byte except that token; --csv prints CSV. Exit 1 when any mismatch is listed.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fix = process.argv.includes("--fix"), asCsv = process.argv.includes("--csv");
const ls = new Map();
const entries = (d) => { let e = ls.get(d); if (!e) { try { e = readdirSync(d); } catch { e = null; } ls.set(d, e); } return e; };

// Resolve ref (either slash) from dir; returns { exact, real } where real is the on-disk spelling of ref (null when it does not resolve even without case).
const resolveRef = (dir, ref) => {
  const parts = ref.split(/[\\/]/).filter((s) => s !== "" && s !== ".");
  let cur = dir; const real = []; let exact = true;
  for (const p of parts) {
    if (p === "..") { cur = dirname(cur); real.push(p); continue; }
    const e = entries(cur);
    if (!e) return { exact, real: null };
    let hit = e.includes(p) ? p : null;
    if (!hit) { const l = e.filter((n) => n.toLowerCase() === p.toLowerCase()); if (l.length !== 1) return { exact, real: null }; hit = l[0]; exact = false; }
    real.push(hit); cur = join(cur, hit);
  }
  return { exact, real: real.join("/") };
};

const KEYS = /^(EA|BIN|BINF|TEXTADV|JUMP|SYMBOL|TEXT_IMPORT|EDIT|IMAGE|UPDATE_PATCH|UPDATE_UNINSTALL|EDIT_PATCH|AFTER_TRY_EXECUTE)([:=])/;
const rows = [];
const walk = (d) => {
  for (const n of readdirSync(d, { withFileTypes: true })) {
    if (n.name.startsWith(".") || n.name === "_tools" || n.name === "browser") continue;
    const p = join(d, n.name);
    if (n.isDirectory()) { walk(p); continue; }
    const rel = relative(root, p).split(sep).join("/");
    if (/^PATCH_.*\.txt$/i.test(n.name)) {
      const raw = readFileSync(p);
      let text; try { text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(raw); } catch { text = null; }
      if (text === null) continue;
      const lines = text.split(/(\r?\n)/);
      let changed = false;
      for (let i = 0; i < lines.length; i += 2) {
        const m = KEYS.exec(lines[i]); if (!m) continue;
        const eq = lines[i].lastIndexOf("=");
        const ref = lines[i].slice(eq + 1).trim();
        if (!ref || /^\$|^0x/i.test(ref) || !/[.\\/]/.test(ref)) continue;
        const r = resolveRef(d, ref);
        if (r.real === null || r.exact) continue;
        rows.push([rel, "patch", ref, r.real]);
        if (fix) { lines[i] = lines[i].slice(0, eq + 1) + lines[i].slice(eq + 1).replace(ref, ref.includes("\\") ? r.real.split("/").join("\\") : r.real); changed = true; }
      }
      if (fix && changed) writeFileSync(p, Buffer.from(lines.join(""), "utf8"));
    } else if (/\.(event|txt)$/i.test(n.name) && !/^PATCH_/i.test(n.name)) {
      let text; try { text = readFileSync(p).toString("latin1"); } catch { continue; }
      for (const m of text.matchAll(/^\s*#(?:include|incbin|incext\s+\w+)\s*"([^"]+)"/gim)) {
        const r = resolveRef(d, m[1]);
        if (r.real !== null && !r.exact) rows.push([rel, "include", m[1], r.real]);
      }
    }
  }
};
for (const g of ["FE6", "FE7J", "FE7U", "FE8J", "FE8U"]) walk(join(root, g));

if (asCsv) console.log("File,Kind,Reference,RealName\n" + rows.map((r) => r.map((v) => '"' + v.replace(/"/g, '""') + '"').join(",")).join("\n"));
else for (const r of rows) console.log(r[1].padEnd(8), r[0], "|", r[2], "->", r[3]);
console.log(rows.length + " case-only mismatch(es): " + rows.filter((r) => r[1] === "patch").length + " in PATCH lines, " + rows.filter((r) => r[1] === "include").length + " in .event includes" + (fix ? " (PATCH lines fixed)" : ""));
process.exit(rows.length ? 1 : 0);
