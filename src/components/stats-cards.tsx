import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import type { LucideProps } from 'lucide-react';

interface StatsCardsProps {
    stats: {
        reports: number;
        travelers: number;
        treks: number;
        services: number;
    } | null;
}

export function StatsCards({ stats }: StatsCardsProps) {
    const statCards = [
        { title: 'Total Reports', value: stats?.reports ?? 0, icon: "ClipboardList", color: 'text-blue-500' },
        { title: 'Total Travelers', value: stats?.travelers ?? 0, icon: "Users", color: 'text-green-500' },
        { title: 'Available Treks', value: stats?.treks ?? 0, icon: "Mountain", color: 'text-purple-500' },
        { title: 'Available Services', value: stats?.services ?? 0, icon: "Settings", color: 'text-orange-500' },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((card, index) => (
                <Card key={index} className="shadow-sm hover:shadow-lg transition-shadow duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                        <Icon name={card.icon as any} className={`h-5 w-5 ${card.color}`} />
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
