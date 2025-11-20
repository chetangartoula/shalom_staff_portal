'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/shadcn/button';
import { Badge } from '@/components/ui/shadcn/badge';

export function PWAStatus() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Set isClient to true only on the client side
    setIsClient(true);
    
    // Check if app is installed
    const checkIfInstalled = () => {
      // Check if display-mode is standalone (installed PWA)
      if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
      }
      
      // Also check if app was launched via standalone mode
      if (typeof window !== 'undefined' && (window as any).navigator.standalone) {
        setIsInstalled(true);
      }
    };

    // Check online status
    const updateOnlineStatus = () => {
      if (typeof navigator !== 'undefined') {
        setIsOnline(navigator.onLine);
      }
    };

    if (typeof window !== 'undefined') {
      checkIfInstalled();
      updateOnlineStatus();

      window.addEventListener('online', updateOnlineStatus);
      window.addEventListener('offline', updateOnlineStatus);

      // Listen for app installed event
      window.addEventListener('appinstalled', () => {
        setIsInstalled(true);
      });

      return () => {
        window.removeEventListener('online', updateOnlineStatus);
        window.removeEventListener('offline', updateOnlineStatus);
      };
    }
  }, []);

  const handleInstallClick = () => {
    if (typeof window !== 'undefined' && (window as any).deferredInstallPrompt) {
      (window as any).deferredInstallPrompt.prompt();
      (window as any).deferredInstallPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
        }
        (window as any).deferredInstallPrompt = null;
      });
    }
  };

  // Don't render anything on the server
  if (!isClient) {
    return null;
  }

  if (isInstalled) {
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-800">
        App Installed
      </Badge>
    );
  }

  if (!isOnline) {
    return (
      <Badge variant="secondary" className="bg-red-100 text-red-800">
        Offline Mode
      </Badge>
    );
  }

  // Show install button if not installed and install prompt is available
  if (typeof window !== 'undefined' && (window as any).deferredInstallPrompt) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleInstallClick}
        className="text-xs h-6 px-2"
      >
        Install App
      </Button>
    );
  }

  return null;
}