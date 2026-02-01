import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AJ Media - Ad Performance Alerter",
  description: "Monitor and manage ad campaign performance alerts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
