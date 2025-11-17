
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
  disabled?: boolean;
}

export function Stepper({ steps, currentStep, setCurrentStep, disabled = false }: StepperProps) {

  return (
      <div className="w-full">
        <ol role="list" className="flex items-center justify-between">
            {steps.map((step, stepIdx) => (
            <li key={step.id} className="relative flex-1">
                {stepIdx !== 0 && (
                <div
                    className={cn(
                        "absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-full",
                        stepIdx <= currentStep ? "bg-primary" : "bg-border"
                    )}
                    aria-hidden="true"
                />
                )}
                <button
                onClick={() => !disabled && setCurrentStep(stepIdx)}
                className={cn(
                    "relative group flex flex-col items-center gap-y-2 p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md w-full",
                    disabled && "cursor-not-allowed"
                )}
                disabled={disabled}
                >
                <span className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                    stepIdx === currentStep
                        ? "bg-primary text-primary-foreground"
                        : stepIdx < currentStep
                        ? "bg-primary/80 text-primary-foreground"
                        : "bg-muted text-muted-foreground group-hover:bg-accent"
                )}>
                    {stepIdx < currentStep ? (
                    <Check className="h-5 w-5" />
                    ) : (
                    <span className={cn(stepIdx === currentStep && "font-bold")}>{stepIdx + 1}</span>
                    )}
                </span>
                <span
                    className={cn(
                    "hidden text-xs font-medium text-center md:block",
                    stepIdx === currentStep
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                >
                    {step.name}
                </span>
                </button>
            </li>
            ))}
        </ol>
    </div>
  );
}
