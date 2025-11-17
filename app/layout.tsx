import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI LMS",
  description:
    "Modern AI-powered learning management system for students, teachers, parents, and admins.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-[#F9FAFB]">
      <body
        className={`${inter.variable} min-h-screen bg-[#F9FAFB] font-sans text-[#0F172A] antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
