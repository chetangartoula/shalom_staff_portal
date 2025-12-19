"use client";

import React from "react";
import { useParams, notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { Loader2, Check, Copy } from "lucide-react";
import { useQuery } from '@tanstack/react-query';

import { Button } from "@/components/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn/card";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";

// Dynamically import the form component with SSR turned off
const TravelerForm = dynamic(() => import('@/components/dashboard/traveler-form'), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ),
});


export default function ReportPage() {
  const params = useParams();
  const groupId = params.groupId as string;
  const { toast } = useToast();
  
  const [isCopied, setIsCopied] = React.useState(false);

  // Use React Query to fetch report details
  const { data: report, error, isLoading } = useQuery({
    queryKey: ['report', groupId],
    queryFn: async () => {
      if (!groupId) return null;
      
      try {
        const response = await fetch(`/api/reports/${groupId}`);
        if (!response.ok) {
          if (response.status === 404) {
            notFound();
          }
          throw new Error('Could not fetch report details');
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching report details:', error);
        throw error;
      }
    },
    enabled: !!groupId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2
  });

  const handleCopy = () => {
    if (!groupId) return;
    const url = `${window.location.origin}/report/${groupId}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    toast({
      title: "Copied!",
      description: "Traveler form link copied to clipboard.",
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (error) {
    // This will be caught by the error boundary
    if (error.message.includes('404')) {
      notFound();
    }
    throw error;
  }

  if (isLoading) {
     return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
     )
  }

  if (!report) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
        <p className="text-muted-foreground">No report data available.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col min-h-screen bg-muted/40">
        <header className="flex items-center h-16 px-4 md:px-6 bg-background border-b">
          <div className="flex items-center gap-2">
            <Logo width={150} height={32} />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Traveler Details Form</CardTitle>
                 <div className="text-sm text-muted-foreground pt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span>
                      Please fill out the details for each member of your group.
                      Your Group ID is:
                    </span>
                    <div className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1">
                      <span className="font-mono text-sm text-primary">
                        {groupId.substring(0, 8)}...
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={handleCopy}
                      >
                        {isCopied ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        <span className="sr-only">Copy Group ID</span>
                      </Button>
                    </div>
                  </div>
              </CardHeader>
              <CardContent>
                <TravelerForm groupId={groupId} groupSize={report.groupSize} />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </>
  );
}