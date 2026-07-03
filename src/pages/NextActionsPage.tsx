import { useNavigate } from 'react-router-dom';
import { Zap, Clock, AlertTriangle, CheckCircle2, ArrowRight, ShieldCheck, Archive, FileText } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { STAGES, getRAGStatus } from '../data/store';
import { clsx } from 'clsx';
import { formatDistanceToNow, isPast } from 'date-fns';

const RAG_STYLES = {
  red:   { bg: 'bg-red-50 border-red-200',    badge: 'bg-red-100 text-red-700',   dot: 'bg-red-500',   label: 'Overdue',       icon: AlertTriangle },
  amber: { bg: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', label: 'Due Soon',    icon: Clock },
  green: { bg: 'bg-white border-gray-100',     badge: 'bg-green-100 text-green-700', dot: 'bg-green-500', label: 'On Track',   icon: CheckCircle2 },
};

const STAGE_NEXT_ACTION: Record<string, { action: string; who: string; icon: any; href: (id: string) => string }> = {
  dealer_handover:       { action: 'Upload registration documents', who: 'Dealer', icon: FileText, href: id => `/vehicles/${id}` },
  collateral_inspection: { action: 'Verify registration documents', who: 'Collateral Manager', icon: FileText, href: id => `/vehicles/${id}` },
  tracker_installation:  { action: 'Upload tracker installation cert', who: 'Tracking Firm', icon: FileText, href: id => `/vehicles/${id}` },
  insurance_activation:  { action: 'Upload insurance certificate', who: 'Insurance Company', icon: FileText, href: id => `/vehicles/${id}` },
  release_approval:      { action: 'Approve vehicle for release', who: 'Collateral Manager', icon: ShieldCheck, href: id => `/release/${id}` },
  vehicle_delivery:      { action: 'Upload signed delivery note', who: 'Dealer', icon: FileText, href: id => `/vehicles/${id}` },
  documents_collection:  { action: 'Confirm original documents received', who: 'Collateral Manager', icon: Archive, href: id => `/documents-collection/${id}` },
};

export function NextActionsPage() {
  const { vehicles } = useStore();
  const navigate = useNavigate();

  const active = vehicles.filter(v => v.currentStage !== 'completed');
  const withRAG = active.map(v => ({
    ...v,
    rag: getRAGStatus(v.currentStage, v.updatedAt),
    stageMeta: STAGES.find(s => s.key === v.currentStage),
    nextAction: STAGE_NEXT_ACTION[v.currentStage],
    dueNotif: v.notifications.find(n => n.dueDate && !n.read),
  })).sort((a, b) => {
    const order = { red: 0, amber: 1, green: 2 };
    return order[a.rag] - order[b.rag];
  });

  const counts = { red: withRAG.filter(v => v.rag === 'red').length, amber: withRAG.filter(v => v.rag === 'amber').length, green: withRAG.filter(v => v.rag === 'green').length };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-7">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Zap size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Next Actions</h1>
          <p className="text-gray-500 text-sm mt-0.5">Prioritised view of all cases requiring immediate attention.</p>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-7">
        {[
          { label: 'Overdue', count: counts.red, color: 'text-red-600', bg: 'bg-red-50 border-red-200', dot: 'bg-red-500' },
          { label: 'Due Soon', count: counts.amber, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
          { label: 'On Track', count: counts.green, color: 'text-green-600', bg: 'bg-green-50 border-green-200', dot: 'bg-green-500' },
        ].map(({ label, count, color, bg, dot }) => (
          <div key={label} className={clsx('card border p-5 flex items-center gap-4', bg)}>
            <div className={clsx('w-3 h-3 rounded-full shrink-0', dot)} />
            <div>
              <div className={clsx('text-3xl font-bold', color)}>{count}</div>
              <div className="text-sm text-gray-600">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Action table */}
      {withRAG.length === 0 ? (
        <div className="card p-16 text-center">
          <CheckCircle2 size={48} className="text-green-400 mx-auto mb-3" />
          <div className="text-base font-semibold text-gray-900 mb-1">All clear</div>
          <div className="text-sm text-gray-400">No active cases requiring attention.</div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100 grid grid-cols-12 gap-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <div className="col-span-1">Status</div>
            <div className="col-span-2">Case</div>
            <div className="col-span-2">Vehicle</div>
            <div className="col-span-2">Stage</div>
            <div className="col-span-3">Next Action</div>
            <div className="col-span-1">Due</div>
            <div className="col-span-1" />
          </div>
          <div className="divide-y divide-gray-50">
            {withRAG.map(v => {
              const styles = RAG_STYLES[v.rag];
              const Icon = styles.icon;
              const ActionIcon = v.nextAction?.icon || ArrowRight;
              const dueDate = v.dueNotif?.dueDate;
              const isOverdue = dueDate ? isPast(new Date(dueDate)) : false;
              return (
                <div key={v.id}
                  className={clsx('grid grid-cols-12 gap-3 p-4 items-center hover:bg-gray-50 transition-colors group', isOverdue ? 'bg-red-50/30' : '')}>
                  <div className="col-span-1">
                    <div className="flex items-center gap-1.5">
                      <div className={clsx('w-2 h-2 rounded-full shrink-0', styles.dot)} />
                      <span className={clsx('badge text-xs hidden sm:inline', styles.badge)}>{styles.label}</span>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-xs font-mono text-gray-500">{v.caseRef}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{v.customerName}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm font-medium text-gray-900">{v.vehicleMake} {v.vehicleModel}</div>
                    <div className="text-xs text-gray-400 font-mono">{v.registration}</div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-gray-700 font-medium">{v.stageMeta?.label}</span>
                    <div className="text-xs text-gray-400 mt-0.5">{v.stageMeta?.owner}</div>
                  </div>
                  <div className="col-span-3 flex items-center gap-2">
                    <ActionIcon size={13} className="text-gray-400 shrink-0" />
                    <span className="text-xs text-gray-700">{v.nextAction?.action || '—'}</span>
                  </div>
                  <div className="col-span-1">
                    {dueDate ? (
                      <span className={clsx('text-xs font-medium', isOverdue ? 'text-red-600' : 'text-amber-600')}>
                        {isOverdue ? 'Overdue' : formatDistanceToNow(new Date(dueDate), { addSuffix: true })}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button onClick={() => navigate(v.nextAction?.href(v.id) || `/vehicles/${v.id}`)}
                      className="btn-secondary text-xs px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      Act <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-5 mt-5 text-xs text-gray-400">
        <span className="font-medium text-gray-500">Legend:</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Overdue — SLA breached</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Due within 24 hours</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Within SLA window</span>
      </div>
    </div>
  );
}
