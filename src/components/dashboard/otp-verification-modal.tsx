"use client";

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/shadcn/dialog";
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OTPVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onVerify: () => void;
    reportName: string;
}

const DEMO_OTP = '123456'; // For demo purposes - in production, this should be generated server-side

export function OTPVerificationModal({ isOpen, onClose, onVerify, reportName }: OTPVerificationModalProps) {
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    const handleVerify = () => {
        setError('');
        setIsVerifying(true);

        // Simulate verification delay
        setTimeout(() => {
            if (otp === DEMO_OTP) {
                onVerify();
                handleClose();
            } else {
                setError('Invalid OTP. Please try again.');
                setIsVerifying(false);
            }
        }, 500);
    };

    const handleClose = () => {
        setOtp('');
        setError('');
        setIsVerifying(false);
        onClose();
    };

    const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, ''); // Only allow digits
        if (value.length <= 6) {
            setOtp(value);
            setError(''); // Clear error when user types
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-yellow-100">
                            <ShieldCheck className="h-5 w-5 text-yellow-600" />
                        </div>
                        <DialogTitle>Verification Required</DialogTitle>
                    </div>
                    <DialogDescription className="pt-2">
                        This report <span className="font-medium text-foreground">"{reportName}"</span> is fully paid.
                        Please enter the verification code to edit costing.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="otp">Verification Code</Label>
                        <Input
                            id="otp"
                            type="text"
                            inputMode="numeric"
                            placeholder="Enter 6-digit code"
                            value={otp}
                            onChange={handleOtpChange}
                            className={cn(
                                "text-center text-2xl tracking-widest font-mono",
                                error && "border-red-500 focus-visible:ring-red-500"
                            )}
                            disabled={isVerifying}
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && otp.length === 6) {
                                    handleVerify();
                                }
                            }}
                        />
                        {error && (
                            <div className="flex items-center gap-2 text-sm text-red-600">
                                <AlertTriangle className="h-4 w-4" />
                                <span>{error}</span>
                            </div>
                        )}
                    </div>

                    <div className="bg-muted p-3 rounded-md">
                        <p className="text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">Demo Code:</span> For demonstration purposes,
                            use code <span className="font-mono font-bold text-foreground">123456</span>
                        </p>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isVerifying}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleVerify}
                        disabled={otp.length !== 6 || isVerifying}
                        className="bg-primary hover:bg-primary/90"
                    >
                        {isVerifying ? 'Verifying...' : 'Verify & Continue'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
