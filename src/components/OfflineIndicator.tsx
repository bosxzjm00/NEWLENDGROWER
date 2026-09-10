import React from 'react';
import { useOnlineStatus } from '../hooks/usePWAInstall';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      id="pwa-offline-indicator"
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600/95 text-white px-3.5 py-2 text-xs font-medium shadow-xl backdrop-blur-sm border border-amber-400/30 animate-in fade-in"
    >
      <WifiOff className="w-3.5 h-3.5 text-amber-200" />
      <span>Offline Mode — Changes saved locally and will sync when reconnected</span>
    </div>
  );
};
