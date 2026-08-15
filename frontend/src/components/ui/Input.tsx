import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, id, ...props }, ref) => (
    <div className="space-y-1.5">
      <input
        ref={ref}
        id={id}
        className={cn(
          'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-navy-900 placeholder:text-slate-400 transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20',
          error && 'border-coral-400 focus:border-coral-500 focus:ring-coral-500/20',
          className,
        )}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} className="text-sm text-coral-600">
          {error}
        </p>
      ) : null}
    </div>
  ),
);

Input.displayName = 'Input';
