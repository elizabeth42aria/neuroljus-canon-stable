// src/app/layout.tsx
import "../styles/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Neuroljus",
  description: "Neuroljus – chat multilingüe con señales e IA híbrida",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv">
      <body className="min-h-screen bg-white text-slate-900">{children}</body>
    </html>
  );
}
