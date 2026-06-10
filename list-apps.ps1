$ErrorActionPreference = "SilentlyContinue"

Write-Host "=== AppData Roaming (per-user apps) ===" -ForegroundColor Cyan
$results1 = @()
Get-ChildItem "$env:APPDATA" -Directory -Force -ErrorAction SilentlyContinue | ForEach-Object {
    $s = [math]::Round((Get-ChildItem $_.FullName -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB, 0)
    if ($s -gt 5) {
        $results1 += [PSCustomObject]@{ SizeMB=$s; Name=$_.Name; Created=$_.CreationTime.ToString('yyyy-MM-dd') }
    }
}
$results1 | Sort-Object SizeMB -Descending | Format-Table -AutoSize

Write-Host "=== AppData Local (per-user local data) ===" -ForegroundColor Cyan
$results2 = @()
Get-ChildItem "$env:LOCALAPPDATA" -Directory -Force -ErrorAction SilentlyContinue | ForEach-Object {
    $s = [math]::Round((Get-ChildItem $_.FullName -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB, 0)
    if ($s -gt 5) {
        $results2 += [PSCustomObject]@{ SizeMB=$s; Name=$_.Name; Created=$_.CreationTime.ToString('yyyy-MM-dd') }
    }
}
$results2 | Sort-Object SizeMB -Descending | Format-Table -AutoSize

Write-Host "=== AppData LocalLow ===" -ForegroundColor Cyan
$results3 = @()
Get-ChildItem "$env:LOCALAPPDATA\..\LocalLow" -Directory -Force -ErrorAction SilentlyContinue | ForEach-Object {
    $s = [math]::Round((Get-ChildItem $_.FullName -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB, 0)
    if ($s -gt 5) {
        $results3 += [PSCustomObject]@{ SizeMB=$s; Name=$_.Name; Created=$_.CreationTime.ToString('yyyy-MM-dd') }
    }
}
$results3 | Sort-Object SizeMB -Descending | Format-Table -AutoSize
