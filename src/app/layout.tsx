
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/shadcn/toaster";

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
    <html lang="en" className='font-sans'>
       <head>
          <meta name="theme-color" content="#151d4f" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=TikTok+Sans:opsz,wght@12..36,300..900&display=swap" rel="stylesheet" />
       </head>
      <body className="bg-muted/40">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
