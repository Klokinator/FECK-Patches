# Standards for new FECK patches

Draft, to be finalized when the new GitHub project is created.

## Naming
- Folder: `<Category>/<kebab-or-Pascal-name>_<YYYYMMDD>` (date of last change); one patch per folder, no grab-bags.
- Core system patches: `<System>_<version>_<YYYYMMDD>`; add-ons live under the system they require.
- Files inside: `PATCH_<Name>.txt` plus payloads with the same stem where possible; no `OLD`, `gomi`, `layoutOLDOLD` leftovers.
- One language per field: `NAME.en` always present; `NAME` (JP) optional.

## Required metadata in PATCH_*.txt
NAME.en, INFO.en, AUTHOR, TAG, TYPE, PATCHED_IF, plus `VERSION` and `REQUIRES` (other patches) which upstream lacks.
`REQUIRES=<folder>[;<folder>...]` names the patches that must be installed first, as folder paths under the game folder
(`10_Growth_Class_Stats/Passive Boosts Patches`); `|` inside one entry lists alternatives (either variant will do). Add it only
when the patch's own INFO or code says it depends on another patch; never guess. It covers prerequisites in other folders only;
the installer and editor files of one patch share a folder and need none. Nothing reads it yet.
`VERSION=<YYYYMMDD>` is the date of the patch's last change, taken from the date suffix of its folder name. A patch whose
folder has no date suffix gets no `VERSION` line; never invent one.

## Layout
`<Game>/<NN_Category>/<patch>/` as in this repo; superseded versions go in `_older versions`, never loose beside the new one.

## Testing
Every patch should carry the ROM it was verified on and a PATCHED_IF that FECK can evaluate; golden tests in FECK take precedence.

## Out of scope
FE8N and unstable community patches (FECK ADR-0017).

## Detection (PATCHED_IF)
- Every installable patch (TYPE EA or BIN) carries a `PATCHED_IF:<addr>=<bytes>` that is false on the untouched vanilla ROM and true after install. Use `PATCHED_IFNOT` only for a patch that removes something.
- Use at least 4 bytes, and 16 where the patch writes that much. A signature that is a prefix of a sibling patch's signature reads as installed when the sibling is (the Passive Boosts defect); when two patches write the same hook, add bytes that differ.
- A hook written by a `JUMP` or a free-space pointer holds a thunk or an address that depends on where the host put the code. Sign the fixed bytes next to it, or the payload's own first bytes, never the pointer.
- `_tools/validate-library.mjs` enforces this: it fails the library on a signature that is true on vanilla, and warns on weak, missing or payload-inconsistent ones. Run it before every handoff.

## EA patches
- Host-defined symbols: FEBuilder's `MakeEAAutoDef` defines `ItemTable` (and similar) before an EA patch runs. FECK's buildfile path does the same. A patch that uses such a symbol should say so in `INFO.en`.
- A code block after `POP` with no `ORG` relies on the host choosing free space (`ALLOC_SIZE_HINT`). Prefer an explicit `ORG` or a documented hint.
- Verify each EA patch by assembling it on a vanilla ROM and comparing `PATCHED_IF` before and after.

## Payload files
- Every `BIN:`, `BINF:` and `EA=` file a patch names sits in the patch's own folder. A `BIN:<addr>=<file>` whose address contains the patch's `PATCHED_IF` must hold those same bytes there.
