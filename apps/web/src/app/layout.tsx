import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIMPLYYTR // SOTA Autonomous YouTube Revenue Engine",
  description: "Next-Gen 2026 Autonomous YouTube Operations, RLYA Intelligence & Zero-Cost Render Engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&family=Sora:wght@700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#0e0e0f] text-[#e5e2e3] antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
