
"use client";

import React from "react";
import { Mountain, Copy, Check, Loader2 } from "lucide-react";
import { useSearchParams, useParams } from "next/navigation";
import dynamic from "next/dynamic";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";

// Dynamically import the form component with SSR turned off
const TravelerForm = dynamic(() => import('@/components/traveler-form'), {
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

  const handleCopy = () => {
    if (!groupId) return;
    navigator.clipboard.writeText(groupId);
    setIsCopied(true);
    toast({
      title: "Copied!",
      description: "Group ID copied to clipboard.",
    });
    setTimeout(() => setIsCopied(false), 2000);
  };


  return (
    <>
      <div className="flex flex-col min-h-screen bg-slate-50">
        <header className="flex items-center h-16 px-4 md:px-6 bg-primary text-primary-foreground shadow-md">
          <div className="flex items-center gap-2">
            <Mountain className="h-6 w-6" />
            <h1 className="text-xl font-bold">Shalom Treks</h1>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-lg">
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
                {/* The heavy form is loaded here dynamically */}
                <TravelerForm />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      <Toaster />
    </>
  );
}
