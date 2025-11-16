
"use client";

import { useSearchParams, useParams } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import React, { useState, useEffect } from "react";
import { Loader2, Mountain, Copy, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

// For the form, all fields are optional until a section is opened.
const optionalTravelerSchema = travelerSchema.deepPartial().extend({ id: z.string() });

const formSchema = z.object({
  travelers: z.array(optionalTravelerSchema),
});

type FormData = z.infer<typeof formSchema>;

export default function ReportPage() {
  const params = useParams();
  const groupId = params.groupId as string;
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const groupSize = parseInt(searchParams.get("groupSize") || "1", 10);

  const [isLoading, setIsLoading] = useState(true);
  const [openedAccordions, setOpenedAccordions] = useState<string[]>([]);
  const [isCopied, setIsCopied] = useState(false);

  const defaultTravelers = React.useMemo(() =>
    Array.from({ length: groupSize }, () => ({
      id: uuidv4(),
    })),
    [groupSize]
  );

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      travelers: defaultTravelers,
    },
    mode: 'onChange'
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "travelers",
  });

  useEffect(() => {
    const fetchTravelerData = async () => {
      if (!groupId) return;
      try {
        const response = await fetch(`/api/travelers/${groupId}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.travelers.length) {
            // Convert date strings back to Date objects
            const formattedTravelers = data.travelers.map((t: any) => ({
              ...t,
              dateOfBirth: t.dateOfBirth ? new Date(t.dateOfBirth) : undefined,
              passportExpiryDate: t.passportExpiryDate ? new Date(t.passportExpiryDate) : undefined,
            }));
            form.reset({ travelers: formattedTravelers });
          }
        }
      } catch (error) {
        console.error("Failed to fetch traveler data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTravelerData();
  }, [groupId, form]);

  const handleAccordionChange = (value: string[]) => {
    setOpenedAccordions(value);
  };
  
  const onSubmit = async (data: FormData) => {
    // Manually trigger validation for any opened accordions before submitting
    for (const field of fields) {
      if (openedAccordions.includes(field.id)) {
        const travelerIndex = data.travelers.findIndex(t => t.id === field.id);
        if (travelerIndex !== -1) {
           const result = travelerSchema.safeParse(data.travelers[travelerIndex]);
           if(!result.success) {
                result.error.errors.forEach(err => {
                    form.setError(`travelers.${travelerIndex}.${err.path[0] as keyof FormData['travelers'][0]}`, {
                        type: 'manual',
                        message: err.message,
                    });
                });
                toast({
                    variant: 'destructive',
                    title: `Invalid Details for Traveler ${travelerIndex + 1}`,
                    description: "Please fill in all required fields for the opened sections."
                });
                return; // Stop submission
           }
        }
      }
    }
    
    // Filter out travelers that haven't been touched
    const travelersToSubmit = data.travelers.filter(t => openedAccordions.includes(t.id));

    if (travelersToSubmit.length === 0) {
        toast({
            variant: "destructive",
            title: "No Details Entered",
            description: "Please fill out the details for at least one traveler.",
        });
        return;
    }

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
        method: 'PUT', // Use PUT to update existing or create new
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit traveler details');
      }

      toast({
        title: "Details Submitted",
        description: "Traveler details have been saved. Thank you!",
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
                <CardDescription className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  Please fill out the details for each member of your group. Your Group ID is:
                  <div className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1">
                     <span className="font-mono text-sm text-primary">{groupId.substring(0,8)}...</span>
                     <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy}>
                       {isCopied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                       <span className="sr-only">Copy Group ID</span>
                     </Button>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <Accordion type="multiple" onValueChange={handleAccordionChange} value={openedAccordions} className="w-full">
                      {fields.map((field, index) => (
                        <AccordionItem value={field.id} key={field.id}>
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
                                      <Input placeholder="American" {...field} />
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
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Passport Photo</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="file"
                                        onChange={(e) => field.onChange(e.target.files)}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`travelers.${index}.visaPhoto`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Visa Photo</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="file"
                                        onChange={(e) => field.onChange(e.target.files)}
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

    