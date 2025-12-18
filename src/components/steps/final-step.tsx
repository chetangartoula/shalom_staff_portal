"use client";

import { memo } from 'react';
import { Button } from "@/components/ui/shadcn/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/shadcn/card";
import { Loader2 } from 'lucide-react';

interface FinalStepProps {
    isSubmitting: boolean;
    onSubmit: () => void;
}

function FinalStepComponent({
    isSubmitting,
    onSubmit
}: FinalStepProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Complete Report</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground mb-6 text-center">
                    Click the button below to finalize and save your cost report.
                </p>
                <Button 
                    onClick={onSubmit} 
                    disabled={isSubmitting}
                    size="lg"
                    className="w-full sm:w-auto"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        'Finish'
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}

export const FinalStep = memo(FinalStepComponent);
