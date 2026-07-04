import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Todo App",
  description: "Built with Next.js, Supabase, and Drizzle",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}