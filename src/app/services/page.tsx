"use client";

import { useState, useEffect } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/dashboard-layout';
import { AddTrekForm, type AddTrekFormData } from '@/components/add-trek-form';


const serviceSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  rate: z.number().min(0, 'Rate must be non-negative'),
  times: z.number().min(0, 'Times must be non-negative'),
});

const servicesFormSchema = z.object({
  services: z.array(serviceSchema),
});

type ServicesFormData = z.infer<typeof servicesFormSchema>;

export default function ServicesPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddTrekModalOpen, setIsAddTrekModalOpen] = useState(false);


  const form = useForm<ServicesFormData>({
    resolver: zodResolver(servicesFormSchema),
    defaultValues: {
      services: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'services',
  });

  useEffect(() => {
    async function fetchServices() {
      try {
        const res = await fetch('/api/services');
        if (!res.ok) throw new Error('Failed to fetch services');
        const data = await res.json();
        form.reset({ services: data.services });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not load services.',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchServices();
  }, [form, toast]);

  const onSubmit = async (data: ServicesFormData) => {
    setIsSubmitting(true);
    // In a real app, you'd have a POST/PUT endpoint to save all services
    console.log('Submitting data:', data);
    try {
      // This is a placeholder for the actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: 'Success!',
        description: 'Services have been updated.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update services.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTrekSubmit = async (data: AddTrekFormData) => {
    // This is a placeholder as the main logic is on the home page
    // but we need to handle the form submission
    toast({
      title: "Trek Added",
      description: `${data.name} has been added to the list.`,
    });
    setIsAddTrekModalOpen(false);
  };

  return (
    <>
      <AddTrekForm open={isAddTrekModalOpen} onOpenChange={setIsAddTrekModalOpen} onSubmit={handleAddTrekSubmit} />
      <DashboardLayout onAddTrekClick={() => setIsAddTrekModalOpen(true)}>
        <main className="flex flex-1 flex-col">
          <Card className="flex flex-1 flex-col">
            <CardHeader>
              <CardTitle>Manage Services</CardTitle>
              <CardDescription>Add, edit, or remove services for cost calculation.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 h-full flex flex-col">
                    <div className="space-y-4 flex-1">
                      {fields.map((field, index) => (
                        <div key={field.id} className="flex items-end gap-3 p-3 border rounded-lg bg-background">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
                            <FormField
                              control={form.control}
                              name={`services.${index}.name`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Service Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., Guide days" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`services.${index}.rate`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Rate (USD)</FormLabel>
                                  <FormControl>
                                    <Input type="number" placeholder="30" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`services.${index}.times`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Default Times</FormLabel>
                                  <FormControl>
                                    <Input type="number" placeholder="12" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-auto">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => append({ name: '', rate: 0, times: 1 })}
                      >
                        <Plus className="mr-2 h-4 w-4" /> Add Service
                      </Button>
                    </div>
                    <CardFooter className="px-0 pt-6 mt-auto">
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                      </Button>
                    </CardFooter>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </main>
      </DashboardLayout>
      <Toaster />
    </>
  );
}
