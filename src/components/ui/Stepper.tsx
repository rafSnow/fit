import { Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
}

export const Stepper = ({ value, onChange, min = 0, max = 10, label }: StepperProps) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>}
      <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-900 rounded-lg p-1 w-fit border border-gray-100 dark:border-gray-800">
        <button
          type="button"
          onClick={() => value > min && onChange(value - 1)}
          className={cn(
            "h-8 w-8 flex items-center justify-center rounded-md transition-colors",
            value <= min ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-white hover:shadow-sm dark:text-gray-400 dark:hover:bg-gray-800"
          )}
          disabled={value <= min}
        >
          <Minus size={18} />
        </button>
        <span className="text-lg font-bold min-w-[2ch] text-center text-gray-900 dark:text-gray-100">
          {value}
        </span>
        <button
          type="button"
          onClick={() => value < max && onChange(value + 1)}
          className={cn(
            "h-8 w-8 flex items-center justify-center rounded-md transition-colors",
            value >= max ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-white hover:shadow-sm dark:text-gray-400 dark:hover:bg-gray-800"
          )}
          disabled={value >= max}
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
};
