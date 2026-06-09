$ErrorActionPreference = "SilentlyContinue"

Write-Host "=== C Drive Growth Trend Analysis ===" -ForegroundColor Cyan
Write-Host ""

# 1. Recent large files created (last 30 days)
Write-Host "[1] Large files created in last 30 days (>50MB) ===" -ForegroundColor Yellow
$cutoff = (Get-Date).AddDays(-30)
Get-ChildItem C:\Users\canhai -Recurse -Force -ErrorAction SilentlyContinue |
    Where-Object { -not $_.PSIsContainer -and $_.CreationTime -gt $cutoff -and $_.Length -gt 50MB } |
    Sort-Object Length -Descending |
    Select-Object @{N='SizeMB';E={[math]::Round($_.Length/1MB,0)}}, @{N='Created';E={$_.CreationTime.ToString('MM-dd HH:mm')}}, FullName -First 20 |
    Format-Table -AutoSize

# 2. Large files modified in last 7 days
Write-Host "[2] Large files modified in last 7 days (>100MB) ===" -ForegroundColor Yellow
$cutoff7 = (Get-Date).AddDays(-7)
Get-ChildItem C:\Users\canhai -Recurse -Force -ErrorAction SilentlyContinue |
    Where-Object { -not $_.PSIsContainer -and $_.LastWriteTime -gt $cutoff7 -and $_.Length -gt 100MB } |
    Sort-Object Length -Descending |
    Select-Object @{N='SizeMB';E={[math]::Round($_.Length/1MB,0)}}, @{N='Modified';E={$_.LastWriteTime.ToString('MM-dd HH:mm')}}, @{N='Path';E={$_.FullName}} -First 15 |
    Format-Table -AutoSize

# 3. AppData growth by month (creation date of top-level folders)
Write-Host "[3] AppData\Local folder creation timeline ===" -ForegroundColor Yellow
Get-ChildItem C:\Users\canhai\AppData\Local -Directory -Force -ErrorAction SilentlyContinue |
    Where-Object { $_.CreationTime -gt (Get-Date).AddMonths(-6) } |
    Sort-Object CreationTime |
    Select-Object @{N='Created';E={$_.CreationTime.ToString('yyyy-MM-dd')}}, Name |
    Format-Table -AutoSize

# 4. Top growing folders (compare size vs creation date)
Write-Host "[4] Recently modified large folders in AppData\Local ===" -ForegroundColor Yellow
Get-ChildItem C:\Users\canhai\AppData\Local -Directory -Force -ErrorAction SilentlyContinue |
    Where-Object { $_.LastWriteTime -gt $cutoff7 } |
    ForEach-Object {
        $size = [math]::Round((Get-ChildItem $_.FullName -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB, 0)
        if ($size -gt 100) {
            [PSCustomObject]@{
                SizeMB = $size
                Modified = $_.LastWriteTime.ToString('MM-dd')
                Name = $_.Name
            }
        }
    } |
    Sort-Object SizeMB -Descending |
    Format-Table -AutoSize

# 5. npm/pip/cargo growth history
Write-Host "[5] Package manager cache sizes ===" -ForegroundColor Yellow
$caches = @(
    @{Name="npm-cache"; Path="$env:LOCALAPPDATA\npm-cache"},
    @{Name="pip-cache"; Path="$env:LOCALAPPDATA\pip\cache"},
    @{Name=".cargo"; Path="$env:USERPROFILE\.cargo"},
    @{Name=".nuget"; Path="$env:USERPROFILE\.nuget"},
    @{Name=".m2"; Path="$env:USERPROFILE\.m2"},
    @{Name="pub-cache"; Path="$env:LOCALAPPDATA\pub-cache"},
    @{Name="pnpm-store"; Path="$env:LOCALAPPDATA\pnpm"}
)
foreach ($c in $caches) {
    if (Test-Path $c.Path) {
        $s = [math]::Round((Get-ChildItem $c.Path -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB, 0)
        $latest = (Get-ChildItem $c.Path -Recurse -Force -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1).LastWriteTime
        if ($s -gt 10) {
            Write-Host "  $($c.Name): $s MB (last used: $($latest.ToString('yyyy-MM-dd')))"
        }
    }
}

# 6. Disk usage by category
Write-Host ""
Write-Host "[6] Usage breakdown estimate ===" -ForegroundColor Yellow
$categories = @(
    @{Name="AppData (apps)"; Path="C:\Users\canhai\AppData"},
    @{Name="Program Files"; Path="C:\Program Files"},
    @{Name="Program Files x86"; Path="C:\Program Files (x86)"},
    @{Name="Windows"; Path="C:\Windows"},
    @{Name="ProgramData"; Path="C:\ProgramData"},
    @{Name="Other (root)"; Path="C:\"}
)
foreach ($cat in $categories) {
    $s = [math]::Round((Get-ChildItem $cat.Path -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1GB, 1)
    Write-Host "  $($cat.Name): $s GB"
}
