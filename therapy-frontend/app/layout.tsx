import type { Metadata } from "next";
import { DM_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Therapy Sessions | AI-Powered Processing",
  description: "Upload therapy session recordings for automatic transcription, summarization, and semantic analysis.",
  keywords: ["therapy", "transcription", "AI", "healthcare", "session notes"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${dmSans.variable} ${geistMono.variable} antialiased bg-[#0f0f0f] text-zinc-100`}
      >
        {children}
      </body>
    </html>
  );
}
