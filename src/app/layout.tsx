import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Revo Roofing AI — The Future of Roofing',
  description: 'Recruit, train, and deploy AI-powered roofing experts. Drone inspection, automated proposals, instant insurance documentation.',
  openGraph: {
    title: 'Revo Roofing AI',
    description: 'The AI-powered platform for modern roofing experts.',
    url: 'https://revo.agentmidas.xyz',
    siteName: 'Revo Roofing AI',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
