export type SiteCostModuleCode =
  | "portfolio"
  | "commercial"
  | "pm"
  | "procurement"
  | "field"
  | "finance";

export type SiteCostModule = {
  code: SiteCostModuleCode;
  labelTh: string;
  labelEn: string;
  href: string;
  description: string;
  scope: "portfolio" | "project";
  financialGuardrail: boolean;
};

export const SITECOST_MODULES: SiteCostModule[] = [
  {
    code: "portfolio",
    labelTh: "Project Portfolio",
    labelEn: "Portfolio",
    href: "/projects",
    description: "สร้างและติดตามหลายโครงการจาก Command Center เดียว พร้อมสถานะ พื้นที่ ทีม และความคืบหน้า",
    scope: "portfolio",
    financialGuardrail: false,
  },
  {
    code: "commercial",
    labelTh: "Commercial",
    labelEn: "Commercial",
    href: "/commercial",
    description: "Contract value, pricing, quote, package และเงื่อนไขลูกค้า โดยไม่เปิดเผยต้นทุนภายใน",
    scope: "project",
    financialGuardrail: true,
  },
  {
    code: "pm",
    labelTh: "PM Control",
    labelEn: "Project Management",
    href: "/pm",
    description: "BAC, EAC, progress, batch release, cash-flow, commitment และ decision gates ของ PM",
    scope: "project",
    financialGuardrail: true,
  },
  {
    code: "procurement",
    labelTh: "Procurement",
    labelEn: "Procurement",
    href: "/procurement",
    description: "Cluster sourcing, RFQ, Total Delivered Cost, supplier award, Framework Agreement และ call-off",
    scope: "project",
    financialGuardrail: true,
  },
  {
    code: "field",
    labelTh: "Field Operations",
    labelEn: "Field",
    href: "/field-reports",
    description: "Site readiness, daily field report, delivery evidence, QA และ PM-verified actual",
    scope: "project",
    financialGuardrail: false,
  },
  {
    code: "finance",
    labelTh: "Finance & Cash",
    labelEn: "Finance",
    href: "/finance",
    description: "Billing, collections, actual cost, supplier invoice, payment request และ cash visibility",
    scope: "project",
    financialGuardrail: true,
  },
];

export const SITECOST_FINANCIAL_GUARDRAILS = {
  minimumGrossMarginPct: 32,
  rollingCashRule: "Projected rolling cash must stay at or above the configured Safety Reserve.",
  commitmentRule:
    "Available cash plus collectible customer cash must cover confirmed four-week commitments plus Safety Reserve.",
  awardRule:
    "Supplier award uses confirmed Total Delivered Cost and must pass both GM and Cash gates.",
} as const;

export type SiteCostProjectTemplate = {
  code: string;
  name: string;
  description: string;
  enabledModules: SiteCostModuleCode[];
  defaultBatchSize?: number;
  projectType: string;
};

export const SITECOST_PROJECT_TEMPLATES: SiteCostProjectTemplate[] = [
  {
    code: "DRYING-YARD-446",
    name: "งานลานตาก 446 จุด",
    description:
      "Template สำหรับโครงการกระจายหลายพื้นที่ ใช้ Cluster Procurement, Rolling Batch, Supplier Framework และ PM financial guardrails.",
    enabledModules: ["commercial", "pm", "procurement", "field", "finance"],
    defaultBatchSize: 25,
    projectType: "distributed_construction",
  },
  {
    code: "STANDARD-CONSTRUCTION",
    name: "Standard Construction Project",
    description:
      "Template กลางสำหรับโครงการก่อสร้างทั่วไปที่ต้องการ Commercial, PM, Procurement, Field และ Finance ในระบบเดียว",
    enabledModules: ["commercial", "pm", "procurement", "field", "finance"],
    projectType: "construction",
  },
];
