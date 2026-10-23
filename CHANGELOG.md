# Changelog

Changes to the library since the import. Patch behaviour is only changed where a line says so; everything else is
metadata. Commit ids are in this repository's history.

## 2026-10-23

- `VERIFIED.csv` gained a BIN group: 465 `TYPE=BIN` patches, each installed on an in-memory vanilla ROM (`BIN`, `BINF` and
  `CLEAR` lines applied; `JUMP` thunks written with a placeholder pointer) and its `PATCHED_IF` read back. 196 pass, 269 are not
  checked (224 use a `$GREP4`/`$FGREP4` search; the rest use `REPLACE_POINTER`, `EA` or an address rebase, so their bytes depend on the host). None fail.
- B1 fixes (FE8U, FE8J): `TAG` added to FixBattleAnimeExitNoise, FixGuideDictionarySortGlitch, BattleForecastFix, Fix_StatusUp_BigNumber,
  MENUFixCantoFix, fix_display_for_minus_statbooster and CritCap; `INFO.en` added to CG Fade glitch. No behaviour changed.
- B2 (QoL part 1): all 12 patches have a `PATCHED_IF`; every one the install check can read back passes. FE8U Show Heal Amount gained
  `INFO.en`, and its Chinese description, which sat under a stray `NAME.` key, is now `INFO.zh`. No behaviour changed.
- `48command_hack` (FE6, FE7U, FE8U, FE8J) signed with `PATCHED_IFNOT`; it now uses `PATCHED_IF` as `STANDARDS.md` asks. FE6, FE7U
  and FE8U read the 4 pointer bytes their payload writes at the hook; FE8J, whose hook is a free-space jump, reads its payload with `$FGREP4`.
- B4 (capacity and limits): audited the minimug, portrait, sound-room, sound-engine, save and autosave patches (about 45 files): all carry authors where an
  upstream credit exists and every installable one reads back (install check). FE7U, FE8U and FE8J 16_tracks_12_sounds gained `NAME`/`NAME.en`;
  FE7J and FE7U Unlock Sound Room songs gained `INFO.en`. FE6 MeleeAndMagicFix gained an `INFO.en` warning: it overwrites a live function at
  0x18188 with 11 callers, so it is unsafe as it stands (not fixed). `QOL-WISHLIST.md` records TESTER1's code reading of the B fixes (Enemy Control
  trap code also in FE7U, forecast garbling likely in FE7U and FE6, clear-turn list undetermined). No behaviour changed.
- B3 (system fixes): FE7J and FE7U Tutorial_Disabler signatures lengthened from the 2-byte branch they patched to the 4-byte
  `mov r0,#0; bx lr` payload they install at the tutorial check (0x79798, 0x78FC8). FE8J Less Annoying Fog and no_easy_mode gained
  `NAME.en`; FE7U display-all-weapon-ranks gained `INFO.en`. No behaviour changed.
- Install re-check with the fixed assembler (FECK 9db7136): FE8J arenadic and FE8U Text_Engine_Rework, which did not assemble on the
  `PROC_` macros, now assemble and pass (arenadic's `$FGREP4` payload also occurs in vanilla, noted). Four rows still do not assemble: both AoE and both ModularMinimugBox.
- `QOL-WISHLIST.md`: the Staff Range Fix is a range feature that conflicts with FreeRange, not a bug fix; it leaves the A foundations.

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
- Added `VERIFIED.csv`: the result of assembling 610 EA patches on their vanilla ROMs and reading their signatures back
  (575 pass, 35 not assemblable). 22 of the passes use a `$FGREP4` payload that also occurs in the vanilla ROM and are noted.

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
- `REQUIRES` defined in `STANDARDS.md` and added to 8 patch files whose INFO names a prerequisite in another folder (ShowDifficulty
  needs Casual mode; GetItemRangeString needs FreeRange) and extended on the 2 AoE installers (now also Anti-Huffman).
- `VERSION=YYYYMMDD` added to 591 patches, taken from the date suffix of the patch folder. Folders without a date get none.
- `STANDARDS.md`: detection, EA-patch and payload rules.

## 2026-10-15

- Added the ExtendWeaponDescBox ports (Vesly; ported by FECK) for FE7U, FE7J and FE6.

## 2026-10-13

- Initial import: the categorized FEBuilder patches overlaid with upstream `laqieer/FEBuilderGBA-patch2` 6b0105c2 (2026-07-02).
