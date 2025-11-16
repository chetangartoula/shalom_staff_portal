"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

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
  return (
    <nav aria-label="Progress" className="w-full">
      <ol role="list" className="flex items-center">
        {steps.map((step, stepIdx) => (
          <li key={step.id} className="relative flex flex-1 items-center justify-center">
            {stepIdx < steps.length - 1 ? (
              <div
                className={cn(
                  "absolute left-0 top-5 -z-10 h-0.5 w-full",
                  stepIdx < currentStep ? "bg-primary/30" : "bg-gray-200"
                )}
                aria-hidden="true"
              />
            ) : null}
            <button
              onClick={() => setCurrentStep(stepIdx)}
              className={cn("group flex flex-col items-center text-center space-y-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md p-2 transition-colors",
                  stepIdx > currentStep && "cursor-not-allowed opacity-50"
              )}
              disabled={stepIdx > currentStep}
            >
              <span
                  className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors border-2 bg-background",
                  stepIdx === currentStep
                      ? "bg-primary text-primary-foreground border-primary ring-2 ring-offset-2 ring-primary"
                      : stepIdx < currentStep
                      ? "bg-primary/20 text-primary border-primary/30"
                      : "bg-gray-100 text-gray-600 border-gray-300 group-hover:bg-gray-200 group-hover:border-gray-400"
                  )}
              >
                  {stepIdx < currentStep ? <Check className="h-6 w-6" /> : step.isCustom ? "..." : String(stepIdx + 1).padStart(2, '0')}
              </span>
              <span className={cn(
                  "text-xs sm:text-sm font-medium transition-colors text-center max-w-20 truncate",
                  stepIdx === currentStep ? "text-primary" : "text-gray-500 group-hover:text-gray-700"
              )}>{step.name}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
