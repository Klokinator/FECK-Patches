# Changelog

Changes to the library since the import. Patch behaviour is only changed where a line says so; everything else is
metadata. Commit ids are in this repository's history.

## 2026-10-22

Publication
- Added `LICENSE` (GPLv3) for the library's own additions, a "License and credits" section in the README (each patch keeps its
  author's terms) and `CONTRIBUTING.md`.
- Added FE7U CritCap (Contro; ported by FECK): caps the shown crit rate at 100. Added the `thumbptr` validator check (a jump
  stub whose pointer lacks the Thumb bit).
- Added FE7U Show Heal Amount (Tequila; FE7 version from masterofcontroversy's CC0 ASM collection).
- Install check (each installable EA patch assembled on its vanilla ROM, `PATCHED_IF` read afterwards): three wrong
  signatures fixed. FE7U UnitActionRework read 0x02F6E4, the hook is at 0x02F218; FE8J TalkList read 0x16E16, the hook is at
  0x92EE8 (`00 48 87 46`); FE8J 1RNMode_Flag read 0xCB8 (the FE8U address), the FE8J hook is at 0xC90.
- Removed 16 leftover folders (`OLD`, `gomi`, `layoutOLD*`, `old`, `Old Capture (Obsolete)`); none held a patch.

Detection and validation
- Added `_tools/validate-library.mjs`: payload, vanilla-`PATCHED_IF`, weak-signature, contained-signature, duplicate,
  empty-file, metadata and credit checks. Signatures are now checked against the vanilla ROMs and against the payload bytes.
- 145 two-byte `PATCHED_IF` signatures were lengthened to 4-8 bytes, taken from the bytes each installer writes
  (EA installers assembled with the standard prelude; JUMP thunks extended to their full form). Passive Boosts (FE7U, FE8U)
  can now tell the stacking and no-stack versions apart. Detection added for toggle_L, trap data limit, MeleeAndMagicFix
  and FE8J Fix EnemyCapture_GetUnitPortraitId.
- Ten patches that the upstream overlay had emptied were restored. The 32 patches that are still empty upstream (29 zero
  bytes, 3 holding only a byte-order mark) were removed on the owner's say-so; the validator now reports no `empty` files.
- Added `_tools/conflicts.mjs` and `CONFLICTS.csv` (59 pairs with overlapping signatures and different bytes); each such
  patch carries the other's signature as `CONFLICT_IF`.
- Added `_tools/make-index.mjs`; `INDEX.csv` is generated and checkable.

Fixes to patches
- Five `Installer.event` files (ChangeStatusBGEachChapter and ChangePoisonDamage in FE8J and FE8U, ChangePortrait in FE8U)
  had a stray `#endif`; removed.
- FE7J tile-healing item id: `ADDRESS` pointed at the FE7U address; now 0x032D9A.
- ExtendWeaponDescBox ports (FE6, FE7J, FE7U): `INFO.en` lost its second sentence to a raw line break.
- FE7U OPLOGO TextShadow: `PALETTE_POINTER` named the image pointer (0x0BA550); the palette pointer is at 0x0BA54C
  (0x66AB28 in the vanilla ROM). The other FE7U OPLOGO pointers match the vanilla ROM.
- Duplicate `01command_hack` copies under `12_Fixes_Misc_System/FEEditor` removed.

Metadata
- 190 `AUTHOR` credits added from sibling patches, reference snapshots and folder names. No author was guessed; patches with
  no upstream credit stay uncredited (`noauthor` in the validator).
- 486 `NAME.en` lines added, copied from the English-only `NAME`.
- `REQUIRES` defined in `STANDARDS.md` and added to 5 patches whose INFO names a prerequisite.
- `STANDARDS.md`: detection, EA-patch and payload rules.

## 2026-10-15

- Added the ExtendWeaponDescBox ports (Vesly; ported by FECK) for FE7U, FE7J and FE6.

## 2026-10-13

- Initial import: the categorized FEBuilder patches overlaid with upstream `laqieer/FEBuilderGBA-patch2` 6b0105c2 (2026-07-02).
