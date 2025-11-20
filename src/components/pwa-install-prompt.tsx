'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/shadcn/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/shadcn/card';
import { X } from 'lucide-react';

declare global {
  interface Window {
    deferredInstallPrompt?: any;
  }
}

export function PWAInstallPrompt() {
  const [isInstallPromptShown, setIsInstallPromptShown] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Set isClient to true only on the client side
    setIsClient(true);
    
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      if (typeof window !== 'undefined') {
        window.deferredInstallPrompt = e;
      }
      setDeferredPrompt(e);
      // Update UI to notify the user they can install the PWA
      setIsInstallPromptShown(true);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);

  const handleInstallClick = () => {
    if (typeof window !== 'undefined' && deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        // Clear the deferred prompt
        if (typeof window !== 'undefined') {
          window.deferredInstallPrompt = null;
        }
        setDeferredPrompt(null);
        // Hide the install prompt
        setIsInstallPromptShown(false);
      });
    }
  };

  const handleDismiss = () => {
    setIsInstallPromptShown(false);
  };

  // Don't render anything on the server
  if (!isClient || !isInstallPromptShown || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">Install App</CardTitle>
              <CardDescription>Get the full experience with our app</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={handleDismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          <p className="text-sm text-muted-foreground">
            Install this application on your device for faster access and offline functionality.
          </p>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button variant="outline" onClick={handleDismiss} className="flex-1">
            Not Now
          </Button>
          <Button onClick={handleInstallClick} className="flex-1">
            Install
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}