"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import React, { useState, useEffect, useMemo } from "react";
import { Loader2, Mountain, Copy, Check } from "lucide-react";
import { useSearchParams, useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { DatePicker } from "@/components/ui/date-picker";

const travelerSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  passportNumber: z.string().min(1, "Passport number is required"),
  emergencyContact: z.string().min(1, "Emergency contact is required"),
  dateOfBirth: z.date().optional(),
  nationality: z.string().optional(),
  passportExpiryDate: z.date().optional(),
  passportPhoto: z.any().optional(),
  visaPhoto: z.any().optional(),
});

const partialTravelerSchema = travelerSchema.partial().extend({ id: z.string() });

type Traveler = z.infer<typeof travelerSchema>;
type PartialTraveler = z.infer<typeof partialTravelerSchema>;
type FormValues = { travelers: PartialTraveler[] };

export default function ReportPage() {
  const params = useParams();
  const groupId = params.groupId as string;
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const groupSize = parseInt(searchParams.get("groupSize") || "1", 10);

  const [isLoading, setIsLoading] = useState(true);
  const [openedAccordions, setOpenedAccordions] = useState<string[]>([]);
  const [isCopied, setIsCopied] = useState(false);

  const defaultTravelers = useMemo(() =>
    Array.from({ length: groupSize }, () => ({
      id: uuidv4(),
      name: "",
      phone: "",
      address: "",
      passportNumber: "",
      emergencyContact: "",
      nationality: "",
      dateOfBirth: undefined,
      passportExpiryDate: undefined,
      passportPhoto: undefined,
      visaPhoto: undefined,
    })),
    [groupSize]
  );
  
  const formSchema = z.object({
    travelers: z.array(partialTravelerSchema).superRefine((travelers, ctx) => {
      travelers.forEach((traveler, index) => {
        if (openedAccordions.includes(traveler.id!)) {
          const result = travelerSchema.safeParse(traveler);
          if (!result.success) {
            result.error.issues.forEach((issue) => {
              ctx.addIssue({
                ...issue,
                path: ['travelers', index, ...issue.path],
              });
            });
          }
        }
      });
    }),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      travelers: defaultTravelers,
    },
    mode: 'onChange',
  });

  useEffect(() => {
    const fetchTravelerData = async () => {
      if (!groupId) {
        setIsLoading(false);
        return;
      };
      try {
        const response = await fetch(`/api/travelers/${groupId}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.travelers && data.travelers.length) {
            const existingTravelersMap = new Map(data.travelers.map((t: any) => [t.id, t]));
            const mergedTravelers = defaultTravelers.map(defaultTraveler => {
                const existing = [...existingTravelersMap.values()].find(t => t.name === defaultTraveler.name); // Simple match by name or needs better logic
                if (existing) {
                    existingTravelersMap.delete(existing.id); // Prevent reuse
                    return {
                        ...defaultTraveler,
                        ...existing,
                        dateOfBirth: existing.dateOfBirth ? new Date(existing.dateOfBirth) : undefined,
                        passportExpiryDate: existing.passportExpiryDate ? new Date(existing.passportExpiryDate) : undefined,
                    };
                }
                return defaultTraveler;
            });
            form.reset({ travelers: mergedTravelers });
          }
        }
      } catch (error) {
        console.error("Failed to fetch traveler data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTravelerData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, groupSize, form.reset]);
  
  const onSubmit = async (data: FormValues) => {
    form.clearErrors();
    const activeTravelerIndexes = data.travelers
      .map((t, i) => (openedAccordions.includes(t.id!) ? i : -1))
      .filter(i => i !== -1);

    if (activeTravelerIndexes.length === 0) {
      toast({
        variant: "destructive",
        title: "No Details to Submit",
        description: "Please open at least one traveler section to fill in and submit.",
      });
      return;
    }
    
    const fieldsToValidate = activeTravelerIndexes.flatMap(index => 
      Object.keys(travelerSchema.shape).map(field => `travelers.${index}.${field}` as const)
    );

    const isValid = await form.trigger(fieldsToValidate);

    if (!isValid) {
      toast({
        variant: "destructive",
        title: "Validation Failed",
        description: "Please fill out all required fields in the opened sections.",
      });
      return;
    }

    const travelersToSubmit = data.travelers.filter(t => openedAccordions.includes(t.id!));
    
    const submissionData = {
      groupId,
      travelers: travelersToSubmit.map(t => ({
        ...t,
        passportPhoto: t.passportPhoto?.[0]?.name,
        visaPhoto: t.visaPhoto?.[0]?.name,
      }))
    };
    
    try {
      const response = await fetch(`/api/travelers/${groupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit traveler details');
      }

      toast({
        title: "Details Submitted",
        description: "Traveler details for the opened sections have been saved. Thank you!",
      });

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "Could not save traveler details. Please try again.",
      });
    }
  };

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
  
  if (isLoading) {
    return (
       <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

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
                  <span>Please fill out the details for each member of your group. Your Group ID is:</span>
                  <div className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1">
                     <span className="font-mono text-sm text-primary">{groupId.substring(0,8)}...</span>
                     <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy}>
                       {isCopied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                       <span className="sr-only">Copy Group ID</span>
                     </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <Accordion type="multiple" onValueChange={setOpenedAccordions} value={openedAccordions} className="w-full">
                      {form.watch('travelers').map((field, index) => (
                        <AccordionItem value={field.id!} key={field.id}>
                          <AccordionTrigger>
                            <span className="font-semibold">Traveler {index + 1}</span>
                          </AccordionTrigger>
                          <AccordionContent className="space-y-4 pt-4">
                            <FormField
                              control={form.control}
                              name={`travelers.${index}.name`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Full Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="John Doe" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="grid md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name={`travelers.${index}.phone`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Phone Number</FormLabel>
                                    <FormControl>
                                      <Input placeholder="+1 123 456 7890" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`travelers.${index}.dateOfBirth`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Date of Birth</FormLabel>
                                    <FormControl>
                                      <DatePicker date={field.value} setDate={field.onChange} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name={`travelers.${index}.passportNumber`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Passport Number</FormLabel>
                                    <FormControl>
                                      <Input placeholder="A12345678" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`travelers.${index}.passportExpiryDate`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Passport Expiry Date</FormLabel>
                                    <FormControl>
                                      <DatePicker date={field.value} setDate={field.onChange} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name={`travelers.${index}.nationality`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Nationality</FormLabel>
                                    <FormControl>
                                      <Input placeholder="American" {...field} value={field.value ?? ''}/>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`travelers.${index}.emergencyContact`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Emergency Contact Number</FormLabel>
                                    <FormControl>
                                      <Input placeholder="+1 987 654 3210" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <FormField
                              control={form.control}
                              name={`travelers.${index}.address`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Address</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="123 Main St, Anytown, USA 12345"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="grid md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name={`travelers.${index}.passportPhoto`}
                                render={({ field: { onChange, ...fieldProps} }) => (
                                  <FormItem>
                                    <FormLabel>Passport Photo</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="file"
                                        {...fieldProps}
                                        onChange={(e) => onChange(e.target.files)}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`travelers.${index}.visaPhoto`}
                                render={({ field: { onChange, ...fieldProps} }) => (
                                  <FormItem>
                                    <FormLabel>Visa Photo</FormLabel>
                                    <FormControl>
                                     <Input
                                        type="file"
                                        {...fieldProps}
                                        onChange={(e) => onChange(e.target.files)}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                    <CardFooter className="px-0 pt-6">
                      <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Details
                      </Button>
                    </CardFooter>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      <Toaster />
    </>
  );
}
