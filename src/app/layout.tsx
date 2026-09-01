import type { Metadata, Viewport } from "next";
import { Kanit } from "next/font/google";
import type { ReactNode } from "react";
import { AppShell } from "@/app/app-shell";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const kanit = Kanit({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-kanit",
});

export const metadata: Metadata = {
  title: {
    default: "SiteCost Drying Yard 446",
    template: "%s | SiteCost 446",
  },
  description:
    "Commercial, PM, Procurement และ Financial Guardrails สำหรับโครงการงานลานตาก 446 จุด",
  applicationName: "SiteCost Drying Yard 446",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/app-icon.svg",
    apple: "/app-icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SiteCost 446",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f172a",
  colorScheme: "dark",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="th" className={kanit.variable}>
      <body className="min-h-screen bg-slate-950 text-slate-50 antialiased">
        <AppShell>{children}</AppShell>
        <PwaRegister />
      </body>
    </html>
  );
}
