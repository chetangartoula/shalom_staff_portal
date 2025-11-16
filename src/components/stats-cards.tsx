import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, Users, Mountain, Settings } from 'lucide-react';
import { getPaginatedReports } from '@/app/api/reports/route';
import { getAllTravelers } from '@/app/api/travelers/all/route';
import { getTreks } from '@/app/api/treks/route';
import { getPaginatedServices } from '@/app/api/services/route';


async function getStats() {
    // Fetch all stats in parallel
    const [reportsData, travelersData, treksData, servicesData] = await Promise.all([
        getPaginatedReports(1, 1),
        getAllTravelers(),
        getTreks(),
        getPaginatedServices(1, 1)
    ]);

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
