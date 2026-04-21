"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { usePathname } from "next/navigation";
import { AuthProvider } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";

  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="h-screen w-screen overflow-hidden font-sans text-foreground transition-colors flex items-center justify-center relative p-6 md:p-10 lg:p-12">
        <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem={false}>
          {/* Main Content Container */}

          <AuthProvider>
            {/* Main Shell */}
            <div className="relative z-10 w-full h-full bg-transparent flex flex-row overflow-hidden rounded-[32px] shadow-2xl border border-border/50">
              {isAuthPage ? (
                <div className="w-full h-full flex items-center justify-center overflow-y-auto custom-scrollbar">
                  <div className="w-full max-w-md">
                    {children}
                  </div>
                </div>
              ) : (
                <>
                  <Sidebar />
                  <div className="flex-1 flex flex-col min-w-0 h-full relative">
                    <TopBar />
                    <main className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-background/50 backdrop-blur-[64px]">
                      {children}
                    </main>
                  </div>
                </>
              )}
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
