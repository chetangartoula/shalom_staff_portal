
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
      <ol role="list" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        {steps.map((step, stepIdx) => (
          <li key={step.id} className="flex items-center">
            <button
              onClick={() => setCurrentStep(stepIdx)}
              className="group flex flex-col items-center text-center space-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md p-1"
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
                  stepIdx === currentStep
                    ? "bg-primary text-primary-foreground"
                    : stepIdx < currentStep
                    ? "bg-primary/20 text-primary"
                    : "bg-gray-200 text-gray-500 group-hover:bg-gray-300"
                )}
              >
                {stepIdx < currentStep ? <Check className="h-5 w-5" /> : step.isCustom ? "..." : stepIdx + 1}
              </span>
              <span className={cn(
                "text-xs sm:text-sm font-medium transition-colors",
                 stepIdx === currentStep ? "text-primary" : "text-gray-500 group-hover:text-gray-700"
              )}>{step.name}</span>
            </button>

            {stepIdx < steps.length - 1 && (
              <div className="hidden sm:block h-px w-8 md:w-16 bg-gray-200 ml-4" />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

    