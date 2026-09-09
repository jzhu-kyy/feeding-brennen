import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Feeding Brennen',
  description: 'Track restaurants, visits, and spending.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-5xl px-6 py-5">
            <h1 className="text-xl font-semibold tracking-tight">Feeding Brennen</h1>
            <p className="mt-1 text-sm text-gray-500">Dining memories, without the receipt pile.</p>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
