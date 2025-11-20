'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/shadcn/card';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = typeof window !== 'undefined' ? window.atob(base64) : atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PWAPushManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [message, setMessage] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Set isClient to true only on the client side
    setIsClient(true);
    
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      registerServiceWorker();
    }
  }, []);

  async function registerServiceWorker() {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
    
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
    } catch (error) {
      console.error('Service worker registration failed:', error);
    }
  }

  async function subscribeToPush() {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
    
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        // In a production environment, you would use VAPID keys
        // applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      });
      setSubscription(sub);
      const serializedSub = JSON.parse(JSON.stringify(sub));
      
      // Send subscription to server
      await fetch('/api/web-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serializedSub),
      });
    } catch (error) {
      console.error('Push subscription failed:', error);
    }
  }

  async function unsubscribeFromPush() {
    if (typeof window === 'undefined') return;
    
    try {
      await subscription?.unsubscribe();
      setSubscription(null);
      
      // Remove subscription from server
      if (subscription) {
        await fetch('/api/web-push', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription),
        });
      }
    } catch (error) {
      console.error('Push unsubscription failed:', error);
    }
  }

  async function sendTestNotification() {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
    if (!message.trim()) return;
    
    try {
      // In a real implementation, this would be handled server-side
      console.log('Sending test notification:', message);
      setMessage('');
      
      // Show a simple notification for testing
      if ('serviceWorker' in navigator && 'showNotification' in ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready;
        const options = {
          body: message,
          icon: '/logo/pwa.png',
          vibrate: [100, 50, 100],
        } as NotificationOptions & { vibrate: number[] };
        
        registration.showNotification('Test Notification', options);
      }
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  }

  // Don't render anything on the server
  if (!isClient) {
    return null;
  }

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Push Notifications</CardTitle>
          <CardDescription>Not supported in this browser</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Push notifications are not supported in this browser.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Push Notifications</CardTitle>
        <CardDescription>Manage push notification settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscription ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You are subscribed to push notifications.
            </p>
            <div className="flex flex-col space-y-2">
              <Input
                type="text"
                placeholder="Enter notification message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <Button onClick={sendTestNotification} disabled={!message.trim()}>
                Send Test Notification
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            You are not subscribed to push notifications.
          </p>
        )}
      </CardContent>
      <CardFooter>
        {subscription ? (
          <Button variant="outline" onClick={unsubscribeFromPush}>
            Unsubscribe
          </Button>
        ) : (
          <Button onClick={subscribeToPush}>
            Subscribe
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}