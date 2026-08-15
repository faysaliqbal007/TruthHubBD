import { Loader2 } from 'lucide-react';

export function LoadingScreen({ message = 'Loading TruthHubBD...' }: { message?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-500">
      <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
