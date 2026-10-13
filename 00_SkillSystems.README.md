# SkillSystems in the FEBuilder patch DB

FEBuilder stores SkillSystems as many dated `skill_YYYYMMDD` folders per game plus loose addon patches. They were
named inconsistently (`skill20220703`, `skill_2018_06_09`, bare `skill`); all are normalised here to `skill_YYYYMMDD`
(bare `skill` became `skill_20171130`).

```
<game>\00_SkillSystems\
  core\CURRENT\skill_<date>          newest core for that game
  core\_older versions\skill_<date>  every earlier core, kept for diffing
  addons\<name>                      patches that need a SkillSystems core installed
  FE8N (out of scope, ADR-0017)\     FE8N-specific skill patches
```

## Which core is current

| Game | CURRENT | Older cores |
|---|---|---|
| FE8U | skill_20220703 | 31 (20171130 â€¦ 20220527) |
| FE8J | skill_20190219 (named "Skill Extension FE8N") | 4 (20171130 â€¦ 20180609) |
| FE8U CSkillSys | 100LTS_20240910, 330LTS_20250122 in `core\CSkillSys` (C-based, separate lineage; not interchangeable with the skill_ cores) | — |
| FE6, FE7J, FE7U | none: FEBuilder has no SkillSystems core for these | â€” |

## FE8U addons (need the core)

autosave_with_skillsystems, autosave_with_vesly_custom_skillsystems, DoubleRogueSkill, FixSkillTextID0x02,
HeroesMovement_SkillSystems, PreBattleTable_SkillSystems, Resource_SkillSystems_Spanish,
WeaponEffectiveness2x3x_with_skillsystems, WeaponLockArray_SkillSystems.

Also related but filed by function elsewhere: `10_Growth_Class_Stats\ClassLevelMax` (needs the core),
`01_BattleAnimation\*skill*` (skill animation hooks).

The copies of SkillSystems used by FECK's buildfile work live in `REFERENCE\BuildFileExamples` and are separate.

