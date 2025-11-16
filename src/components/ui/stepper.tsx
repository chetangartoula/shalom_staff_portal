"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  id: string;
  name: string;
  isCustom?: boolean;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  setCurrentStep: (step: number) => void;
}

export function Stepper({ steps, currentStep, setCurrentStep }: StepperProps) {
  const progress = (currentStep / (steps.length - 1)) * 100;

  return (
    <div className="w-full space-y-4">
      <ol role="list" className="flex items-center justify-between">
        {steps.map((step, stepIdx) => (
          <li key={step.id} className="flex-1 last:flex-none">
            <button
              onClick={() => setCurrentStep(stepIdx)}
              className={cn(
                "group flex w-full items-center gap-x-2 p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md",
                stepIdx > currentStep && "cursor-not-allowed"
              )}
              disabled={stepIdx > currentStep}
            >
              <span className="flex items-center text-sm font-medium">
                <span
                  className={cn(
                    "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
                    stepIdx === currentStep
                      ? "bg-primary text-primary-foreground"
                      : stepIdx < currentStep
                      ? "bg-primary/30 text-primary"
                      : "bg-gray-200 text-gray-600 group-hover:bg-gray-300"
                  )}
                >
                  {stepIdx < currentStep ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span
                      className={cn(
                        stepIdx === currentStep ? "text-primary-foreground" : "text-muted-foreground"
                      )}
                    >
                      {String(stepIdx + 1).padStart(2, '0')}
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    "ml-2 hidden text-sm font-medium md:block",
                    stepIdx === currentStep
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                >
                  {step.name}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ol>

      <div className="relative pt-2">
        <div className="h-1.5 w-full rounded-full bg-gray-200">
          <div
            className="h-1.5 rounded-full bg-primary transition-all duration-300 ease-in-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
