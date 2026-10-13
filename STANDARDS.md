# Standards for new FECK patches

Draft, to be finalized when the new GitHub project is created.

## Naming
- Folder: `<Category>/<kebab-or-Pascal-name>_<YYYYMMDD>` (date of last change); one patch per folder, no grab-bags.
- Core system patches: `<System>_<version>_<YYYYMMDD>`; add-ons live under the system they require.
- Files inside: `PATCH_<Name>.txt` plus payloads with the same stem where possible; no `OLD`, `gomi`, `layoutOLDOLD` leftovers.
- One language per field: `NAME.en` always present; `NAME` (JP) optional.

## Required metadata in PATCH_*.txt
NAME.en, INFO.en, AUTHOR, TAG, TYPE, PATCHED_IF, plus `VERSION` and `REQUIRES` (other patches) which upstream lacks.

## Layout
`<Game>/<NN_Category>/<patch>/` as in this repo; superseded versions go in `_older versions`, never loose beside the new one.

## Testing
Every patch should carry the ROM it was verified on and a PATCHED_IF that FECK can evaluate; golden tests in FECK take precedence.

## Out of scope
FE8N and unstable community patches (FECK ADR-0017).
