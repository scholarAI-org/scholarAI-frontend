import { Check } from 'lucide-react';
import type { ProfileStep } from './types';

interface StepperProps {
  steps: ProfileStep[];
  onStepClick?: (stepId: string) => void;
}

function StepSymbol({ step }: { step: ProfileStep }) {
  const isCompleted = step.status === 'completed';
  const isActive = step.status === 'active';

  return (
    <span
      className={[
        'flex h-8 w-8 items-center justify-center rounded-full border text-sm font-medium transition-colors',
        isCompleted && 'border-[#f97316] bg-[#f97316] text-white',
        isActive && 'border-[#f97316] bg-white text-[#f97316]',
        step.status === 'upcoming' && 'border-[#e2e8f0] bg-white text-[#979797]',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {isCompleted ? <Check className="h-4 w-4" /> : step.number}
    </span>
  );
}

export default function Stepper({ steps, onStepClick }: StepperProps) {
  return (
    <ol className="flex w-full min-h-24 items-center justify-between rounded-3xl border border-[#e2e8f0] bg-white px-2 sm:px-6 py-4 shadow-[0_4px_16px_rgba(15,23,42,0.02)]">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;

        return (
          <li key={step.id} className={`flex items-center ${isLast ? '' : 'w-full flex-1'}`}>
            <button
              type="button"
              onClick={() => onStepClick?.(step.id)}
              className="flex min-w-[52px] shrink-0 cursor-pointer flex-col items-center gap-2 transition-opacity hover:opacity-80 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              <StepSymbol step={step} />
              <span
                className={[
                  'max-w-[112px] text-center text-[10px] sm:text-xs leading-4 sm:leading-5',
                  step.status === 'completed' && 'font-medium text-[#f97316]',
                  step.status === 'active' && 'font-medium text-[#f97316]',
                  step.status === 'upcoming' && 'text-[#465668]',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {step.label}
              </span>
            </button>
            {!isLast && <span className="mx-2 mb-7 h-px w-full bg-[#e2e8f0]" />}
          </li>
        );
      })}
    </ol>
  );
}
