import type { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/passwords";

export const teamTypeSeed = [
  { code: "INSTALL", nameTh: "ติดตั้ง", sortOrder: 1 },
  { code: "FOUNDATION", nameTh: "ฐานราก", sortOrder: 2 },
  { code: "INSPECTION", nameTh: "ตรวจรับ", sortOrder: 3 },
  { code: "TRANSPORT", nameTh: "ขนส่ง", sortOrder: 4 },
];

export const costCategorySeed = [
  { code: "MAT", nameTh: "วัสดุ", sortOrder: 1 },
  { code: "LAB", nameTh: "ค่าแรง", sortOrder: 2 },
  { code: "EQP", nameTh: "เครื่องจักร", sortOrder: 3 },
  { code: "TRN", nameTh: "ขนส่ง", sortOrder: 4 },
  { code: "OTH", nameTh: "อื่น ๆ", sortOrder: 5 },
];

export const unitSeed = [
  { code: "POLE", nameTh: "ต้น", symbol: "ต้น", sortOrder: 1 },
  { code: "SET", nameTh: "ชุด", symbol: "ชุด", sortOrder: 2 },
  { code: "M", nameTh: "เมตร", symbol: "ม.", sortOrder: 3 },
  { code: "TRIP", nameTh: "เที่ยว", symbol: "เที่ยว", sortOrder: 4 },
  { code: "DAY", nameTh: "วัน", symbol: "วัน", sortOrder: 5 },
  { code: "HR", nameTh: "ชั่วโมง", symbol: "ชม.", sortOrder: 6 },
  { code: "MACHINE", nameTh: "เครื่อง", symbol: "เครื่อง", sortOrder: 7 },
];

export const equipmentSeed = [
  { code: "DRILL", nameTh: "เครื่องเจาะ", defaultUnitCode: "MACHINE" },
  { code: "GENSET", nameTh: "เครื่องกำเนิดไฟฟ้า", defaultUnitCode: "MACHINE" },
];

const developmentUsers = [
  {
    fullName: "Executive User",
    email: "executive@example.com",
    role: "EXECUTIVE" as const,
    isActive: true,
  },
  {
    fullName: "Admin User",
    email: "admin@example.com",
    role: "ADMIN" as const,
    isActive: true,
  },
  {
    fullName: "Field User",
    email: "field@example.com",
    role: "FIELD_LEADER" as const,
    isActive: true,
  },
  {
    fullName: "Inactive User",
    email: "inactive@example.com",
    role: "ADMIN" as const,
    isActive: false,
  },
];

const productionUsers = [
  {
    fullName: "Executive User",
    email: "executive@example.com",
    role: "EXECUTIVE" as const,
    isActive: true,
  },
  {
    fullName: "Admin User",
    email: "admin@example.com",
    role: "ADMIN" as const,
    isActive: true,
  },
  {
    fullName: "Field User",
    email: "field@example.com",
    role: "FIELD_LEADER" as const,
    isActive: true,
  },
];

export async function seedMasterData(prisma: PrismaClient) {
  await prisma.teamType.createMany({
    data: teamTypeSeed,
  });

  await prisma.costCategory.createMany({
    data: costCategorySeed,
  });

  await prisma.unitOfMeasure.createMany({
    data: unitSeed,
  });

  const machineUnit = await prisma.unitOfMeasure.findUniqueOrThrow({
    where: { code: "MACHINE" },
  });

  await prisma.equipmentMaster.createMany({
    data: equipmentSeed.map((item) => ({
      code: item.code,
      nameTh: item.nameTh,
      defaultUnitId: machineUnit.id,
    })),
  });
}

export async function seedUsers(prisma: PrismaClient, mode: "development" | "production") {
  const passwordHash = await hashPassword("password");
  const users = mode === "development" ? developmentUsers : productionUsers;

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        fullName: user.fullName,
        passwordHash,
        role: user.role,
        isActive: user.isActive,
      },
      create: {
        ...user,
        passwordHash,
      },
    });
  }
}
