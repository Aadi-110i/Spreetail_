import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Shared Expenses App | Premium Split',
  description: 'Manage shared expenses with your flatmates effortlessly.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <main className="container page-transition-enter">
          {children}
        </main>
      </body>
    </html>
  );
}
