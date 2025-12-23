"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/shadcn/dialog";
import { TransactionForm } from "./transaction-form";
import type { Report } from "@/lib/types";

interface QuickTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    report: Report | null;
    onSuccess: () => void;
}

export function QuickTransactionModal({ isOpen, onClose, report, onSuccess }: QuickTransactionModalProps) {
    if (!report) return null;

    // Only disable payment if balance is zero or negative (fully paid or overpaid)
    // Allow payments when there's still a balance due (balance > 0)
    const isFullyPaid = report.paymentDetails.balance <= 0;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Quick Payment</DialogTitle>
                    <DialogDescription>
                        Add a payment for {report.trekName} ({report.groupName}).
                    </DialogDescription>
                </DialogHeader>
                <TransactionForm
                    groupId={report.groupId}
                    onSuccess={() => {
                        onSuccess();
                        onClose();
                    }}
                    isPaymentDisabled={isFullyPaid}
                />
            </DialogContent>
        </Dialog>
    );
}
