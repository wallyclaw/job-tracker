import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Job Tracker",
  description: "Track your job search",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        <nav className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-6">
            <a href="/" className="text-lg font-bold text-gray-900">🎯 Job Tracker</a>
            <a href="/" className="text-sm text-gray-600 hover:text-gray-900">Jobs</a>
            <a href="/resume" className="text-sm text-gray-600 hover:text-gray-900">Resume</a>
            <a href="/add" className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">+ Add Job</a>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-6 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
