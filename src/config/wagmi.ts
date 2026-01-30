import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'DragonFire',
  projectId: 'dragonfire-mint', // WalletConnect project ID (optional for basic use)
  chains: [base],
  ssr: true,
});
