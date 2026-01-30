'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseUnits, maxUint256 } from 'viem';
import { useState, useEffect } from 'react';
import {
  DRAGONFIRE_ADDRESS,
  DRAGON_TOKEN_ADDRESS,
  DRAGONFIRE_ABI,
  ERC20_ABI,
} from '@/lib/contracts';

function formatPrice(price: bigint): string {
  const formatted = formatUnits(price, 18);
  const num = parseFloat(formatted);
  if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toFixed(2);
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function Home() {
  const { address, isConnected } = useAccount();
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Read contract state
  const { data: currentPrice, refetch: refetchPrice } = useReadContract({
    address: DRAGONFIRE_ADDRESS,
    abi: DRAGONFIRE_ABI,
    functionName: 'currentPrice',
  });

  const { data: timeUntilLock, refetch: refetchTime } = useReadContract({
    address: DRAGONFIRE_ADDRESS,
    abi: DRAGONFIRE_ABI,
    functionName: 'timeUntilLock',
  });

  const { data: isActive } = useReadContract({
    address: DRAGONFIRE_ADDRESS,
    abi: DRAGONFIRE_ABI,
    functionName: 'isActive',
  });

  const { data: totalSupply, refetch: refetchSupply } = useReadContract({
    address: DRAGONFIRE_ADDRESS,
    abi: DRAGONFIRE_ABI,
    functionName: 'totalSupply',
  });

  const { data: totalBurned, refetch: refetchBurned } = useReadContract({
    address: DRAGONFIRE_ADDRESS,
    abi: DRAGONFIRE_ABI,
    functionName: 'totalDragonBurned',
  });

  const { data: locked } = useReadContract({
    address: DRAGONFIRE_ADDRESS,
    abi: DRAGONFIRE_ABI,
    functionName: 'locked',
  });

  // User balances
  const { data: dragonBalance, refetch: refetchDragonBalance } = useReadContract({
    address: DRAGON_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: DRAGON_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, DRAGONFIRE_ADDRESS] : undefined,
  });

  // Write functions
  const { writeContract: approve, data: approveTxHash, isPending: isApproving } = useWriteContract();
  const { writeContract: mint, data: mintTxHash, isPending: isMinting } = useWriteContract();

  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveTxHash,
  });

  const { isLoading: isMintConfirming, isSuccess: isMintSuccess } = useWaitForTransactionReceipt({
    hash: mintTxHash,
  });

  // Countdown timer
  useEffect(() => {
    if (timeUntilLock) {
      setTimeLeft(Number(timeUntilLock));
    }
  }, [timeUntilLock]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Refresh data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      refetchPrice();
      refetchTime();
      refetchSupply();
      refetchBurned();
      if (address) {
        refetchDragonBalance();
        refetchAllowance();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [address, refetchPrice, refetchTime, refetchSupply, refetchBurned, refetchDragonBalance, refetchAllowance]);

  // Refetch after approve success
  useEffect(() => {
    if (isApproveSuccess) {
      refetchAllowance();
    }
  }, [isApproveSuccess, refetchAllowance]);

  // Refetch after mint success
  useEffect(() => {
    if (isMintSuccess) {
      refetchPrice();
      refetchTime();
      refetchSupply();
      refetchBurned();
      refetchDragonBalance();
    }
  }, [isMintSuccess, refetchPrice, refetchTime, refetchSupply, refetchBurned, refetchDragonBalance]);

  const needsApproval = currentPrice && allowance !== undefined && allowance < currentPrice;
  const hasEnoughBalance = currentPrice && dragonBalance !== undefined && dragonBalance >= currentPrice;

  const handleApprove = () => {
    approve({
      address: DRAGON_TOKEN_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [DRAGONFIRE_ADDRESS, maxUint256],
    });
  };

  const handleMint = () => {
    mint({
      address: DRAGONFIRE_ADDRESS,
      abi: DRAGONFIRE_ABI,
      functionName: 'mint',
    });
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-lg w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <img src="/fire/fire0.svg" alt="Fire #0" className="w-32 h-32" />
          </div>
          <h1 className="text-6xl font-bold">
            <span className="text-orange-500">Dragon</span>
            <span className="text-red-500">Fire</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Burn $DRAGON → Mint $FIRE
          </p>
          <p className="text-gray-500 text-sm">
            100% onchain SVG • Dutch auction • 24h clock
          </p>
        </div>

        {/* Connect Button */}
        <div className="flex justify-center">
          <ConnectButton showBalance={false} />
        </div>

        {/* Status Card */}
        <div className="bg-gray-900 rounded-2xl p-6 space-y-4 border border-gray-800">
          {locked ? (
            <div className="text-center py-8">
              <p className="text-red-500 text-2xl font-bold">🔒 LOCKED FOREVER</p>
              <p className="text-gray-500 mt-2">The collection has been sealed.</p>
            </div>
          ) : (
            <>
              {/* Timer */}
              <div className="text-center">
                <p className="text-gray-500 text-sm uppercase tracking-wide">Time Until Lock</p>
                <p className={`text-4xl font-mono font-bold ${timeLeft < 3600 ? 'text-red-500' : timeLeft < 7200 ? 'text-orange-500' : 'text-green-500'}`}>
                  {formatTime(timeLeft)}
                </p>
              </div>

              {/* Price */}
              <div className="text-center border-t border-gray-800 pt-4">
                <p className="text-gray-500 text-sm uppercase tracking-wide">Current Price</p>
                <p className="text-3xl font-bold text-orange-500">
                  {currentPrice ? formatPrice(currentPrice) : '...'} <span className="text-lg text-gray-400">$DRAGON</span>
                </p>
              </div>

              {/* Mint Button - right under price */}
              {isConnected && (
                <div className="pt-2">
                  {needsApproval ? (
                    <button
                      onClick={handleApprove}
                      disabled={isApproving || isApproveConfirming}
                      className="w-full py-4 px-6 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl font-bold text-lg transition-colors"
                    >
                      {isApproving || isApproveConfirming ? 'Approving...' : 'Approve $DRAGON'}
                    </button>
                  ) : (
                    <button
                      onClick={handleMint}
                      disabled={isMinting || isMintConfirming || !hasEnoughBalance}
                      className="w-full py-4 px-6 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl font-bold text-lg transition-all"
                    >
                      {isMinting || isMintConfirming
                        ? '🔥 Minting...'
                        : !hasEnoughBalance
                        ? 'Insufficient $DRAGON'
                        : '🔥 Burn & Mint Fire'}
                    </button>
                  )}
                  {!hasEnoughBalance && dragonBalance !== undefined && (
                    <p className="text-center text-gray-500 text-sm mt-2">
                      Your balance: {formatPrice(dragonBalance)} $DRAGON
                    </p>
                  )}
                  {isMintSuccess && (
                    <div className="text-center text-green-500 font-bold mt-3">
                      🎉 Fire minted! Clock reset.
                    </div>
                  )}
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 border-t border-gray-800 pt-4">
                <div className="text-center">
                  <p className="text-gray-500 text-sm">Fires Minted</p>
                  <p className="text-xl font-bold">{totalSupply?.toString() ?? '...'}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500 text-sm">$DRAGON Burned</p>
                  <p className="text-xl font-bold text-red-500">
                    {totalBurned ? formatPrice(totalBurned) : '...'}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Links */}
        <div className="flex justify-center gap-6 text-sm text-gray-500">
          <a
            href="https://opensea.io/collection/dragon-fire-475567302"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-orange-500 transition-colors"
          >
            OpenSea ↗
          </a>
          <a
            href={`https://basescan.org/address/${DRAGONFIRE_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-orange-500 transition-colors"
          >
            Contract ↗
          </a>
          <a
            href="https://github.com/dragon-bot-z/dragon-fire"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-orange-500 transition-colors"
          >
            GitHub ↗
          </a>
        </div>

        {/* Back to Home */}
        <div className="flex justify-center">
          <a
            href="/"
            className="text-gray-500 hover:text-orange-500 transition-colors text-sm"
          >
            ← Back to Dragon's Lair
          </a>
        </div>

        {/* Lore */}
        <div className="text-center text-gray-600 text-sm italic">
          The dragon didn&apos;t need a token. You made one anyway. Now watch it burn.
        </div>
      </div>
    </main>
  );
}
