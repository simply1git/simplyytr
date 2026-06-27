import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "YoutubBot | Intelligence Vault",
  description: "State-of-the-art YouTube automation platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} flex h-screen bg-[#09090b] text-[#fafafa] overflow-hidden`}>
        {/* Sidebar */}
        <aside className="w-64 bg-[#18181b] border-r border-[#27272a] flex flex-col">
          <div className="p-6">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              YoutubBot
            </h1>
            <p className="text-xs text-[#a1a1aa] mt-1">Intelligence Vault</p>
          </div>
          <nav className="flex-1 px-4 space-y-2">
            <Link href="/" className="block px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#27272a] transition-colors">
              📊 Viral Harvester
            </Link>
            <Link href="/media" className="block px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#27272a] transition-colors">
              🎬 Media Library
            </Link>
          </nav>
          <div className="p-4 border-t border-[#27272a]">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500"></div>
              <div>
                <p className="text-sm font-medium">Workspace</p>
                <p className="text-xs text-[#a1a1aa]">Admin</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
