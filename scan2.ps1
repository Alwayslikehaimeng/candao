$ErrorActionPreference = "SilentlyContinue"

Write-Host "=== C Drive Overview ===" -ForegroundColor Cyan
$disk = Get-PSDrive C
$total = [math]::Round(($disk.Used + $disk.Free)/1GB, 1)
$used = [math]::Round($disk.Used/1GB, 1)
$free = [math]::Round($disk.Free/1GB, 1)
$pct = [math]::Round($used/$total*100, 1)
Write-Host "Total: $total GB"
Write-Host "Used:  $used GB ($pct%)"
Write-Host "Free:  $free GB"
Write-Host ""

Write-Host "=== User Folder TOP 10 ===" -ForegroundColor Cyan
$results = @()
Get-ChildItem "C:\Users\canhai" -Directory -Force -ErrorAction SilentlyContinue | ForEach-Object {
    $size = (Get-ChildItem $_.FullName -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    $results += [PSCustomObject]@{ Path=$_.Name; SizeGB=[math]::Round($size/1GB, 2) }
}
$results | Sort-Object SizeGB -Descending | Select-Object -First 10 | Format-Table -AutoSize

Write-Host "=== AppData\Local TOP 15 ===" -ForegroundColor Cyan
$results2 = @()
Get-ChildItem "C:\Users\canhai\AppData\Local" -Directory -Force -ErrorAction SilentlyContinue | ForEach-Object {
    $size = (Get-ChildItem $_.FullName -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    $results2 += [PSCustomObject]@{ Path=$_.Name; SizeMB=[math]::Round($size/1MB, 0) }
}
$results2 | Sort-Object SizeMB -Descending | Select-Object -First 15 | Format-Table -AutoSize

Write-Host "=== Program Files TOP 10 ===" -ForegroundColor Cyan
$results3 = @()
Get-ChildItem "C:\Program Files" -Directory -Force -ErrorAction SilentlyContinue | ForEach-Object {
    $size = (Get-ChildItem $_.FullName -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    $results3 += [PSCustomObject]@{ Path=$_.Name; SizeMB=[math]::Round($size/1MB, 0) }
}
$results3 | Sort-Object SizeMB -Descending | Select-Object -First 10 | Format-Table -AutoSize

Write-Host "=== Program Files (x86) TOP 10 ===" -ForegroundColor Cyan
$results4 = @()
Get-ChildItem "C:\Program Files (x86)" -Directory -Force -ErrorAction SilentlyContinue | ForEach-Object {
    $size = (Get-ChildItem $_.FullName -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    $results4 += [PSCustomObject]@{ Path=$_.Name; SizeMB=[math]::Round($size/1MB, 0) }
}
$results4 | Sort-Object SizeMB -Descending | Select-Object -First 10 | Format-Table -AutoSize
