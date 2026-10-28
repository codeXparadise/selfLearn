import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { AuthProvider } from '@/context/AuthContext';
import { SmoothScrollProvider } from '@/providers/SmoothScrollProvider';

export const metadata: Metadata = {
  title: 'Self Learn — Distraction-Free YouTube Classroom & AI Course Hub',
  description: 'Convert any YouTube playlist into an ads-free, algorithm-free focused course with dual progress bars and built-in Ollama AI timestamp assistance.',
  icons: {
    icon: '/logo-icon.png',
    apple: '/logo-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0c] text-neutral-900 dark:text-neutral-100 transition-colors selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-900">
        <ThemeProvider>
          <AuthProvider>
            <SmoothScrollProvider>
              {children}
            </SmoothScrollProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

