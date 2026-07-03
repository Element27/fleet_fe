import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock, Search, FileText, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../hooks/useStore';
import { clsx } from 'clsx';

const REQUIRED_DOCS = [
  { type: 'invoice', label: 'Invoice' },
  { type: 'registration', label: 'Reg. Cert' },
  { type: 'tracker', label: 'Tracker Cert' },
  { type: 'insurance', label: 'Insurance' },
  { type: 'delivery_note', label: 'Delivery Note' },
];

function DocStatus({ docs, type }: { docs: { type: string; status: string }[]; type: string }) {
  const doc = docs.find(d => d.type === type);
  if (!doc) return <div className="flex justify-center"><div className="w-5 h-5 rounded-full border-2 border-dashed border-gray-200" /></div>;
  if (doc.status === 'approved') return <div className="flex justify-center"><CheckCircle2 size={16} className="text-green-600" /></div>;
  if (doc.status === 'rejected') return <div className="flex justify-center"><XCircle size={16} className="text-red-500" /></div>;
  return <div className="flex justify-center"><Clock size={16} className="text-amber-500" /></div>;
}

export function DocumentChecklistPage() {
  const { vehicles } = useStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'incomplete' | 'rejected'>('all');

  const enriched = vehicles.map(v => {
    const totalRequired = REQUIRED_DOCS.length;
    const approved = REQUIRED_DOCS.filter(r => v.documents.some(d => d.type === r.type && d.status === 'approved')).length;
    const hasRejected = v.documents.some(d => d.status === 'rejected');
    const complete = approved === totalRequired;
    const pct = Math.round((approved / totalRequired) * 100);
    return { ...v, approved, totalRequired, hasRejected, complete, pct };
  });

  const filtered = enriched.filter(v => {
    const matchSearch = !search || [v.registration, v.vehicleMake, v.vehicleModel, v.customerName, v.caseRef]
      .some(f => f?.toLowerCase().includes(search.toLowerCase()));
    const matchFilter =
      filter === 'all' ? true :
      filter === 'incomplete' ? !v.complete :
      filter === 'rejected' ? v.hasRejected : true;
    return matchSearch && matchFilter;
  });

  const stats = {
    complete: enriched.filter(v => v.complete).length,
    incomplete: enriched.filter(v => !v.complete).length,
    rejected: enriched.filter(v => v.hasRejected).length,
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">Document Checklist</h1>
        <p className="text-gray-500 text-sm mt-1">Required documents status across all active cases.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Fully complete', value: stats.complete, color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
          { label: 'Incomplete', value: stats.incomplete, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
          { label: 'Has rejections', value: stats.rejected, color: 'text-red-600', bg: 'bg-red-50 border-red-100' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={clsx('card border p-5', bg)}>
            <div className={clsx('text-3xl font-bold', color)}>{value}</div>
            <div className="text-sm text-gray-600 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-8 bg-white text-sm" placeholder="Search case, vehicle, borrower…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-0.5">
          {[{ k: 'all', l: 'All' }, { k: 'incomplete', l: 'Incomplete' }, { k: 'rejected', l: 'Rejected' }].map(({ k, l }) => (
            <button key={k} onClick={() => setFilter(k as any)}
              className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                filter === k ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-700')}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="grid text-xs font-semibold text-gray-400 uppercase tracking-wider p-4 border-b border-gray-100"
          style={{ gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 1fr 1fr 2fr 1fr' }}>
          <div>Case</div>
          <div>Vehicle</div>
          {REQUIRED_DOCS.map(d => <div key={d.type} className="text-center">{d.label}</div>)}
          <div>Progress</div>
          <div />
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FileText size={36} className="text-gray-200 mx-auto mb-3" />
            <div className="text-sm text-gray-400">No cases match your filters.</div>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((v, i) => (
              <div key={v.id}
                className={clsx('grid items-center p-4 hover:bg-gray-50 transition-colors group', i % 2 === 1 ? 'bg-gray-50/30' : '')}
                style={{ gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 1fr 1fr 2fr 1fr' }}>
                <div>
                  <div className="text-xs font-mono text-gray-400">{v.caseRef}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{v.customerName}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{v.vehicleMake} {v.vehicleModel}</div>
                  <div className="text-xs text-gray-400 font-mono">{v.registration}</div>
                </div>
                {REQUIRED_DOCS.map(req => (
                  <DocStatus key={req.type} docs={v.documents} type={req.type} />
                ))}
                <div>
                  <div className="text-xs font-bold text-gray-700 mb-1">{v.pct}%</div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={clsx('h-full rounded-full transition-all',
                      v.pct === 100 ? 'bg-green-500' : v.hasRejected ? 'bg-red-400' : 'bg-amber-400')}
                      style={{ width: `${v.pct}%` }} />
                  </div>
                </div>
                <div>
                  <button onClick={() => navigate(`/vehicles/${v.id}`)}
                    className="btn-secondary text-xs px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    View <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-4 text-xs text-gray-400">
        <span className="font-medium text-gray-500">Key:</span>
        <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-green-600" /> Approved</span>
        <span className="flex items-center gap-1"><Clock size={12} className="text-amber-500" /> Pending review</span>
        <span className="flex items-center gap-1"><XCircle size={12} className="text-red-500" /> Rejected</span>
        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full border-2 border-dashed border-gray-300" /> Not uploaded</span>
      </div>
    </div>
  );
}
