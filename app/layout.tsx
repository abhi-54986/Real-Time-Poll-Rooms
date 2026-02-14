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
      <body className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white antialiased">
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-white/10 backdrop-blur-sm bg-white/5">
            <div className="max-w-4xl mx-auto px-4 py-4">
              <a
                href="/"
                className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
              >
                🗳️ Real-Time Poll Rooms
              </a>
            </div>
          </header>
          <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
