import { Sparkles, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface ComingSoonModalProps {
  open: boolean;
  feature: string;
  description?: string;
  onClose: () => void;
}

export function ComingSoonModal({
  open,
  feature,
  description,
  onClose,
}: ComingSoonModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-950/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="coming-soon-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-white/20 bg-white p-6 shadow-2xl shadow-navy-900/20"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
            <Sparkles className="h-5 w-5" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <h2 id="coming-soon-title" className="text-xl font-bold text-navy-900">
          Coming in a future phase
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {description ??
            `We're currently building ${feature.toLowerCase()}. For Phase 1 you can explore TruthHubBD, browse mock community content, and create your account.`}
        </p>

        <div className="mt-6 flex justify-end">
          <Button onClick={onClose}>Got it</Button>
        </div>
      </div>
    </div>
  );
}
