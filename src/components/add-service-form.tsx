"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { Service } from "@/lib/types";

export const serviceFormSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  rate: z.coerce.number().min(0, "Rate must be a non-negative number"),
  times: z.coerce.number().int().min(0, "Times must be a non-negative integer"),
});

export type ServiceFormData = z.infer<typeof serviceFormSchema>;

interface AddServiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ServiceFormData) => Promise<void>;
  isSubmitting: boolean;
  defaultValues?: Service | null;
}

export function AddServiceForm({ open, onOpenChange, onSubmit, isSubmitting, defaultValues }: AddServiceFormProps) {

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: "",
      rate: 0,
      times: 1,
    },
  });

  useEffect(() => {
    if (defaultValues) {
      form.reset(defaultValues);
    } else {
      form.reset({ name: "", rate: 0, times: 1 });
    }
  }, [defaultValues, form, open]);

  const handleFormSubmit = async (data: ServiceFormData) => {
    await onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)}>
            <DialogHeader>
              <DialogTitle>{defaultValues ? "Edit Service" : "Add New Service"}</DialogTitle>
              <DialogDescription>
                Fill in the details for the service below.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-6">
              <FormField
                control={form.control}
                name="name"
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
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rate (USD)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="30" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="times"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Times</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="12" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)} type="button">Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {defaultValues ? "Save Changes" : "Create Service"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
