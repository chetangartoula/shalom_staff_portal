import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/shadcn/card";
import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import { DatePicker } from "@/components/ui/shadcn/date-picker";
import { Textarea } from "@/components/ui/shadcn/textarea";
import { Mail, Phone, Building, Users, MessageSquare } from 'lucide-react';
import { Checkbox } from '@/components/ui/shadcn/checkbox';

interface GroupDetailsStepProps {
  groupName: string;
  onGroupNameChange: (name: string) => void;
  groupSize: number;
  onGroupSizeChange: (size: number) => void;
  startDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  clientCommunicationMethod?: string;
  onClientCommunicationMethodChange?: (method: string) => void;
}

function GroupDetailsStepComponent({
  groupName,
  onGroupNameChange,
  groupSize,
  onGroupSizeChange,
  startDate,
  onStartDateChange,
  clientCommunicationMethod = '',
  onClientCommunicationMethodChange = () => {}
}: GroupDetailsStepProps) {
  // Handle communication method changes for radio button behavior
  const handleCommunicationMethodChange = (method: string) => {
    if (!onClientCommunicationMethodChange) return;
    
    // For radio button behavior, we only store the selected method
    // For "Other" option with notes, we need special handling
    if (method === 'Other' && clientCommunicationMethod?.startsWith('Other:')) {
      // If selecting "Other" again and we already have notes, preserve them
      onClientCommunicationMethodChange(clientCommunicationMethod);
    } else {
      onClientCommunicationMethodChange(method);
    }
  };

  // Check if a method is selected
  const isMethodSelected = (method: string) => {
    if (method === 'Other') {
      // For "Other" option, check if it's selected either as plain "Other" or with notes
      return clientCommunicationMethod === 'Other' || clientCommunicationMethod?.startsWith('Other:');
    }
    return clientCommunicationMethod === method;
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
                        onCheckedChange={(checked) => checked && handleCommunicationMethodChange('Email')}
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
                        onCheckedChange={(checked) => checked && handleCommunicationMethodChange('WhatsApp')}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor="send-whatsapp"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                        >
                          <Phone className="h-4 w-4" /> Client communicated via WhatsApp
                        </label>
                      </div>
                    </div>
                     <div className="flex items-center space-x-3">
                      <Checkbox 
                        id="send-office" 
                        checked={isMethodSelected('office')}
                        onCheckedChange={(checked) => checked && handleCommunicationMethodChange('office')}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor="send-office"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                        >
                          <Building className="h-4 w-4" /> Client communicated via Office
                        </label>
                      </div>
                    </div>
                     <div className="flex items-center space-x-3">
                      <Checkbox 
                        id="send-recommended" 
                        checked={isMethodSelected('Recommended by Guide')}
                        onCheckedChange={(checked) => checked && handleCommunicationMethodChange('Recommended by Guide')}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor="send-recommended"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                        >
                          <Users className="h-4 w-4" /> Recommended by Guide
                        </label>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        id="send-other" 
                        checked={isMethodSelected('Other')}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleCommunicationMethodChange('Other');
                          } else {
                            // When unchecking, clear the selection
                            onClientCommunicationMethodChange('');
                          }
                        }}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor="send-other"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                        >
                          <MessageSquare className="h-4 w-4" /> Other
                        </label>
                      </div>
                    </div>
                    {/* Additional notes field */}
                    <div className="grid gap-2 mt-4">
                      <Label htmlFor="communication-notes">Remarks / Notes / Reference</Label>
                      <Textarea
                        id="communication-notes"
                        placeholder="Add any additional remarks, notes, or references about client communication..."
                        value={clientCommunicationMethod?.startsWith('Other:') ? clientCommunicationMethod.substring(6) : ''}
                        onChange={(e) => {
                          const otherMethod = `Other:${e.target.value}`;
                          onClientCommunicationMethodChange(otherMethod);
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