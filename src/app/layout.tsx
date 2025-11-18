
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/shadcn/toaster";

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Shalom Dashboard',
  description: 'Trek Costing & Management Dashboard',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable}`}>
       <head>
          <meta name="theme-color" content="#151d4f" />
       </head>
      <body className="bg-muted/40">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
