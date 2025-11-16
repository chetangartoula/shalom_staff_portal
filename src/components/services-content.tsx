
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, MoreHorizontal, Trash2, Edit, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { AddServiceForm, type ServiceFormData } from '@/components/add-service-form';
import { formatCurrency } from '@/lib/utils';
import type { Service } from '@/lib/types';
import { Input } from '@/components/ui/input';

export function ServicesContent() {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const fetchServices = useCallback(async (pageNum: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/services?page=${pageNum}&limit=10`);
      if (!res.ok) throw new Error('Failed to fetch services');
      const data = await res.json();
      
      setServices(prev => pageNum === 1 ? data.services : [...prev, ...data.services]);
      setHasMore(data.hasMore);

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not load services.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    fetchServices(1);
  }, [fetchServices]);

  useEffect(() => {
    const results = services.filter(service =>
      service.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredServices(results);
  }, [searchTerm, services]);


  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchServices(nextPage);
  };
  
  const handleOpenServiceModal = (service: Service | null = null) => {
    setEditingService(service);
    setIsServiceModalOpen(true);
  }

  const handleServiceFormSubmit = async (data: ServiceFormData) => {
    setIsSubmitting(true);
    const url = editingService ? `/api/services/${editingService.id}` : '/api/services';
    const method = editingService ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${editingService ? 'update' : 'add'} service`);
      }

      const { service: savedService } = await response.json();
      
      if (editingService) {
        setServices(prev => prev.map(s => s.id === savedService.id ? savedService : s));
      } else {
        // Adding new service to the top of the list
        setServices(prev => [savedService, ...prev.filter(s => s.id !== savedService.id)]);
      }

      toast({
        title: 'Success!',
        description: `Service has been ${editingService ? 'updated' : 'added'}.`,
      });
      setIsServiceModalOpen(false);

    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: (error as Error).message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete service');
      }

      setServices(prev => prev.filter(s => s.id !== serviceId));
      toast({
        title: 'Success!',
        description: 'Service has been deleted.',
      });

    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: (error as Error).message,
      });
    }
  }

  return (
    <>
      <AddServiceForm 
        open={isServiceModalOpen}
        onOpenChange={setIsServiceModalOpen}
        onSubmit={handleServiceFormSubmit}
        isSubmitting={isSubmitting}
        defaultValues={editingService}
      />
      <Card className="shadow-sm">
        <CardHeader>
           <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                  <CardTitle>Manage Services</CardTitle>
                  <CardDescription>Add, edit, or remove services for cost calculation.</CardDescription>
              </div>
               <div className="flex items-center gap-2">
                  <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                          type="search"
                          placeholder="Search by service name..."
                          className="w-full sm:w-[300px] pl-8"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                      />
                  </div>
                  <Button onClick={() => handleOpenServiceModal()} className="shrink-0">
                      <Plus className="mr-2 h-4 w-4" /> Add Service
                  </Button>
              </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && page === 1 ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                  <TableHeader>
                      <TableRow>
                      <TableHead>Service Name</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Default Times</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {filteredServices.map((service) => (
                      <TableRow key={service.id}>
                          <TableCell className="font-medium">{service.name}</TableCell>
                          <TableCell>{formatCurrency(service.rate)}</TableCell>
                          <TableCell>{service.times}</TableCell>
                          <TableCell className="text-right">
                          <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                              </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenServiceModal(service)}>
                                  <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteService(service.id)} className="text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                              </DropdownMenuContent>
                          </DropdownMenu>
                          </TableCell>
                      </TableRow>
                      ))}
                  </TableBody>
              </Table>
               {filteredServices.length === 0 && !isLoading && (
                <div className="text-center p-8 text-muted-foreground">
                  No services found.
                </div>
              )}
            </div>
          )}
        </CardContent>
        {hasMore && !searchTerm && (
          <CardFooter className="justify-center">
            <Button onClick={handleLoadMore} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Load More
            </Button>
          </CardFooter>
        )}
      </Card>
      <Toaster />
    </>
  );
}
