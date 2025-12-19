"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import React, { useState, useEffect, useMemo } from "react";
import { Loader2, Save, Camera, Upload, User } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/shadcn/button";
import { CardFooter } from "@/components/ui/shadcn/card";
import { Input } from "@/components/ui/shadcn/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/shadcn/form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/shadcn/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/shadcn/dialog";
import { Textarea } from "@/components/ui/shadcn/textarea";
import { useToast } from "@/hooks/use-toast";
import { DatePicker } from "@/components/ui/shadcn/date-picker";
import { CameraCapture } from "@/components/camera-capture";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];

const fileSchema = z.any()
  .refine(files => {
      if (!files || files.length === 0) return true; // Optional field
      return files?.[0]?.size <= MAX_FILE_SIZE;
    }, `Max file size is 5MB.`)
  .refine(
    files => {
      if (!files || files.length === 0) return true; // Optional field
      return ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type);
    },
    "Only .jpg, .jpeg, .png, .webp and .pdf formats are supported."
  ).optional();

const travelerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Please enter a valid email address").optional(),
  address: z.string().min(1, "Address is required"),
  passportNumber: z.string().optional(),
  emergencyContact: z.string().min(1, "Emergency contact is required"),
  nationality: z.string().min(1, "Nationality is required"),
  profilePicture: z.string().optional(),
  passportPhoto: z.any().refine((files) => files?.length > 0, "Passport photo is required."),
  visaPhoto: z.any().optional(),
  travelPolicyId: z.any().optional(),
  travelInsurance: z.any().optional(),
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

const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

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
        email: "",
        address: "",
        passportNumber: "",
        emergencyContact: "",
        nationality: "",
        profilePicture: "",
        passportPhoto: undefined,
        visaPhoto: undefined,
        travelPolicyId: undefined,
        travelInsurance: undefined,
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
        // Import the fetchTravelers function dynamically to avoid server-side issues
        const { fetchTravelers } = await import('@/lib/api-service');
        const data = await fetchTravelers(groupId);
        
        if (data && data.length > 0) {
          const existingTravelers = data.map((t: any) => ({
            id: t.id.toString(),
            name: t.full_name || "",
            phone: t.phone_number || "",
            email: t.email || "",
            address: t.address || "",
            passportNumber: t.passport_number || "",
            emergencyContact: t.emergency_contact_name || t.emergency_contact_phone || "",
            nationality: t.nationality || "",
            profilePicture: t.profile_pic || "",
            passportPhoto: t.passport_photo ? new File([], "passport.jpg") : undefined, // Dummy file for validation
            visaPhoto: t.visa_photo ? new File([], "visa.jpg") : undefined,
            travelPolicyId: t.traval_policy_document ? new File([], "policy.pdf") : undefined,
            travelInsurance: t.traval_insurance_document ? new File([], "insurance.pdf") : undefined,
          }));
           
          const mergedTravelers = defaultTravelers.map((defaultTraveler, index) => {
            if (existingTravelers[index]) {
                const existing = existingTravelers[index];
                return { 
                    ...defaultTraveler,
                    ...existing, 
                    id: defaultTraveler.id,
                    // If a record exists, we can assume a passport photo was uploaded.
                    // We pass a dummy file to satisfy the validation on load.
                    // The user can still upload a new one.
                    passportPhoto: existing.passportNumber ? new File([], "dummy.jpg") : undefined
                };
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
        // Create FormData for multipart/form-data submission
        const formData = new FormData();
        
        // Add text fields
        formData.append('full_name', validationResult.data.name || '');
        formData.append('phone_number', validationResult.data.phone || '');
        formData.append('email', validationResult.data.email || '');
        formData.append('address', validationResult.data.address || '');
        formData.append('passport_number', validationResult.data.passportNumber || '');
        formData.append('emergency_contact_name', validationResult.data.emergencyContact || '');
        formData.append('emergency_contact_phone', validationResult.data.emergencyContact || '');
        formData.append('nationality', validationResult.data.nationality || '');
        formData.append('package', groupId || '');

        // Handle file uploads
        const handleFileUpload = async (file: File | undefined, fieldName: string) => {
            if (file) {
                formData.append(fieldName, file);
            } else {
                formData.append(fieldName, '');
            }
        };

        // Handle each file field
        if (validationResult.data.passportPhoto && validationResult.data.passportPhoto[0] instanceof File) {
            await handleFileUpload(validationResult.data.passportPhoto[0], 'passport_photo');
        }
        
        if (validationResult.data.visaPhoto && validationResult.data.visaPhoto[0] instanceof File) {
            await handleFileUpload(validationResult.data.visaPhoto[0], 'visa_photo');
        }
        
        if (validationResult.data.travelPolicyId && validationResult.data.travelPolicyId[0] instanceof File) {
            await handleFileUpload(validationResult.data.travelPolicyId[0], 'traval_policy_document');
        }
        
        if (validationResult.data.travelInsurance && validationResult.data.travelInsurance[0] instanceof File) {
            await handleFileUpload(validationResult.data.travelInsurance[0], 'traval_insurance_document');
        }

        // Handle profile picture (convert data URL to Blob if needed)
        if (validationResult.data.profilePicture) {
            // If it's a data URL, convert it to a Blob
            if (validationResult.data.profilePicture.startsWith('data:')) {
                const response = await fetch(validationResult.data.profilePicture);
                const blob = await response.blob();
                const file = new File([blob], 'profile_picture.jpg', { type: 'image/jpeg' });
                formData.append('profile_pic', file);
            } else {
                formData.append('profile_pic', '');
            }
        } else {
            formData.append('profile_pic', '');
        }

        // Submit the form data
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/v1/staff/create-traveler/`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Failed to submit traveler details: ${response.status} ${response.statusText}`);
        }

        toast({
            title: "Details Saved!",
            description: `Information for Traveler ${travelerIndex + 1} has been saved.`,
        });
    } catch (error) {
        console.error("Error saving traveler:", error);
        toast({
            variant: "destructive",
            title: "Submission Failed",
            description: error instanceof Error ? error.message : "Could not save traveler details. Please try again.",
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
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className="w-24 h-24 rounded-md border bg-muted flex items-center justify-center">
                            {field.value ? (
                                <Image src={field.value} alt="Profile" width={96} height={96} className="rounded-md object-cover w-full h-full" />
                            ) : (
                                <User className="h-10 w-10 text-muted-foreground" />
                            )}
                            </div>
                            <div className="flex flex-row sm:flex-col gap-2">
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
                                        <Camera className="mr-2 h-4 w-4" /> Camera
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
                            <Input placeholder="John Doe" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
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
                                value={field.value ?? ""}
                            />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name={`travelers.${index}.email`}
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email Address (Optional)</FormLabel>
                            <FormControl>
                            <Input
                                placeholder="traveler@example.com"
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
                    <div className="grid sm:grid-cols-2 gap-4">
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
                            value={field.value ?? ""}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <div className="grid sm:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name={`travelers.${index}.passportPhoto`}
                        render={({
                        field: { onChange, onBlur, name, ref },
                        }) => (
                        <FormItem>
                            <FormLabel>Passport Photo</FormLabel>
                            <FormControl>
                            <Input
                                type="file"
                                onBlur={onBlur}
                                name={name}
                                ref={ref}
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
                        field: { onChange, onBlur, name, ref },
                        }) => (
                        <FormItem>
                            <FormLabel>Visa Photo (Optional)</FormLabel>
                            <FormControl>
                            <Input
                                type="file"
                                onBlur={onBlur}
                                name={name}
                                ref={ref}
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
                    
                    {/* Travel Policy ID and Travel Insurance */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <FormField
                          control={form.control}
                          name={`travelers.${index}.travelPolicyId`}
                          render={({
                          field: { onChange, onBlur, name, ref },
                          }) => (
                          <FormItem>
                              <FormLabel>Travel Policy ID</FormLabel>
                              <FormControl>
                              <Input
                                  type="file"
                                  onBlur={onBlur}
                                  name={name}
                                  ref={ref}
                                  onChange={(e) =>
                                  onChange(e.target.files)
                                  }
                                  accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                              />
                              </FormControl>
                              <FormDescription>
                                  Upload your travel policy ID document (PDF or Word document).
                              </FormDescription>
                              <FormMessage />
                          </FormItem>
                          )}
                      />
                      
                      <FormField
                          control={form.control}
                          name={`travelers.${index}.travelInsurance`}
                          render={({
                          field: { onChange, onBlur, name, ref },
                          }) => (
                          <FormItem>
                              <FormLabel>Travel Insurance</FormLabel>
                              <FormControl>
                              <Input
                                  type="file"
                                  onBlur={onBlur}
                                  name={name}
                                  ref={ref}
                                  onChange={(e) =>
                                  onChange(e.target.files)
                                  }
                                  accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                              />
                              </FormControl>
                              <FormDescription>
                                  Upload your travel insurance document (PDF or Word document).
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
            <DialogContent className="max-w-md w-[90vw]">
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
