import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/shadcn/card";
import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import { DatePicker } from "@/components/ui/shadcn/date-picker";
import { Textarea } from "@/components/ui/shadcn/textarea"; // Add this import
import { Mail, MessageSquare } from 'lucide-react'; // Add this import
import { Checkbox } from '@/components/ui/shadcn/checkbox'; // Add this import

interface GroupDetailsStepProps {
  groupName: string;
  onGroupNameChange: (name: string) => void;
  groupSize: number;
  onGroupSizeChange: (size: number) => void;
  startDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  clientCommunicationMethod?: string; // Add this prop
  onClientCommunicationMethodChange?: (method: string) => void; // Add this prop
}

function GroupDetailsStepComponent({
  groupName,
  onGroupNameChange,
  groupSize,
  onGroupSizeChange,
  startDate,
  onStartDateChange,
  clientCommunicationMethod = '', // Add this prop
  onClientCommunicationMethodChange = () => {} // Add this prop
}: GroupDetailsStepProps) {
  // Handle communication method changes
  const handleCommunicationMethodChange = (method: string, checked: boolean) => {
    if (!onClientCommunicationMethodChange) return;
    
    let newMethods = clientCommunicationMethod ? clientCommunicationMethod.split(',').map(m => m.trim()) : [];
    
    if (checked) {
      if (!newMethods.includes(method)) {
        newMethods.push(method);
      }
    } else {
      newMethods = newMethods.filter(m => m !== method);
    }
    
    onClientCommunicationMethodChange(newMethods.join(', '));
  };

  // Check if a method is selected
  const isMethodSelected = (method: string) => {
    if (!clientCommunicationMethod) return false;
    return clientCommunicationMethod.split(',').map(m => m.trim()).includes(method);
  };

  return (
      <Card>
          <CardHeader><CardTitle>Group Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="grid gap-2">
                  <Label htmlFor="group-name">Group Name</Label>
                  <Input
                    id="group-name"
                    type="text"
                    placeholder="e.g. 'Family Trip to Manaslu'"
                    value={groupName}
                    onChange={(e) => onGroupNameChange(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="group-size">Group Size</Label>
                  <Input
                    id="group-size"
                    type="number"
                    value={groupSize}
                    onChange={(e) => onGroupSizeChange(Number(e.target.value))}
                    min="1"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <DatePicker date={startDate} setDate={onStartDateChange} />
                </div>
                
                {/* Client Communication Method Section */}
                <div className="md:col-span-3">
                  <Label>Client Communication Method</Label>
                  <div className="mt-2 space-y-4">
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        id="send-email" 
                        checked={isMethodSelected('Email')}
                        onCheckedChange={(checked) => handleCommunicationMethodChange('Email', !!checked)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor="send-email"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                        >
                          <Mail className="h-4 w-4" /> Client communicated via Email
                        </label>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        id="send-whatsapp" 
                        checked={isMethodSelected('WhatsApp')}
                        onCheckedChange={(checked) => handleCommunicationMethodChange('WhatsApp', !!checked)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor="send-whatsapp"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                        >
                          <MessageSquare className="h-4 w-4" /> Client communicated via WhatsApp
                        </label>
                      </div>
                    </div>
                     <div className="flex items-center space-x-3">
                      <Checkbox 
                        id="send-whatsapp" 
                        checked={isMethodSelected('office')}
                        onCheckedChange={(checked) => handleCommunicationMethodChange('office', !!checked)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor="send-office"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                        >
                          <MessageSquare className="h-4 w-4" /> Client communicated via Office
                        </label>
                      </div>
                    </div>
                     <div className="flex items-center space-x-3">
                      <Checkbox 
                        id="send-recomanded" 
                        checked={isMethodSelected('Other')}
                        onCheckedChange={(checked) => handleCommunicationMethodChange('Other', !!checked)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor="send-recomanded"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                        >
                          <MessageSquare className="h-4 w-4" /> Recomanded by Guide
                        </label>
                      </div>
                    </div>
                    {/* Additional notes field */}
                    <div className="grid gap-2 mt-4">
                      <Label htmlFor="communication-notes">Remarks / Notes / Reference</Label>
                      <Textarea
                        id="communication-notes"
                        placeholder="Add any additional remarks, notes, or references about client communication..."
                        value={clientCommunicationMethod.includes('Other:') ? clientCommunicationMethod.split('Other:')[1] || '' : ''}
                        onChange={(e) => {
                          const otherMethod = `Other:${e.target.value}`;
                          let methods = clientCommunicationMethod ? clientCommunicationMethod.split(',').filter(m => !m.includes('Other:')).map(m => m.trim()) : [];
                          if (e.target.value) {
                            methods.push(otherMethod);
                          }
                          onClientCommunicationMethodChange(methods.join(', '));
                        }}
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                </div>
          </CardContent>
      </Card>
  );
};

export const GroupDetailsStep = memo(GroupDetailsStepComponent);