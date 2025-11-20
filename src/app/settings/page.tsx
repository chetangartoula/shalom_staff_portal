import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { getUser } from '@/lib/auth';
import { Button } from "@/components/ui/shadcn/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn/card"
import { Checkbox } from "@/components/ui/shadcn/checkbox"
import { Input } from "@/components/ui/shadcn/input"
import { Label } from '@/components/ui/shadcn/label';
import { Separator } from '@/components/ui/shadcn/separator';
import Link from 'next/link';

export default async function SettingsPage() {
    const user = await getUser();

    return (
        <DashboardLayout user={user}>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
                    <p className="text-muted-foreground text-sm md:text-base">
                        Manage your account settings and application preferences.
                    </p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                             <CardHeader>
                                <CardTitle>Profile</CardTitle>
                                <CardDescription>This is how others will see you on the site.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input id="name" defaultValue={user?.name || ''} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" defaultValue={user?.email || ''} />
                                </div>
                            </CardContent>
                             <CardFooter>
                                <Button>Save Changes</Button>
                            </CardFooter>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Password</CardTitle>
                                <CardDescription>Update your password here. Please choose a strong one.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="current-password">Current Password</Label>
                                    <Input id="current-password" type="password" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new-password">New Password</Label>
                                    <Input id="new-password" type="password" />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                                    <Input id="confirm-password" type="password" />
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button>Update Password</Button>
                            </CardFooter>
                        </Card>
                    </div>
                     <div className="lg:col-span-1 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Application</CardTitle>
                                <CardDescription>Manage application settings and preferences.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-start space-x-3">
                                    <div className="grid gap-1.5 leading-none">
                                        <Link href="/pwa-settings" className="text-sm font-medium hover:underline">PWA Settings</Link>
                                        <p className="text-sm text-muted-foreground">Manage Progressive Web App installation and features.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle>Notifications</CardTitle>
                                <CardDescription>Manage how you receive notifications.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-start space-x-3">
                                    <Checkbox id="email-notifications" defaultChecked />
                                    <div className="grid gap-1.5 leading-none">
                                        <label htmlFor="email-notifications" className="text-sm font-medium">Email Notifications</label>
                                        <p className="text-sm text-muted-foreground">Receive emails about important account activity.</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <Checkbox id="push-notifications" />
                                    <div className="grid gap-1.5 leading-none">
                                        <label htmlFor="push-notifications" className="text-sm font-medium">Push Notifications</label>
                                        <p className="text-sm text-muted-foreground">Get push notifications on your devices for real-time updates.</p>
                                    </div>
                                </div>
                            </CardContent>
                             <CardFooter>
                                <Button>Save Preferences</Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-red-600">Danger Zone</CardTitle>
                        <CardDescription>These actions are permanent and cannot be undone.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <div className="flex flex-col sm:flex-row justify-between sm:items-center p-4 border border-destructive/50 rounded-lg">
                            <div>
                                <h4 className="font-semibold">Delete Account</h4>
                                <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data.</p>
                            </div>
                            <Button variant="destructive" className="mt-4 sm:mt-0">Delete Account</Button>
                       </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}