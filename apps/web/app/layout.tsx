import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NeonForge Hub",
  description: "License, billing, and remote configuration hub for NeonForge."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
