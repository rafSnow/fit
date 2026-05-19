import { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { differenceInDays } from 'date-fns';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallBanner(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    };

    const checkDismissal = async () => {
      const lastDismissed = await db.settings.get('lastPwaPromptDismissed');
      
      if (lastDismissed) {
        const daysSinceDismissal = differenceInDays(new Date(), new Date(lastDismissed.value as string));
        if (daysSinceDismissal < 7) {
          return;
        }
      }

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };

    checkDismissal();
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    }
  };

  const handleDismiss = async () => {
    await db.settings.put({ 
      key: 'lastPwaPromptDismissed', 
      value: new Date().toISOString() 
    });
    setShowInstallBanner(false);
  };

  return {
    showInstallBanner,
    handleInstallClick,
    handleDismiss
  };
}
