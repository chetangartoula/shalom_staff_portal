"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, Menu, Mountain, Plus } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sidebar } from "@/components/ui/sidebar";

const permitSchema = z.object({
  name: z.string().min(1, "Permit name is required"),
  rate: z.number().min(0, "Rate must be a positive number"),
});

const addTrekFormSchema = z.object({
  name: z.string().min(1, "Trek name is required"),
  description: z.string().min(1, "Description is required"),
  permits: z.array(permitSchema).min(1, "At least one permit is required"),
});

type AddTrekFormData = z.infer<typeof addTrekFormSchema>;

interface DashboardHeaderProps {
  onAddTrekSubmit: (data: AddTrekFormData) => Promise<void>;
}

export function DashboardHeader({ onAddTrekSubmit }: DashboardHeaderProps) {
  const { logout } = useAuth();
  const router = useRouter();
  const [isAddTripModalOpen, setIsAddTripModalOpen] = useState(false);

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

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleFormSubmit = async (data: AddTrekFormData) => {
    await onAddTrekSubmit(data);
    if (!addTrekForm.formState.isSubmitSuccessful) {
        addTrekForm.reset();
        setIsAddTripModalOpen(false);
    }
  };


  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col">
            <Sidebar />
        </SheetContent>
      </Sheet>
      <div className="w-full flex-1">
        {/* Can add search or other header elements here */}
      </div>
      <Dialog open={isAddTripModalOpen} onOpenChange={setIsAddTripModalOpen}>
        <DialogTrigger asChild>
          <Button>Add trips</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <Form {...addTrekForm}>
            <form onSubmit={addTrekForm.handleSubmit(handleFormSubmit)}>
              <DialogHeader>
                <DialogTitle>Add a New Trek</DialogTitle>
                <DialogDescription>
                  Fill in the details below to add a new trekking route.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
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
                          <Trash2 className="h-4 w-4" />
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
                      <Plus /> Add Permit
                    </Button>
                  </div>
                </div>

              </div>
              <DialogFooter>
                <Button type="submit" disabled={addTrekForm.formState.isSubmitting}>
                  {addTrekForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Trek
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <Button variant="outline" onClick={handleLogout}>
        <LogOut />
        Logout
      </Button>
    </header>
  );
}
