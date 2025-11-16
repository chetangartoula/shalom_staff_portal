
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import React, { useState, useEffect, useMemo } from "react";
import { Loader2, Save } from "lucide-react";
import { useSearchParams, useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { DatePicker } from "@/components/ui/date-picker";

const travelerSchema = z.object({
  id: z.string().optional(), // ID is now optional as it's generated on the backend
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  passportNumber: z.string().min(1, "Passport number is required"),
  emergencyContact: z.string().min(1, "Emergency contact is required"),
  dateOfBirth: z.date({ required_error: "Date of birth is required" }),
  nationality: z.string().min(1, "Nationality is required"),
  passportExpiryDate: z.date({ required_error: "Passport expiry is required" }),
  passportPhoto: z.any().optional(),
  visaPhoto: z.any().optional(),
});

const formSchema = z.object({
  travelers: z.array(travelerSchema.partial()),
});

type FormValues = z.infer<typeof formSchema>;
type Traveler = z.infer<typeof travelerSchema>;

export default function TravelerForm() {
  const params = useParams();
  const groupId = params.groupId as string;
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const groupSize = parseInt(searchParams.get("groupSize") || "1", 10);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState<{ [key: string]: boolean }>({});
  const [openedAccordions, setOpenedAccordions] = useState<string[]>([]);
  
  const clientSideTravelerIds = useMemo(
    () => Array.from({ length: groupSize }, () => Math.random().toString(36).substr(2, 9)),
    [groupSize]
  );

  const defaultTravelers = useMemo(
    () =>
      Array.from({ length: groupSize }, (_, i) => ({
        id: clientSideTravelerIds[i],
        name: "",
        phone: "",
        address: "",
        passportNumber: "",
        emergencyContact: "",
        nationality: "",
      })),
    [groupSize, clientSideTravelerIds]
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      travelers: defaultTravelers,
    },
    mode: "onChange",
  });
  
  useEffect(() => {
    const fetchTravelerData = async () => {
      if (!groupId) {
        setIsLoading(false);
        return;
      }
      try {
        const response = await fetch(`/api/travelers/${groupId}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.travelers && data.travelers.length) {
            const existingTravelers = data.travelers.map((t: any) => ({
              ...t,
              dateOfBirth: t.dateOfBirth ? new Date(t.dateOfBirth) : undefined,
              passportExpiryDate: t.passportExpiryDate ? new Date(t.passportExpiryDate) : undefined,
            }));
             
            const mergedTravelers = defaultTravelers.map((defaultTraveler, index) => {
              const existingData = existingTravelers[index];
              if (existingData) {
                return { ...defaultTraveler, ...existingData, id: defaultTraveler.id };
              }
              return defaultTraveler;
            });
            
            form.reset({ travelers: mergedTravelers });
            const prefilledAccordionIds = mergedTravelers
              .filter((t) => t.name)
              .map((t) => t.id!);
            setOpenedAccordions(prefilledAccordionIds);

          } else {
            form.reset({ travelers: defaultTravelers });
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
  }, [groupId, groupSize]);
  
  const handleSaveTraveler = async (travelerIndex: number) => {
    const travelerClientId = form.getValues(`travelers.${travelerIndex}.id`);
    if (!travelerClientId) return;

    setIsSubmitting((prev) => ({ ...prev, [travelerClientId]: true }));

    const travelerData = form.getValues(`travelers.${travelerIndex}`);
    const validationResult = travelerSchema.safeParse(travelerData);

    if (!validationResult.success) {
        validationResult.error.errors.forEach((err) => {
            const path = err.path[0] as keyof Traveler;
            if (path) {
                 form.setError(`travelers.${travelerIndex}.${path}`, {
                    type: "manual",
                    message: err.message,
                });
            }
        });
        toast({
            variant: "destructive",
            title: "Validation Failed",
            description: `Please fill all required fields for Traveler ${travelerIndex + 1}.`,
        });
        setIsSubmitting((prev) => ({ ...prev, [travelerClientId]: false }));
        return;
    }
    
    try {
      const response = await fetch(`/api/travelers/${groupId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ traveler: validationResult.data }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit traveler details");
      }

      toast({
        title: "Details Saved!",
        description: `Information for Traveler ${travelerIndex + 1} has been saved.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "Could not save traveler details. Please try again.",
      });
    } finally {
      setIsSubmitting((prev) => ({ ...prev, [travelerClientId]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => e.preventDefault()}
        className="space-y-6"
      >
        <Accordion
          type="multiple"
          onValueChange={setOpenedAccordions}
          value={openedAccordions}
          className="w-full"
        >
          {form.watch("travelers").map((field, index) => (
            <AccordionItem value={field.id!} key={field.id}>
              <AccordionTrigger>
                <span className="font-semibold">
                  Traveler {index + 1}
                </span>
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
                          <Input
                            placeholder="+1 123 456 7890"
                            {...field}
                          />
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
                          <DatePicker
                            date={field.value}
                            setDate={field.onChange}
                          />
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
                          <Input
                            placeholder="A12345678"
                            {...field}
                          />
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
                          <DatePicker
                            date={field.value}
                            setDate={field.onChange}
                          />
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
                          <Input
                            placeholder="American"
                            {...field}
                            value={field.value ?? ""}
                          />
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
                        <FormLabel>
                          Emergency Contact Number
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="+1 987 654 3210"
                            {...field}
                          />
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
                    render={({
                      field: { onChange, ...fieldProps },
                    }) => (
                      <FormItem>
                        <FormLabel>Passport Photo</FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            {...fieldProps}
                            onChange={(e) =>
                              onChange(e.target.files)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`travelers.${index}.visaPhoto`}
                    render={({
                      field: { onChange, ...fieldProps },
                    }) => (
                      <FormItem>
                        <FormLabel>Visa Photo</FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            {...fieldProps}
                            onChange={(e) =>
                              onChange(e.target.files)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <CardFooter className="px-0 pt-6">
                  <Button
                    type="button"
                    onClick={() => handleSaveTraveler(index)}
                    disabled={isSubmitting[field.id!]}
                  >
                    {isSubmitting[field.id!] && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <Save className="mr-2 h-4 w-4" /> Save Details
                  </Button>
                </CardFooter>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </form>
    </Form>
  );
}
