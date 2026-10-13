# FECK-Patches

Every patch FEBuilderGBA ships in its `config/patch2/<game>/` database, copied into one tree and sorted by what the
patch does. Source: `laqieer/FEBuilderGBA-patch2` at commit 6b0105c2 (2026-07-02), overlaid onto the earlier hand-categorized snapshot of FEBuilderGBA_20210328.22. Folders removed upstream sit in `FE8U\_removed-upstream`.
Nothing here is edited; folders are whole, so the `PATCH_*.txt` files still find their `.dmp/.s/.event/.png/.bin`
payloads by relative name.

Out of scope for FECK (ADR-0017): FE8N and unstable community patches. They are kept, under
`00_SkillSystems\FE8N (out of scope, ADR-0017)` or flagged in INDEX.csv, but are not targets.

## Layout

```
<game>\<category>\<patch folder>\PATCH_*.txt (+ payloads)
<game>\<category>\_older versions\<patch folder>     dated variants superseded by a newer one
```

Games: `FE6`, `FE7J`, `FE7U`, `FE8J`, `FE8U`.

| Category | What lives there |
|---|---|
| 00_SkillSystems | SkillSystems core + addons. See its own README. |
| 01_BattleAnimation | Battle anim engine hooks (01command_hack, CSA, fast/skip anims), spell effects, anim fixes |
| 02_MusicSound | Mixer, tracks, drum fix, sound room, voices, minimap toggle |
| 03_Text | Text engine, fonts, descriptions, chapter titles, dictionary |
| 04_Graphics_Palette | Portraits, CG, backgrounds, HP bar, fog, palettes, icons |
| 05_Menu_UI | Menus, status screen, forecast, cursor, L button, popups |
| 06_Events_Scripting | Event commands, ASMC library, world map events, hooks |
| 07_AI | AI behaviour, danger zone, leader AI |
| 08_Save_Records | Autosave, save expansion, compression |
| 09_Arena_Shop_Items | Items, weapons, staffs, shops, arena |
| 10_Growth_Class_Stats | Growths, classes, levels, stat formulas, modes |
| 11_Map_Movement | Movement, range display, canto, rescue, map tweaks |
| 12_Fixes_Misc_System | Glitch fixes, system tweaks, FEEditor-era essentials |

## INDEX.csv

One row per `PATCH_*.txt` (4377 rows): Game, Category, Superseded, RemovedUpstream, Folder (path relative to this folder), OldFolder
(name in the FEBuilder DB), PatchFile, NameEn, NameJp, Type, Tag, Author. Filter on Game then NameEn/Tag. FEBuilder
tags: `#ENGINE`, `#IMAGE`, `#EVENT`, `#BGM`, `#SOUND`, `#TEXT`, `#ESSENTIALFIXES`.

## Things to know

- Grab-bag folders hold many small unrelated patches in one folder: `SYSTEM`, `SYSTEM_IMAGE`, `FEEditor`, `OTHER`,
  `Text`, `MENU`, `Mode Coefficient EXP fix`. Use INDEX.csv to find a patch inside them.
- "Superseded" is by date suffix within the same name; a dated variant is not always a strict upgrade, so check the
  INFO text when it matters.
- FE8J skill folders are mostly FE8N-flavoured (Japanese hack lineage), not the English skill system.
- Includes the new C-based CSkillSys (100LTS, 330LTS) under `FE8U\00_SkillSystems\core\CSkillSys`, a different lineage from the assembler `skill_YYYYMMDD` cores.
- FastBattleAnimation20220531 now also exists for FE6 and FE7U.
- See `QOL-WISHLIST.md` for the patches worth reproducing or supporting first.

