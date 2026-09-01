# Drying Yard module in Pole SaaS

โมดูลนี้เพิ่มงานลานตาก 446 จุดเข้า SaaS งานเสาเดิม โดยใช้ route `/drying-yard` และอ่านข้อมูลจาก Supabase ผ่าน server-side integration เท่านั้น

## Scope

- 446 จุดติดตั้ง
- 24 จังหวัด / 83 อำเภอ
- G63 = 316 จุด
- G64 = 130 จุด
- ขนาดลาน 120 / 192 / 252 ตร.ม.
- BOQ planning profile
- สถานะการจองทีมติดตั้ง
- Executive/Admin: ต้นทุน ราคาขาย กำไร GM/VAT
- Field Leader: ข้อมูลปฏิบัติการเท่านั้น ไม่แสดงต้นทุน/กำไร/GM

## Windows project path

โครงการในเครื่อง:

```text
D:\เสาไฟฟ้า
```

## Sync branch to local machine

```powershell
cd D:\เสาไฟฟ้า
git fetch origin
git checkout codex/drying-yard-saas-integration
git pull origin codex/drying-yard-saas-integration
```

หลัง merge เข้า branch หลัก ให้กลับไปใช้ branch หลักตาม workflow ของโครงการ

## Configure server environment

ห้าม hard-code รหัส Admin ลง source code หรือ `NEXT_PUBLIC_*` variables

ใช้ script:

```powershell
cd D:\เสาไฟฟ้า
powershell -ExecutionPolicy Bypass -File .\scripts\setup-drying-yard.ps1
```

Script จะถาม username/password แล้วเขียนลง `.env.local` บนเครื่องเท่านั้น

Environment ที่ใช้:

```text
DRYING_YARD_ADMIN_API_URL
DRYING_YARD_ADMIN_USERNAME
DRYING_YARD_ADMIN_PASSWORD
DRYING_YARD_PAYMENT_REQUEST_API_URL
NEXT_PUBLIC_DRYING_YARD_TEAM_URL
NEXT_PUBLIC_DRYING_YARD_ADMIN_URL
```

## Run

```powershell
cd D:\เสาไฟฟ้า
pnpm install
pnpm dev
```

เปิด:

```text
http://localhost:3000/drying-yard
```

## Role behavior

### EXECUTIVE / ADMIN

เห็น:

- จำนวนจุด G63/G64
- จังหวัด/อำเภอ
- pending / approved / free
- Cost Base
- Sale before VAT
- Final price incl. VAT
- Gross Profit
- GM / VAT current settings
- Top provinces by project value
- ลิงก์ Admin Pricing และ Team Portal

### FIELD_LEADER

เห็นเฉพาะ:

- จำนวนจุด
- จังหวัด/อำเภอ
- G63/G64
- สถานะการจอง
- Package structure
- BOQ planning profile
- Team Portal

ไม่ render financial fields ฝั่ง UI

## Architecture

```text
Pole SaaS (Next.js 15)
  -> /drying-yard server component
    -> src/lib/drying-yard.ts
      -> Supabase Edge Function: drying-yard-admin-api
        -> core_installation_sites
        -> core_locations
        -> drying_yard_site_specs
        -> drying_yard_installation_reservations
        -> drying_yard_internal_pricing
        -> drying_yard_pricing_settings
```

Admin credentials ถูกใช้เฉพาะ Next.js server runtime และไม่ถูกส่งเข้า browser bundle

## Important pricing rule

ระบบ Admin ใช้ Gross Margin:

```text
Selling Price Before VAT = Cost Base / (1 - GM)
Gross Profit = Selling Price Before VAT - Cost Base
VAT = Selling Price Before VAT * VAT Rate
```

VAT ไม่ถือเป็นกำไร

## Procurement note

BOQ quantity ในหน้า SaaS เป็น planning/checklist profile เพื่อช่วยทีมงานเท่านั้น ก่อนออก PO ต้องตรวจแบบและ BOQ revision ล่าสุด โดยเฉพาะ RB19 และ package hardware ของ G63/G64
