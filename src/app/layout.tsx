import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { Toaster as UIToaster } from '@/components/ui/toaster';
import { config } from '@/lib/config';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: config.app.name,
    template: `%s | ${config.app.name}`,
  },
  description: config.app.description,
  keywords: [
    'behavioral intelligence',
    'workplace analytics',
    'organizational development',
    'pattern tessellation',
    'enterprise analytics',
    'behavioral insights',
  ],
  authors: [{ name: 'Tessera Team' }],
  creator: 'Tessera',
  metadataBase: new URL(config.app.url),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: config.app.url,
    title: config.app.name,
    description: config.app.description,
    siteName: config.app.name,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: `${config.app.name} - Behavioral Intelligence Platform`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: config.app.name,
    description: config.app.description,
    images: ['/og-image.png'],
    creator: '@hexies',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#0ea5e9" />
        <meta name="msapplication-TileColor" content="#0ea5e9" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="relative flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>
        </div>
        
        {/* Enhanced Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 5000,
            style: {
              background: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
              fontSize: '14px',
              fontWeight: '500',
            },
            success: {
              style: {
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(59, 130, 246, 0.9))',
                border: '1px solid rgba(34, 197, 94, 0.3)',
              },
              iconTheme: {
                primary: 'white',
                secondary: 'rgba(34, 197, 94, 0.9)',
              },
            },
            error: {
              style: {
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(245, 101, 101, 0.9))',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              },
              iconTheme: {
                primary: 'white',
                secondary: 'rgba(239, 68, 68, 0.9)',
              },
            },
            loading: {
              style: {
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(147, 51, 234, 0.9))',
                border: '1px solid rgba(59, 130, 246, 0.3)',
              },
            },
          }}
        />

        {/* Enhanced Development indicator */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 left-4 z-50 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500 px-3 py-2 text-xs font-bold text-black shadow-lg backdrop-blur-sm border border-yellow-300/20">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>
              <span>DEVELOPMENT</span>
            </div>
          </div>
        )}
        
        {/* UI Toaster for new components */}
        <UIToaster />
      </body>
    </html>
  );
}