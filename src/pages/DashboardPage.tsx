import { useNavigate } from 'react-router-dom';
import { Car, CheckCircle2, Clock, AlertTriangle, FileText, Zap, ArrowRight } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { STAGES, getRAGStatus } from '../data/store';
import { clsx } from 'clsx';
import { formatDistanceToNow } from 'date-fns';

const RAG_COLORS: Record<string, string> = {
  green: 'bg-status-greenBg text-status-green',
  amber: 'bg-status-amberBg text-status-amber',
  red: 'bg-status-redBg text-status-red',
};

const RAG_DOT: Record<string, string> = {
  green: 'bg-green-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
};

export function DashboardPage() {
  const { vehicles, notifications } = useStore();
  const navigate = useNavigate();

  const total = vehicles.length;
  const completed = vehicles.filter(v => v.currentStage === 'completed').length;
  const inProgress = vehicles.filter(v => v.status === 'active').length;
  const flagged = vehicles.filter(v => v.status === 'flagged').length;
  const totalValue = vehicles.reduce((sum, v) => sum + v.assetValue, 0);
  const totalDocs = vehicles.reduce((sum, v) => sum + v.documents.length, 0);

  const stageCounts = STAGES.map(s => ({
    ...s,
    count: vehicles.filter(v => v.currentStage === s.key).length,
  }));

  const recentVehicles = [...vehicles].slice(0, 5);
  const unreadNotifs = notifications.filter(n => !n.read);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of disbursed assets and compliance status.</p>
      </div>

      {/* Next Actions banner */}
      {(() => {
        const overdue = vehicles.filter(v => v.currentStage !== 'completed' && getRAGStatus(v.currentStage, v.updatedAt) === 'red').length;
        const dueSoon = vehicles.filter(v => v.currentStage !== 'completed' && getRAGStatus(v.currentStage, v.updatedAt) === 'amber').length;
        if (overdue === 0 && dueSoon === 0) return null;
        return (
          <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-2xl px-5 py-4 mb-6">
            <div className="flex items-center gap-3">
              <Zap size={18} className="text-red-600 shrink-0" />
              <div>
                <div className="text-sm font-semibold text-red-900">
                  {overdue > 0 ? `${overdue} case${overdue > 1 ? 's' : ''} overdue` : `${dueSoon} case${dueSoon > 1 ? 's' : ''} due soon`}
                </div>
                <div className="text-xs text-red-600 mt-0.5">Immediate action required to meet SLA targets.</div>
              </div>
            </div>
            <button onClick={() => navigate('/next-actions')} className="flex items-center gap-1.5 text-sm font-medium text-red-700 hover:text-red-900 transition-colors">
              View Next Actions <ArrowRight size={14} />
            </button>
          </div>
        );
      })()}

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4 mb-7">
        {[
          { icon: Car, label: 'Vehicles', value: total, color: 'text-primary' },
          { icon: CheckCircle2, label: 'Completed', value: completed, color: 'text-green-600' },
          { icon: Clock, label: 'In progress', value: inProgress, color: 'text-blue-600' },
          { icon: AlertTriangle, label: 'Flagged / Hold', value: flagged, color: 'text-amber-600' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card p-5">
            <Icon size={20} className={clsx('mb-3', color)} />
            <div className="text-3xl font-bold text-gray-900 mb-0.5">{value}</div>
            <div className="text-sm text-gray-500">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5 mb-5">
        {/* Workflow pipeline */}
        <div className="card p-6 col-span-2">
          <h2 className="text-sm font-semibold text-gray-900 mb-5">Workflow pipeline</h2>
          <div className="space-y-3">
            {stageCounts.map(s => {
              const pct = total > 0 ? (s.count / total) * 100 : 0;
              return (
                <div key={s.key}>
                  <div className="flex justify-between items-center mb-1.5">
                    <div>
                      <span className="text-sm font-medium text-gray-800">{s.label}</span>
                      <span className="ml-2 text-xs text-gray-400">{s.owner}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{s.count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* At a glance */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-5">At a glance</h2>
          <div className="mb-5">
            <div className="text-xs text-gray-500 mb-1">Total asset value</div>
            <div className="text-2xl font-bold text-gray-900 font-mono">
              {totalValue.toLocaleString()}
            </div>
          </div>
          <div className="mb-5">
            <div className="text-xs text-gray-500 mb-1">Documents on file</div>
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-primary" />
              <span className="text-xl font-bold text-gray-900">{totalDocs}</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-2">Pending actions</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-sm text-gray-700">{unreadNotifs.length} unread alerts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent vehicles */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-gray-900">Recent vehicles</h2>
          <button onClick={() => navigate('/vehicles')} className="text-xs text-primary hover:underline font-medium">
            View all
          </button>
        </div>
        {recentVehicles.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            No vehicles yet. <button onClick={() => navigate('/vehicles')} className="text-primary hover:underline">Add the first one.</button>
          </div>
        ) : (
          <div className="space-y-2">
            {recentVehicles.map(v => {
              const rag = getRAGStatus(v.currentStage, v.updatedAt);
              const stageMeta = STAGES.find(s => s.key === v.currentStage);
              return (
                <div key={v.id} onClick={() => navigate(`/vehicles/${v.id}`)}
                  className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className={clsx('w-2 h-2 rounded-full shrink-0', RAG_DOT[rag])} />
                    <div>
                      <span className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors">
                        {v.registration} · {v.vehicleMake} {v.vehicleModel}
                      </span>
                      <div className="text-xs text-gray-400">{v.customerName} · {formatDistanceToNow(new Date(v.updatedAt))} ago</div>
                    </div>
                  </div>
                  <span className={clsx('badge', RAG_COLORS[rag])}>{stageMeta?.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
