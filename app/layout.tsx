import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Real-Time Poll Rooms',
  description: 'Create polls, share links, and collect votes with real-time results',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#0a0a0f] text-white antialiased overflow-x-hidden">
        {/* Ambient background effects */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[150px]" />
        </div>

        <div className="min-h-screen flex flex-col">
          {/* Navigation */}
          <nav className="sticky top-0 z-50 border-b border-white/[0.06] backdrop-blur-2xl bg-[#0a0a0f]/80">
            <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
              <a href="/" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-sm shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-shadow">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M3.505 2.365A41.369 41.369 0 019 2c1.863 0 3.697.124 5.495.365 1.247.167 2.18 1.108 2.435 2.268a4.45 4.45 0 00-.577-.069 43.141 43.141 0 00-4.706 0C9.229 4.696 7.5 6.727 7.5 8.998v2.24c0 1.413.67 2.735 1.76 3.562l-2.98 2.98A.75.75 0 015 17.25v-3.443c-.501-.048-1-.106-1.495-.172C2.033 13.438 1 12.162 1 10.72V5.28c0-1.441 1.033-2.717 2.505-2.914z" />
                    <path d="M14 6c.762 0 1.52.02 2.272.06 1.207.065 2.228 1.006 2.228 2.238v2.424c0 1.232-1.02 2.173-2.228 2.238-.272.015-.546.026-.82.033v2.757a.75.75 0 01-1.28.53L11.59 13.7a.785.785 0 01-.03-.022 42.02 42.02 0 01-.864-.048c-1.207-.065-2.228-1.006-2.228-2.238V8.298c0-1.232 1.021-2.173 2.228-2.238A43.146 43.146 0 0114 6z" />
                  </svg>
                </div>
                <span className="font-bold text-[15px] text-white tracking-tight">
                  PollRooms
                </span>
              </a>
              <a href="/create" className="btn-secondary text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1.5">
                  <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                </svg>
                New Poll
              </a>
            </div>
          </nav>

          {/* Content */}
          <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
