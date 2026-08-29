param(
  [string]$ProjectPath = "D:\เสาไฟฟ้า",
  [string]$Branch = "codex/project-management-saas-mvp"
)

$ErrorActionPreference = "Stop"

Write-Host "== Pole & Drying Yard SaaS Sync ==" -ForegroundColor Cyan
Write-Host "Project: $ProjectPath"
Write-Host "Branch : $Branch"

if (-not (Test-Path $ProjectPath)) {
  throw "ไม่พบโฟลเดอร์ $ProjectPath"
}

Set-Location $ProjectPath

if (-not (Test-Path ".git")) {
  throw "โฟลเดอร์นี้ยังไม่ใช่ Git repository: $ProjectPath"
}

Write-Host "1/5 Fetch GitHub..." -ForegroundColor Yellow
git fetch origin

Write-Host "2/5 Checkout branch..." -ForegroundColor Yellow
git checkout $Branch

Write-Host "3/5 Pull latest code..." -ForegroundColor Yellow
git pull --ff-only origin $Branch

if (-not (Test-Path ".env.local")) {
  Write-Warning "ยังไม่มี .env.local — คัดลอก .env.example แล้วใส่ DRYING_YARD_ADMIN_USERNAME / DRYING_YARD_ADMIN_PASSWORD แบบ server-side เท่านั้น"
}

Write-Host "4/5 Install dependencies..." -ForegroundColor Yellow
if (Get-Command pnpm -ErrorAction SilentlyContinue) {
  pnpm install --frozen-lockfile
} elseif (Get-Command corepack -ErrorAction SilentlyContinue) {
  corepack pnpm install --frozen-lockfile
} else {
  throw "ไม่พบ pnpm/corepack กรุณาติดตั้ง Node.js + Corepack ก่อน"
}

Write-Host "5/5 Production build check..." -ForegroundColor Yellow
if (Get-Command pnpm -ErrorAction SilentlyContinue) {
  pnpm build
} else {
  corepack pnpm build
}

Write-Host "" 
Write-Host "Sync สำเร็จ: งานลานตากอยู่ที่ /drying-yard" -ForegroundColor Green
Write-Host "Submodules: /drying-yard/sites, /pricing, /boq, /bookings" -ForegroundColor Green
Write-Host "PWA: manifest + service worker พร้อมตรวจอัปเดตเมื่อ deploy เวอร์ชันใหม่" -ForegroundColor Green
