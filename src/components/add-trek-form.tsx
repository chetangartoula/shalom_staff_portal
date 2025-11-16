"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect } from "react";

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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Icon } from "@/components/ui/icon";


const permitSchema = z.object({
  name: z.string().min(1, "Permit name is required"),
  rate: z.coerce.number().min(0, "Rate must be a positive number"),
});

export const addTrekFormSchema = z.object({
  name: z.string().min(1, "Trek name is required"),
  description: z.string().min(1, "Description is required"),
  permits: z.array(permitSchema).min(1, "At least one permit is required"),
});

export type AddTrekFormData = z.infer<typeof addTrekFormSchema>;

interface AddTrekFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AddTrekFormData) => Promise<void>;
  isSubmitting: boolean;
}

export function AddTrekForm({ open, onOpenChange, onSubmit, isSubmitting }: AddTrekFormProps) {

  const addTrekForm = useForm<AddTrekFormData>({
    resolver: zodResolver(addTrekFormSchema),
    defaultValues: {
      name: "",
      description: "",
      permits: [{ name: "", rate: 0 }],
    },
  });

  const { fields: permitFields, append: appendPermit, remove: removePermit } = useFieldArray({
    control: addTrekForm.control,
    name: "permits",
  });

  useEffect(() => {
    if (!open) {
      addTrekForm.reset();
    }
  }, [open, addTrekForm]);
  
  const handleFormSubmit = async (data: AddTrekFormData) => {
    await onSubmit(data);
    if (addTrekForm.formState.isSubmitSuccessful) {
        addTrekForm.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <Form {...addTrekForm}>
          <form onSubmit={addTrekForm.handleSubmit(handleFormSubmit)}>
            <DialogHeader>
              <DialogTitle>Add a New Trek</DialogTitle>
              <DialogDescription>
                Fill in the details below to add a new trekking route.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
              <FormField
                control={addTrekForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trek Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Annapurna Base Camp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addTrekForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="A brief description of the trek." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <Label className="text-sm font-medium">Permits</Label>
                <div className="mt-2 space-y-3 rounded-lg border p-3">
                  {permitFields.map((field, index) => (
                    <div key={field.id} className="flex items-start gap-3">
                      <div className="grid grid-cols-2 gap-3 flex-1">
                        <FormField
                            control={addTrekForm.control}
                            name={`permits.${index}.name`}
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs">Permit Name</FormLabel>
                                <FormControl>
                                <Input placeholder="e.g., ACAP" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={addTrekForm.control}
                            name={`permits.${index}.rate`}
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs">Rate (USD)</FormLabel>
                                <FormControl>
                                <Input type="number" placeholder="30" {...field} onChange={e => field.onChange(Number(e.target.value))}/>
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
                        className="mt-6 text-destructive hover:bg-destructive/10"
                        disabled={permitFields.length <= 1}
                        onClick={() => removePermit(index)}
                      >
                        <Icon name="Trash2" className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                
                  <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => appendPermit({ name: "", rate: 0 })}
                    >
                    <Icon name="Plus" /> Add Permit
                  </Button>
                </div>
              </div>

            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />}
                Save Trek
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
