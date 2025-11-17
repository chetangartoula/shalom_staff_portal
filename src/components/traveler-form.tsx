
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import React, { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { Loader2, Save, Camera, Upload, User } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { DatePicker } from "@/components/ui/date-picker";
import { CameraCapture } from "@/components/camera-capture";

const travelerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  passportNumber: z.string().optional(),
  emergencyContact: z.string().min(1, "Emergency contact is required"),
  dateOfBirth: z.date({ required_error: "Date of birth is required" }),
  nationality: z.string().min(1, "Nationality is required"),
  passportExpiryDate: z.date({ required_error: "Passport expiry is required" }),
  profilePicture: z.string().optional(),
  passportPhoto: z.any().refine((files) => files?.length > 0, "Passport photo is required."),
  visaPhoto: z.any().optional(),
});


const formSchema = z.object({
  travelers: z.array(travelerSchema),
});

type FormValues = z.infer<typeof formSchema>;
type Traveler = z.infer<typeof travelerSchema>;

interface TravelerFormProps {
    groupId: string;
    groupSize: number;
}

export default function TravelerForm({ groupId, groupSize }: TravelerFormProps) {
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState<{ [key: string]: boolean }>({});
  const [openedAccordions, setOpenedAccordions] = useState<string[]>([]);
  const [isCameraDialogOpen, setIsCameraDialogOpen] = useState(false);
  const [activeTravelerIndex, setActiveTravelerIndex] = useState<number | null>(null);
  
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
        dateOfBirth: undefined,
        passportExpiryDate: undefined,
        profilePicture: "",
        passportPhoto: undefined,
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
                return { ...defaultTraveler, ...existingData, id: defaultTraveler.id, passportPhoto: existingData.passportNumber ? new File([], "dummy.txt") : undefined };
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
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load existing traveler data."
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchTravelerData();
  }, [groupId, groupSize, form, defaultTravelers, toast]);

  const handleProfilePictureUpload = (e: React.ChangeEvent<HTMLInputElement>, travelerIndex: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue(`travelers.${travelerIndex}.profilePicture`, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenCamera = (travelerIndex: number) => {
    setActiveTravelerIndex(travelerIndex);
    setIsCameraDialogOpen(true);
  };
  
  const handleCapture = (imageSrc: string) => {
    if (activeTravelerIndex !== null) {
      form.setValue(`travelers.${activeTravelerIndex}.profilePicture`, imageSrc);
      setIsCameraDialogOpen(false);
      setActiveTravelerIndex(null);
    }
  };
  
  const handleSaveTraveler = async (travelerIndex: number) => {
    const travelerClientId = form.getValues(`travelers.${travelerIndex}.id`);
    if (!travelerClientId) return;

    setIsSubmitting((prev) => ({ ...prev, [travelerClientId]: true }));

    await form.trigger(`travelers.${travelerIndex}`);
    const travelerData = form.getValues(`travelers.${travelerIndex}`);
    const validationResult = travelerSchema.safeParse(travelerData);

    if (!validationResult.success) {
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
        <Dialog open={isCameraDialogOpen} onOpenChange={setIsCameraDialogOpen}>
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
                    name={`travelers.${index}.profilePicture`}
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Profile Picture</FormLabel>
                        <div className="flex items-center gap-4">
                            <div className="w-24 h-24 rounded-md border bg-muted flex items-center justify-center">
                            {field.value ? (
                                <Image src={field.value} alt="Profile" width={96} height={96} className="rounded-md object-cover w-full h-full" />
                            ) : (
                                <User className="h-10 w-10 text-muted-foreground" />
                            )}
                            </div>
                            <div className="flex flex-col gap-2">
                                <Button type="button" size="sm" variant="outline" onClick={() => document.getElementById(`profile-upload-${index}`)?.click()}>
                                    <Upload className="mr-2 h-4 w-4" /> Upload
                                </Button>
                                <Input 
                                    id={`profile-upload-${index}`}
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={(e) => handleProfilePictureUpload(e, index)}
                                />

                                <DialogTrigger asChild>
                                    <Button type="button" size="sm" variant="outline" onClick={() => handleOpenCamera(index)}>
                                        <Camera className="mr-2 h-4 w-4" /> Open Camera
                                    </Button>
                                </DialogTrigger>
                            </div>
                        </div>
                        <FormMessage />
                        </FormItem>
                    )}
                    />

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
                            <FormLabel>Passport Number (Optional)</FormLabel>
                            <FormControl>
                            <Input
                                placeholder="A12345678"
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
                                value={field.value ?? ""}
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
                                accept="image/*,application/pdf"
                            />
                            </FormControl>
                             <FormDescription>
                                A photo or PDF of the passport is required.
                            </FormDescription>
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
                            <FormLabel>Visa Photo (Optional)</FormLabel>
                            <FormControl>
                            <Input
                                type="file"
                                {...fieldProps}
                                onChange={(e) =>
                                onChange(e.target.files)
                                }
                                accept="image/*,application/pdf"
                            />
                            </FormControl>
                            <FormDescription>
                                This field is optional.
                            </FormDescription>
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
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Capture Profile Picture</DialogTitle>
                </DialogHeader>
                <CameraCapture onCapture={handleCapture} />
            </DialogContent>
        </Dialog>
      </form>
    </Form>
  );
}

    