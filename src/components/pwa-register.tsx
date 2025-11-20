'use client';

import { useEffect, useState } from 'react';

export function PWAManager() {
  const [isInstallPromptShown, setIsInstallPromptShown] = useState(false);
  const [isClient, setIsClient] = useState(false);
  let deferredPrompt: any;

  useEffect(() => {
    // Set isClient to true only on the client side
    setIsClient(true);
    
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('SW registered: ', registration);
          })
          .catch(registrationError => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }

    // Handle install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      deferredPrompt = e;
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
        deferredPrompt = null;
        setIsInstallPromptShown(false);
      });
    }
  };

  // Don't render anything - this is just for functionality
  // Only render on the client side
  if (!isClient) {
    return null;
  }

  return null;
}