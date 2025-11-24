import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Music2 } from 'lucide-react';
import { FirebaseClientProvider } from '@/firebase';
import { UserAuth } from '@/components/UserAuth';

export const metadata: Metadata = {
  title: 'TuneFinder',
  description: 'Search for songs within a YouTube playlist',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col">
        <FirebaseClientProvider>
          <header className="py-4 px-4 md:px-8 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="container mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Music2 className="text-accent h-6 w-6" />
                <h1 className="text-xl font-bold font-headline">TuneFinder</h1>
              </div>
              <UserAuth />
            </div>
          </header>
          <main className="flex-grow">
            {children}
          </main>
          <footer className="py-6 px-4 md:px-8 text-center text-sm text-muted-foreground">
            <div className="container mx-auto">
              <p>&copy; {new Date().getFullYear()} TuneFinder. Creado con &#x2764;&#xFE0F;.</p>
            </div>
          </footer>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
