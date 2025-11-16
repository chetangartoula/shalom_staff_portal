import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, Users, Mountain, Settings, Loader2 } from 'lucide-react';

async function getStats() {
    // Fetch all stats in parallel and use Next.js caching
    const [reportsRes, travelersRes, treksRes, servicesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/reports`, { next: { revalidate: 60 } }), // Cache for 1 minute
        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/travelers/all`, { next: { revalidate: 60 } }),
        fetch(`${processenv.NEXT_PUBLIC_APP_URL}/api/treks`, { next: { revalidate: 3600 } }), // Cache for 1 hour
        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/services`, { next: { revalidate: 3600 } })
    ]);

    if (!reportsRes.ok || !travelersRes.ok || !treksRes.ok || !servicesRes.ok) {
        throw new Error('Failed to fetch dashboard stats');
    }

    const reportsData = await reportsRes.json();
    const travelersData = await travelersRes.json();
    const treksData = await treksRes.json();
    const servicesData = await servicesRes.json();

    return {
        reports: reportsData.total,
        travelers: travelersData.travelers.length,
        treks: treksData.treks.length,
        services: servicesData.total,
    };
}

export async function StatsCards() {
    const stats = await getStats();

    const statCards = [
        { title: 'Total Reports', value: stats?.reports, icon: ClipboardList, color: 'text-blue-500' },
        { title: 'Total Travelers', value: stats?.travelers, icon: Users, color: 'text-green-500' },
        { title: 'Available Treks', value: stats?.treks, icon: Mountain, color: 'text-purple-500' },
        { title: 'Available Services', value: stats?.services, icon: Settings, color: 'text-orange-500' },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((card, index) => (
                <Card key={index} className="shadow-sm hover:shadow-lg transition-shadow duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                        <card.icon className={`h-5 w-5 ${card.color}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{card.value}</div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

StatsCards.Skeleton = function StatsSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
                <Card key={index}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="h-4 bg-muted rounded-md w-2/3"></div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-8 w-1/2 bg-muted rounded-md"></div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}