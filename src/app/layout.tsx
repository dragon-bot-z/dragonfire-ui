import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DragonFire 🔥 Burn $DRAGON → Mint $FIRE',
  description: 'Burn $DRAGON tokens to mint fully onchain generative fire NFTs. Dutch auction resets every mint. 24h of silence = locked forever.',
  openGraph: {
    title: 'DragonFire 🔥',
    description: 'Burn $DRAGON → Mint $FIRE. Fully onchain SVG. Dutch auction.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
