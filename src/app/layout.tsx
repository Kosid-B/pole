import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/app/app-shell";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pole & Drying Yard SaaS",
  description: "ระบบ SaaS งานเสาไฟฟ้าและงานลานตาก 446 จุด",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/app-icon.svg",
    apple: "/app-icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Pole SaaS",
  },
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="th">
      <body className="min-h-screen bg-slate-950 text-slate-50 antialiased">
        <AppShell>{children}</AppShell>
        <PwaRegister />
      </body>
    </html>
  );
}
