# Contributing to FECK-Patches

Anyone can edit this library. It is open source and not for profit (see `LICENSE` and the README's "License and credits").

## Before you change anything

1. Read `STANDARDS.md`: names, places, metadata keys and the detection rules (`PATCHED_IF` must be false on the vanilla ROM and
   true after install; use at least 4 bytes; never sign a free-space pointer).
2. Vanilla games only: FE6 (J), FE7 (J, U), FE8 (J, U). FE8N and unstable community patches are out of scope (they stay flagged, not improved).
3. Work on a copy of a ROM, never on the original.

## Adding or changing a patch

- One folder per patch: `<game>\<category>\<patch folder>\PATCH_<name>.txt` plus its payloads. Folders are whole; the
  patch file finds its payloads by relative name.
- Fill `NAME.en`, `INFO.en`, `TAG`, `TYPE`, `PATCHED_IF` and `AUTHOR`. Keep every existing `AUTHOR`. For a port, name the
  original author and add "ported by <you>". Never guess an author, and never credit "FEBuilder".
- Document the code: what it hooks, what it overwrites, which free space it uses.
- If a patch needs another, say so with `REQUIRES`; if two patches write the same bytes, the conflicts tool records it.
- Do not claim what vanilla does without checking the vanilla bytes.
- Thumb jump stubs (`BYTE 0x00 0x4B 0x18 0x47` then `POIN label`) need `|1` on the pointer; the validator rejects them otherwise.
- Test in an emulator. Never run an unmodified vanilla ROM in BizHawk (it names the save after the known game and can
  overwrite a real save): change one byte at the end first and use a unique file name.

## Checks to run

```
node _tools/validate-library.mjs        # must exit 0
node _tools/make-index.mjs              # regenerate INDEX.csv
node _tools/conflicts.mjs --csv > CONFLICTS.csv
node _tools/make-index.mjs --check
```

Add a line to `CHANGELOG.md` for anything that changes behaviour, with one line per fix beyond a signature.
Never rewrite history of this repository.
