
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";

interface GroupDetailsStepProps {
  groupSize: number;
  onGroupSizeChange: (size: number) => void;
  startDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
}

export function GroupDetailsStep({
  groupSize,
  onGroupSizeChange,
  startDate,
  onStartDateChange
}: GroupDetailsStepProps) {
  return (
    <div className="space-y-8">
      <Card className="shadow-none border-none">
          <CardHeader className="px-0"><CardTitle>Group Details</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6 p-0">
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
    </div>
  );
};

    