"use client";

import { useState, useEffect, useCallback } from 'react';
import { ClipboardList, Users, Mountain, Settings, Loader2, Edit } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { RecentReports } from './recent-reports';
import { StatsCards } from './stats-cards';
import { Suspense } from 'react';


export function DashboardContent() {
    return (
        <div className="space-y-8">
            <Suspense fallback={<StatsCards.Skeleton />}>
                {/* @ts-expect-error Server Component */}
                <StatsCards />
            </Suspense>
             <Suspense fallback={<RecentReports.Skeleton />}>
                {/* @ts-expect-error Server Component */}
                <RecentReports />
            </Suspense>
        </div>
    );
}