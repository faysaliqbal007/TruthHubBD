import { Link } from 'react-router-dom';
import { ArrowRight, ShieldAlert } from 'lucide-react';
import type { ScamAlert } from '../../types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { formatDate } from '../../lib/utils';

export function ScamAlertCard({ alert }: { alert: ScamAlert }) {
  return (
    <Card hover className="overflow-hidden">
      <div className="border-b border-coral-100 bg-coral-50/60 px-5 py-3">
        <div className="flex items-center justify-between gap-3">
          <Badge variant="warning">{alert.status}</Badge>
          <span className="text-xs text-slate-500">{formatDate(alert.reportedDate)}</span>
        </div>
      </div>
      <div className="space-y-3 p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-coral-100 p-2 text-coral-700">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-navy-900">{alert.entityName}</h3>
            <p className="text-sm text-slate-500">{alert.category} · {alert.location}</p>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-slate-600">{alert.summary}</p>
        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          {alert.reportedAmount ? <span>Reported: {alert.reportedAmount}</span> : null}
          <span>Evidence: {alert.evidenceStatus}</span>
        </div>
        <Link
          to={`/scam-alerts/${alert.slug}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-coral-700 hover:text-coral-800"
        >
          View Case
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </Card>
  );
}
