import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/app/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Project Command Center",
  description: "Operational hub for the project management SaaS MVP.",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-50 antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
