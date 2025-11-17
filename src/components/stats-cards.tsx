import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, Users, Mountain, Settings, LucideProps, Users2, Backpack } from 'lucide-react';

interface StatsCardsProps {
    stats: {
        reports: number;
        travelers: number;
        treks: number;
        services: number;
        guides: number;
        porters: number;
    } | null;
}

type IconName = "ClipboardList" | "Users" | "Mountain" | "Settings" | "Users2" | "Backpack";

const icons: { [key in IconName]: React.ElementType<LucideProps> } = {
    ClipboardList,
    Users,
    Mountain,
    Settings,
    Users2,
    Backpack,
};

export function StatsCards({ stats }: StatsCardsProps) {
    const statCards = [
        { title: 'Total Reports', value: stats?.reports ?? 0, icon: "ClipboardList" as IconName, color: 'text-blue-500' },
        { title: 'Total Travelers', value: stats?.travelers ?? 0, icon: "Users" as IconName, color: 'text-green-500' },
        { title: 'Available Treks', value: stats?.treks ?? 0, icon: "Mountain" as IconName, color: 'text-purple-500' },
        { title: 'Total Guides', value: stats?.guides ?? 0, icon: "Users2" as IconName, color: 'text-yellow-500' },
        { title: 'Total Porters', value: stats?.porters ?? 0, icon: "Backpack" as IconName, color: 'text-orange-500' },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {statCards.map((card, index) => {
                const Icon = icons[card.icon];
                return (
                    <Card key={index} className="shadow-sm hover:shadow-lg transition-shadow duration-300">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                            <Icon className={`h-5 w-5 ${card.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{card.value}</div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}

StatsCards.Skeleton = function StatsSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
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
