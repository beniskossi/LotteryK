import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import BottomNav from '@/components/bottom-nav';
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Kinglotto',
  description: 'Analyse, enregistrement et prédiction des tirages de loterie.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={cn(
          geistSans.variable,
          geistMono.variable,
          'antialiased font-sans flex flex-col min-h-screen'
        )}
      >
        <main className="flex-grow container mx-auto px-4 py-8 pb-20"> {/* Added padding-bottom for nav */}
          {children}
        </main>
        <BottomNav />
        <Toaster />
      </body>
    </html>
  );
}
