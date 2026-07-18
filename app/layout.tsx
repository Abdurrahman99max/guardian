import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Guardian',
  description: 'A strategic operating system for founders.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
