"use client";

import { useState, lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import type { Service } from "@/lib/types";
import type { ServiceFormData } from '@/components/add-service-form';

const AddServiceForm = lazy(() => import('@/components/add-service-form').then(mod => ({ default: mod.AddServiceForm })));

interface AddServiceModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: ServiceFormData) => Promise<void>;
    isSubmitting: boolean;
    service: Service | null;
}

export function AddServiceModal({ open, onOpenChange, onSubmit, isSubmitting, service }: AddServiceModalProps) {
    if (!open) return null;

    return (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><Loader2 className="h-8 w-8 animate-spin text-white" /></div>}>
            <AddServiceForm
                open={open}
                onOpenChange={onOpenChange}
                onSubmit={onSubmit}
                isSubmitting={isSubmitting}
                defaultValues={service}
            />
        </Suspense>
    );
}
