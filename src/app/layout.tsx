import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Job Tracker",
  description: "Track your job search",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light">
      <body className="bg-slate-50 text-slate-900 min-h-screen">
        <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <a href="/" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                🎯 Job Tracker
              </a>
              <div className="flex items-center gap-1">
                <a href="/" className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-md hover:bg-slate-100 transition-colors">
                  Dashboard
                </a>
                <a href="/resume" className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-md hover:bg-slate-100 transition-colors">
                  Resume
                </a>
                <a href="/about-me" className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-md hover:bg-slate-100 transition-colors">
                  About Me
                </a>
              </div>
            </div>
            <a href="/add" className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm hover:shadow transition-all">
              + Add Job
            </a>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
