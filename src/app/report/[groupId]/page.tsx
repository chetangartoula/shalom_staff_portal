
"use client";

import { useSearchParams, useParams } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import React from "react";

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

const formSchema = z.object({
  travelers: z.array(travelerSchema),
});

type FormData = z.infer<typeof formSchema>;

export default function ReportPage() {
  const params = useParams();
  const groupId = params.groupId as string;
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const groupSize = parseInt(searchParams.get("groupSize") || "1", 10);

  const defaultTravelers = React.useMemo(() => 
    Array.from({ length: groupSize }, () => ({
      id: uuidv4(),
      name: "",
      phone: "",
      address: "",
      passportNumber: "",
      emergencyContact: "",
      dateOfBirth: undefined,
      nationality: "",
      passportExpiryDate: undefined,
      passportPhoto: undefined,
      visaPhoto: undefined
    })),
    [groupSize]
  );
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      travelers: defaultTravelers,
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "travelers",
  });

  const onSubmit = (data: FormData) => {
    // Note: In a real app, you would handle file uploads here.
    // For now, we just log the data.
    console.log("Submitting data (mock API call):", JSON.stringify(data, null, 2));
    toast({
      title: "Details Submitted",
      description: "Traveler details have been saved (mock).",
    });
  };

  return (
    <>
      <div className="flex flex-col min-h-screen bg-gray-50/50">
        <header className="flex items-center justify-between h-16 px-4 md:px-6 border-b bg-white">
          <h1 className="text-xl font-bold text-primary">SHALOM-ADMIN</h1>
        </header>
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Traveler Details</CardTitle>
                <CardDescription>
                  Please fill out the details for each member of the group.
                  Group ID: {groupId}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <Accordion type="multiple" defaultValue={fields.map(f => f.id)} className="w-full">
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
                                    render={({ field: { onChange, value, ...rest } }) => (
                                        <FormItem>
                                        <FormLabel>Passport Photo</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="file" 
                                                onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)}
                                                {...rest} 
                                            />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`travelers.${index}.visaPhoto`}
                                    render={({ field: { onChange, value, ...rest } }) => (
                                        <FormItem>
                                        <FormLabel>Visa Photo</FormLabel>
                                        <FormControl>
                                             <Input 
                                                type="file" 
                                                onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)}
                                                {...rest} 
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
                        <Button type="submit">Submit Details</Button>
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

    