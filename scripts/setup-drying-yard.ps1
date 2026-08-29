param(
  [string]$ProjectPath = "D:\เสาไฟฟ้า"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $ProjectPath)) {
  throw "ไม่พบโฟลเดอร์โครงการ: $ProjectPath"
}

Set-Location $ProjectPath

$envFile = Join-Path $ProjectPath ".env.local"
$apiUrl = "https://erweztmbezbwbjzwjxqt.supabase.co/functions/v1/drying-yard-admin-api"
$teamUrl = "https://raw.githack.com/Kosid-B/pole/lantak-public/public/lantak-team-loader.html"
$adminUrl = "https://raw.githack.com/Kosid-B/pole/admin-public/public/lantak-admin.html"

$username = Read-Host "Admin username สำหรับงานลานตาก"
$passwordSecure = Read-Host "Admin password สำหรับงานลานตาก" -AsSecureString
$passwordPtr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($passwordSecure)
try {
  $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPtr)
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPtr)
}

if ([string]::IsNullOrWhiteSpace($username) -or [string]::IsNullOrWhiteSpace($password)) {
  throw "username/password ห้ามว่าง"
}

$existing = if (Test-Path $envFile) { Get-Content $envFile -Raw } else { "" }
$keys = @(
  "DRYING_YARD_ADMIN_API_URL",
  "DRYING_YARD_ADMIN_USERNAME",
  "DRYING_YARD_ADMIN_PASSWORD",
  "NEXT_PUBLIC_DRYING_YARD_TEAM_URL",
  "NEXT_PUBLIC_DRYING_YARD_ADMIN_URL"
)

foreach ($key in $keys) {
  $existing = [Regex]::Replace(
    $existing,
    "(?m)^" + [Regex]::Escape($key) + "=.*(?:\r?\n)?",
    ""
  )
}

$block = @"

# Drying Yard 446-point integration
DRYING_YARD_ADMIN_API_URL="$apiUrl"
DRYING_YARD_ADMIN_USERNAME="$username"
DRYING_YARD_ADMIN_PASSWORD="$password"
NEXT_PUBLIC_DRYING_YARD_TEAM_URL="$teamUrl"
NEXT_PUBLIC_DRYING_YARD_ADMIN_URL="$adminUrl"
"@

Set-Content -Path $envFile -Value ($existing.TrimEnd() + $block + "`r`n") -Encoding UTF8

Write-Host ""
Write-Host "ตั้งค่างานลานตากเรียบร้อย" -ForegroundColor Green
Write-Host "ไฟล์: $envFile"
Write-Host "Route: http://localhost:3000/drying-yard"
Write-Host ""
Write-Host "ขั้นต่อไป:" -ForegroundColor Cyan
Write-Host "  pnpm install"
Write-Host "  pnpm dev"
