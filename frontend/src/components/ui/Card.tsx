import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className, hover = false }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm shadow-slate-900/5 backdrop-blur-sm',
        hover && 'transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-900/10',
        className,
      )}
    >
      {children}
    </div>
  );
}
