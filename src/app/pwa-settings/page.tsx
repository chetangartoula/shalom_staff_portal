import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { getUser } from '@/lib/auth';
import { PWAStatus } from '@/components/pwa-status';
import { PWAPushManager } from '@/components/pwa-push-manager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shadcn/card';
import { Button } from '@/components/ui/shadcn/button';
import { Badge } from '@/components/ui/shadcn/badge';
import { 
  Download, 
  Bell, 
  Smartphone, 
  WifiOff, 
  RefreshCw,
  Info
} from 'lucide-react';

export default async function PWASettingsPage() {
  const user = await getUser();

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">PWA Settings</h1>
            <p className="text-muted-foreground">
              Manage your Progressive Web App settings and installation
            </p>
          </div>
          <PWAStatus />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Installation Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Installation
              </CardTitle>
              <CardDescription>
                Install the app for a native experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Benefits of installing</p>
                  <ul className="mt-1 text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li>Faster access from your home screen</li>
                    <li>Offline functionality</li>
                    <li>Push notifications</li>
                    <li>Native app-like experience</li>
                  </ul>
                </div>
              </div>
              
              <div className="pt-2">
                <Button className="w-full" variant="outline">
                  <Smartphone className="mr-2 h-4 w-4" />
                  Install App
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Offline Support Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <WifiOff className="h-5 w-5" />
                Offline Support
              </CardTitle>
              <CardDescription>
                App functionality when offline
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Offline Mode</span>
                <Badge variant="secondary">Enabled</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Cached Pages</span>
                <Badge variant="secondary">8 pages</Badge>
              </div>
              
              <div className="pt-2">
                <Button className="w-full" variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Cache
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Push Notifications Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Push Notifications
              </CardTitle>
              <CardDescription>
                Stay updated with important notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PWAPushManager />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}