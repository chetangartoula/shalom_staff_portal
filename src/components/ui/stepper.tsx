"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: string;
  name: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  setCurrentStep: (step: number) => void;
}

export function Stepper({ steps, currentStep, setCurrentStep }: StepperProps) {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center space-x-4">
        {steps.map((step, stepIdx) => (
          <li key={step.name} className="flex items-center">
            <button
              onClick={() => setCurrentStep(stepIdx)}
              className="flex flex-col items-center space-y-2"
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                  stepIdx === currentStep
                    ? "bg-primary text-primary-foreground"
                    : stepIdx < currentStep
                    ? "bg-primary/20 text-primary"
                    : "bg-gray-200 text-gray-500"
                )}
              >
                {stepIdx < currentStep ? <Check className="h-5 w-5" /> : stepIdx + 1}
              </span>
              <span className={cn(
                "text-sm font-medium",
                 stepIdx === currentStep ? "text-primary" : "text-gray-500"
              )}>{step.name}</span>
            </button>

            {stepIdx < steps.length - 1 && (
              <div className="h-px w-16 bg-gray-200 ml-4" />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
