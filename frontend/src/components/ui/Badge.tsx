import { BadgeCheck, ShieldAlert } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'verified' | 'warning' | 'muted';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
        variant === 'default' && 'bg-teal-50 text-teal-700 ring-1 ring-teal-100',
        variant === 'verified' && 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100',
        variant === 'warning' && 'bg-coral-50 text-coral-700 ring-1 ring-coral-100',
        variant === 'muted' && 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
        className,
      )}
    >
      {variant === 'verified' ? <BadgeCheck className="h-3.5 w-3.5" /> : null}
      {variant === 'warning' ? <ShieldAlert className="h-3.5 w-3.5" /> : null}
      {children}
    </span>
  );
}
