import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/shadcn/card";
import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import { DatePicker } from "@/components/ui/shadcn/date-picker";

interface GroupDetailsStepProps {
  groupName: string;
  onGroupNameChange: (name: string) => void;
  groupSize: number;
  onGroupSizeChange: (size: number) => void;
  startDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
}

function GroupDetailsStepComponent({
  groupName,
  onGroupNameChange,
  groupSize,
  onGroupSizeChange,
  startDate,
  onStartDateChange
}: GroupDetailsStepProps) {
  return (
      <Card>
          <CardHeader><CardTitle>Group Details</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-6">
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
          </CardContent>
      </Card>
  );
};

export const GroupDetailsStep = memo(GroupDetailsStepComponent);
