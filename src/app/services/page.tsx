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
import type { Service } from '@/lib/types';
import { DashboardHeader } from '@/components/dashboard-header';
import { Sidebar } from '@/components/ui/sidebar';

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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

  return (
    <>
      <div className={`grid min-h-screen w-full ${isSidebarCollapsed ? 'md:grid-cols-[5rem_1fr]' : 'md:grid-cols-[280px_1fr]'} bg-muted/40 transition-all duration-300`}>
        <Sidebar isCollapsed={isSidebarCollapsed} onAddTrekClick={() => { /* Not needed on this page */ }} />
        <div className="flex flex-col">
           <DashboardHeader>
             <Button variant="ghost" size="icon" className="hidden md:inline-flex" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
              {isSidebarCollapsed ? <span className="lucide lucide-panel-left-open"></span> : <span className="lucide lucide-panel-left-close"></span>}
            </Button>
          </DashboardHeader>
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            <Card>
              <CardHeader>
                <CardTitle>Manage Services</CardTitle>
                <CardDescription>Add, edit, or remove services for cost calculation.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="space-y-4">
                        {fields.map((field, index) => (
                          <div key={field.id} className="flex items-end gap-3 p-3 border rounded-lg">
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
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => append({ name: '', rate: 0, times: 1 })}
                      >
                        <Plus className="mr-2 h-4 w-4" /> Add Service
                      </Button>
                      <CardFooter className="px-0 pt-6">
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
        </div>
      </div>
      <Toaster />
    </>
  );
}
