# Highly desirable QoL / essential-fix patches

Paths are relative to this folder. "All" = FE6, FE7J, FE7U, FE8J, FE8U where the patch exists (check INDEX.csv).
Priority: **A** = hacks effectively assume it, **B** = very common and cheap, **C** = nice to have.

## A: foundations

| Patch | Games | Folder | Why |
|---|---|---|---|
| 01command_hack (cape flap) | FE6, FE7J, FE7U, FE8J, FE8U | `<game>\01_BattleAnimation\01command_hack` | Replaces the poorly understood C47 cloak command with a looping C01. Nearly every custom battle animation needs it; required for the BAE (battle animation editor). |
| 48command_hack | all | FE6/FE7U/FE8U `12_Fixes_Misc_System\FEEditor\48command_hack`, FE7J/FE8J `12_Fixes_Misc_System\48command_hack` | Companion C48 command hack used by custom animations. |
| FE8 Text Engine Rework (Tequila, Zahlman, Stan, Black Mage, Eliwan) | FE8U | `FE8U\03_Text\FE8-Text_Engine_Rework` | Rewrites the text engine: fonts/escape codes, easier extension. Foundation for the other text patches. EA based; read its `_README.txt`. |
| MeleeAndMagicFix (+ItemFix20220721) | FE7J/FE7U/FE8J/FE8U | `FE8U\09_Arena_Shop_Items\MeleeAndMagicFix_ItemFix20220721`, `FE8U\12_Fixes_Misc_System\FEEditor\MeleeAndMagicFix` | Lets weapons be melee/ranged/magic by weapon rather than class; needed by any magic-system hack. |
| Anti-Huffman | all | `<game>\12_Fixes_Misc_System\Anti-Huffman` (FEEditor\ in FE6/FE7U/FE8U) | Stops Huffman text compression so text can be edited/expanded freely. |
| fix_lz77decompress | FE8U, FE8J | `FE8U\08_Save_Records\fix_lz77decompress` | Fixes the LZ77 decompress bug that corrupts big images. |
| FE8-Staff Range Fix / FE7-Staff Range Fix | FE8U, FE7U | `FE8U\09_Arena_Shop_Items\FE8-Staff Range Fix` | Not a bug fix: a range feature (staff and weapon range extension) that conflicts with FreeRange. Not one of the foundations; no FE8J, FE7J or FE6 version exists upstream, so none is ported. A real FE7J or FE6 staff-range bug waits for evidence in the game. |

## B: fixes (small, safe, almost always wanted)

| Patch | Games | Folder |
|---|---|---|
| Enemy Control Glitch Fix | FE8U, FE8J | `12_Fixes_Misc_System\Enemy Control Glitch Fix` |
| Fix dodge to front glitch | FE7J, FE7U, FE8J, FE8U | `12_Fixes_Misc_System\Fix dodge to front glitch` |
| Fimbulvetr Glitch Fix | FE7U | `FE7U\12_Fixes_Misc_System\SYSTEM` (grab-bag) |
| HP Bar and Cloud Fix | FE8U, FE8J | `04_Graphics_Palette\HP Bar and Cloud Fix` |
| CG Fade glitch | FE8U, FE8J | `04_Graphics_Palette\CG Fade glitch` |
| MENUFixCantoFix (7743 / Contro) | FE8U, FE8J | `05_Menu_UI\MENUFixCantoFix 7743` |
| BattleForecastFix | FE8U, FE8J | `05_Menu_UI\BattleForecastFix` |
| Fix_StatusUp_BigNumber | FE8U, FE8J | `05_Menu_UI\Fix_StatusUp_BigNumber` |
| fix_display_for_minus_statbooster | FE8U, FE8J | `05_Menu_UI\fix_display_for_minus_statbooster` |
| FixBattleAnimeExitNoise | FE8U, FE8J | `01_BattleAnimation\FixBattleAnimeExitNoise` |
| FixGuideDictionarySortGlitch | FE8U, FE8J | `03_Text\FixGuideDictionarySortGlitch` |
| fix_drawclearnturn_glitch | FE8U, FE8J | `12_Fixes_Misc_System\fix_drawclearnturn_glitch` |
| CritCap (crit never shown over 100%) | FE8U, FE8J | `10_Growth_Class_Stats\CritCap` |
| SetupNewWMRoute_Fix | FE8U, FE8J | `06_Events_Scripting\SetupNewWMRoute_Fix` |
| FreeRange20211217 (range display fix) | FE7J, FE7U, FE8U, FE8J | `11_Map_Movement\FreeRange20211217` |
| AI: Prevent Healer Mistarget | FE7J, FE8U, FE8J | `12_Fixes_Misc_System\SYSTEM` (grab-bag) |
| LeaderAIFix | FE7U, FE8U, FE8J | `07_AI\LeaderAIFix_*` |
| Mode Coefficient EXP fix (grab-bag: Remove Pierce Glitch, hold-A fast move, skip intro, wyvern triangle, stone anim crash) | FE8U, FE8J | `10_Growth_Class_Stats\Mode Coefficient EXP fix` |

### Code-reading findings for the B fixes (TESTER1, item 3 second pass; nothing was played)

- Enemy Control Glitch Fix: FE7U has the same trap code (bytes `07 E0` at 0x3454C), so a port is plausible; FE6 has no such site.
- BattleForecastFix: the same structure exists in FE7U and FE6 and the garbling is likely there too, but it was not reproduced. No port until it is seen in the game.
- fix_drawclearnturn_glitch (clear-turn list): not determined; do not port.
- FE6 MeleeAndMagicFix overwrites a live function at 0x18188 that has 11 callers, so it is unsafe as it stands. Flagged in its INFO; not fixed.

## B: quality of life

| Patch | Games | Folder | Effect |
|---|---|---|---|
| Fast battle animation (R button) | FE8U, FE8J | `01_BattleAnimation\FastBattleAnimation20220531` | Hold R to fast-forward. |
| SpeedUpAnims | FE8U, FE8J | `01_BattleAnimation\SpeedUpAnims` | Hold A for high speed. |
| Battle Stats with Anims Off (v2) | FE6, FE7U, FE8U, FE8J | `01_BattleAnimation\*Battle Stats with Anims Off*` | Stats screen/forecast stays correct with animations off. |
| Danger Zone | FE7U, FE8U, FE8J | `07_AI\Danger Zone` | Toggle enemy threat range on the map. |
| Show Heal Amount | FE8U | `05_Menu_UI\Show Heal Amount` | Shows heal numbers in the forecast. |
| Staff and Item Lock | FE8U, FE8J | `09_Arena_Shop_Items\FE8U-Staff and Item Lock` | Weapon-lock rules apply to staffs/items. |
| StealWithFullInv | FE8U, FE8J | `09_Arena_Shop_Items\StealWithFullInv 20221006` | Steal even with full inventory. |
| ItemSortOrder | FE8U, FE8J | `09_Arena_Shop_Items\ItemSortOrder` | Sensible convoy sort. |
| Use Item Might for Healing | FE7U, FE8U, FE8J | `09_Arena_Shop_Items\Use Item Might for Healing` | DSFE style MAG/2 + staff might. |
| ExtendWeaponDescBox | FE8U, FE8J | `03_Text\ExtendWeaponDescBox_*` | Weapon descriptions up to 3 lines. |
| AutoNewline | FE8U | `03_Text\AutoNewline` | Text auto line-break. |
| display-all-weapon-ranks | FE7U, FE8U, FE8J | `05_Menu_UI\display-all-weapon-ranks-your-character-has` | Status screen shows every rank. |
| UpdatedLButtonCycling | all | `05_Menu_UI\UpdatedLButtonCycling` | L cycles units on the map. |
| StatScreenBlink | FE7J, FE7U, FE8U, FE8J | `05_Menu_UI\StatScreenBlink` | Blinking portrait on status. |
| Less Annoying Fog | FE8U, FE8J | `04_Graphics_Palette\Less Annoying Fog` | Fog less jarring. |
| Tutorial_Disabler / Remove Tutorial Map Menu | all | `12_Fixes_Misc_System\Tutorial_Disabler` | Kills the tutorial prompts. |
| no_easy_mode, Fixed Growths Mode | FE6â€“FE8 | `10_Growth_Class_Stats\*` | Remove easy mode / fixed growth mode. |
| WeaponIgnoreConPatch | FE8U | `09_Arena_Shop_Items\WeaponIgnoreConPatch` | Con ignored in attack speed. |
| Staff_Heal_Exp | FE8U, FE8J | `09_Arena_Shop_Items\Staff_Heal_Exp` | EXP for healing scales sensibly. |
| DisableMiniMap | all | `02_MusicSound\DisableMiniMap` (misfiled by name; see INDEX) | Removes the minimap. |

## B: capacity / limits

| Patch | Games | Folder |
|---|---|---|
| Allow 254 generic minimugs | all | `04_Graphics_Palette\Allow 254 generic minimugs` |
| mug_exceed (portrait hackbox +4 tiles) | FE7U, FE8U, FE8J | `04_Graphics_Palette\mug_exceed` |
| halfbody | FE8U, FE8J | `04_Graphics_Palette\halfbody` |
| soundroom_over255 | FE8U, FE8J | `02_MusicSound\soundroom_over255` |
| 16_tracks_12_sounds_patch | FE7J, FE7U, FE8J, FE8U | `02_MusicSound\16_tracks_12_sounds_patch` |
| Improved Sound Mixer / m4a_hq_mixer / drumfix | FE8U, FE8J (+m4a_hq_mixer all) | `02_MusicSound\*` |
| Unlock Sound Room songs | FE8U | `02_MusicSound\Unlock Sound Room songs` |
| ExpandedModularSave (+ExpandSupply) | FE8U | `08_Save_Records\ExpandedModularSave*` |
| autosave | all | `08_Save_Records\autosave` (SkillSystems variant in `00_SkillSystems\addons`) |

## Gaps to check

- FE6/FE7 have no Text Engine Rework or skill system counterparts in this DB.
- Upstream commit 6b0105c2 (2026-07-02) is merged in. New there: Fix_Clear_FilterSomeTextFromStandardBuffer (FE8U `03_Text`), Fix_String_ExpandNames_ClearAndCopyString (FE8J `03_Text`), FastBattleAnimation20220531 for FE6/FE7U, CSkillSys.
- Some folder names above come from INDEX.csv NameEn; confirm the exact folder with a filter before relying on it.

