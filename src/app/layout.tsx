import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/shadcn/toaster";
import { PWAManager } from "@/components/pwa-register";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { ReactQueryProvider } from '@/lib/react-query-provider';

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#151d4f" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="Trek Costing & Management Dashboard" />
        <link rel="apple-touch-icon" href="/logo/pwa.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto+Condensed:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-muted/40">
        <ReactQueryProvider>
          {children}
        </ReactQueryProvider>
        <PWAManager />
        {/* <PWAInstallPrompt /> */}
        <Toaster />
      </body>
    </html>
  );
}