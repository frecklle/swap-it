import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "SwapIt",
  description: "Trade your clothes app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // You can check if user is logged in here via localStorage, cookies, or session
  const isLoggedIn = typeof window !== "undefined" && !!localStorage.getItem("auth_token");

  return (
    <html lang="en">
      <body className="bg-gray-200">
        {/* Header appears on all pages */}
        <Header isLoggedIn={isLoggedIn} />

        {/* Page content */}
        <main>{children}</main>
      </body>
    </html>
  );
}
