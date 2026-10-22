param([switch]$DryRun)
# Overlays the newest upstream FEBuilderGBA-patch2 content onto the categorized tree.
$u = 'F:\AI PROJECTS\FEBuilder Rebuild\REFERENCE\FEBuilderGBA-patch2 (upstream)'
$d = 'F:\AI PROJECTS\FEBuilder Rebuild\FECK-Patches'
$games = 'FE6','FE7J','FE7U','FE8J','FE8U'

# Where new upstream top-level folders belong (decided by hand).
$newHome = @{
  'FE6|Chapter OP'                                     = 'FE6\04_Graphics_Palette\Chapter OP'
  'FE6|Title Screen'                                   = 'FE6\04_Graphics_Palette\Title Screen'
  'FE6|FastBattleAnimation20220531'                    = 'FE6\01_BattleAnimation\FastBattleAnimation20220531'
  'FE7U|FastBattleAnimation20220531'                   = 'FE7U\01_BattleAnimation\FastBattleAnimation20220531'
  'FE8J|Fix_String_ExpandNames_ClearAndCopyString'     = 'FE8J\03_Text\Fix_String_ExpandNames_ClearAndCopyString'
  'FE8U|Fix_Clear_FilterSomeTextFromStandardBuffer'    = 'FE8U\03_Text\Fix_Clear_FilterSomeTextFromStandardBuffer'
  'FE6|AutoSave'                                       = 'FE6\08_Save_Records\AutoSave'
  'FE7J|AutoSave'                                      = 'FE7J\08_Save_Records\AutoSave'
  'FE8U|skill20240910-CSkillSys100LTS'                 = 'FE8U\00_SkillSystems\core\CSkillSys\CSkillSys_100LTS_20240910'
  'FE8U|skill202501220-CSkillSys330LTS'                = 'FE8U\00_SkillSystems\core\CSkillSys\CSkillSys_330LTS_20250122'
}

$log = @()
foreach ($g in $games) {
  # leaf name -> destination dirs in the categorized tree
  $leaf = @{}
  Get-ChildItem "$d\$g" -Directory -Recurse | ForEach-Object {
    if (-not $leaf.ContainsKey($_.Name)) { $leaf[$_.Name] = @() }
    $leaf[$_.Name] += $_.FullName
  }
  foreach ($top in Get-ChildItem "$u\$g" -Directory) {
    $name = $top.Name
    $key = "$g|$name"
    $norm = $name
    if ($name -match '^skill_?(\d{8})$') { $norm = "skill_$($matches[1])" }
    elseif ($name -match '^skill_(\d{4})_(\d\d)_(\d\d)$') { $norm = "skill_$($matches[1])$($matches[2])$($matches[3])" }
    $dest = $null
    if ($newHome.ContainsKey($key)) {
      $dest = Join-Path $d $newHome[$key]
    } elseif ($leaf.ContainsKey($norm)) {
      # prefer the non-"_older versions" location when several
      $c = $leaf[$norm]
      $dest = ($c | Where-Object { $_ -notmatch '_older versions' } | Sort-Object { ($_ -split '\\').Count } | Select-Object -First 1)
      if (-not $dest) { $dest = $c[0] }
    } elseif ($name -eq 'skill') {
      $dest = "$d\$g\00_SkillSystems\core\_older versions\skill_20171130"
    } else {
      $log += "ORPHAN`t$g`t$name"
      continue
    }
    $log += "COPY`t$g`t$name`t$($dest.Substring($d.Length+1))"
    if (-not $DryRun) {
      New-Item -ItemType Directory -Force $dest | Out-Null
      robocopy $top.FullName $dest /E /NFL /NDL /NJH /NJS /NP | Out-Null
    }
  }
}
$log | Set-Content "$env:TEMP\overlay-log.txt"
"copy: $(($log | ? {$_ -like 'COPY*'}).Count)  orphan: $(($log | ? {$_ -like 'ORPHAN*'}).Count)"
$log | ? { $_ -like 'ORPHAN*' }


