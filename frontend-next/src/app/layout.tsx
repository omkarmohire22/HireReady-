import type { Metadata } from 'next';
import './globals.css';
import AppShell from '@/components/layout/AppShell';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import AosProvider from '@/components/layout/AosProvider';
import SmoothScrollProvider from '@/components/layout/SmoothScrollProvider';

export const metadata: Metadata = {
  title: 'HireReady – AI Interview Prep',
  description: 'Ace your next technical interview with AI-powered mock interviews, skill gap analysis, and personalized feedback.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <ThemeProvider>
          <SmoothScrollProvider>
            <AosProvider>
              <AppShell>{children}</AppShell>
            </AosProvider>
          </SmoothScrollProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
