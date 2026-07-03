import { useState } from 'react';
import { Shield, Search, Download, User, FileText, GitBranch, Lock, Archive } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { store } from '../data/store';
import { clsx } from 'clsx';
import { format } from 'date-fns';

const ENTITY_ICONS: Record<string, any> = {
  Vehicle: GitBranch, Document: FileText, Stage: GitBranch,
  Release: Shield, Closure: Lock, User: User,
};

const ENTITY_COLORS: Record<string, string> = {
  Vehicle: 'bg-blue-50 text-blue-600',
  Document: 'bg-purple-50 text-purple-600',
  Stage: 'bg-primary/10 text-primary',
  Release: 'bg-green-50 text-green-600',
  Closure: 'bg-gray-100 text-gray-600',
  User: 'bg-amber-50 text-amber-600',
};

const ACTION_BADGE: Record<string, string> = {
  'Stage Advanced': 'bg-blue-50 text-blue-700',
  'Case Opened': 'bg-primary/10 text-primary',
  'Document Uploaded': 'bg-purple-50 text-purple-700',
  'Document Approved': 'bg-green-50 text-green-700',
  'Document Rejected': 'bg-red-50 text-red-700',
  'Release Approved': 'bg-green-50 text-green-700',
  'Original Documents Confirmed': 'bg-teal-50 text-teal-700',
  'Case Closed': 'bg-gray-100 text-gray-700',
  'Escalation Triggered': 'bg-red-50 text-red-700',
  'User Created': 'bg-amber-50 text-amber-700',
  'Closure Confirmed by Credit Admin': 'bg-blue-50 text-blue-700',
};

// Map frontend entity filters to backend entityType + action prefixes
const ENTITY_BACKEND_MAP: Record<string, { entityType?: string; actions?: string[] }> = {
  Stage: { actions: ['CREATE_LOAN_CASE', 'ADVANCE_STAGE'] },
  Document: { entityType: 'document' },
  Release: { actions: ['RELEASE_APPROVED'] },
  Closure: { actions: ['DOCUMENTS_CONFIRMED', 'CLOSURE_CONFIRMED_BY_CREDIT_ADMIN', 'CLOSE_CASE'] },
  User: { entityType: 'user' },
};

export function AuditTrailPage() {
  const { vehicles } = useStore();
  const auditLog = store.getAuditLog();
  const [search, setSearch] = useState('');
  const [filterEntity, setFilterEntity] = useState('All');
  const [filterCase, setFilterCase] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  const caseRefs = [...new Set(auditLog.map(a => a.caseRef).filter(Boolean))];
  const entities = ['All', 'Stage', 'Document', 'Release', 'Closure', 'User'];

  // Build backend query params (for when connecting to API)
  const _buildBackendParams = () => {
    const params: Record<string, string> = {};
    if (filterEntity !== 'All') {
      const mapping = ENTITY_BACKEND_MAP[filterEntity];
      if (mapping?.entityType) params.entityType = mapping.entityType;
    }
    if (filterCase) params.loanId = filterCase;
    if (search) params.action = search;
    params.page = String(page);
    params.limit = String(perPage);
    return params;
  };

  const filtered = auditLog.filter(a => {
    const matchSearch = !search || [a.action, a.performedBy, a.detail, a.caseRef].some(f => f?.toLowerCase().includes(search.toLowerCase()));
    const matchEntity = filterEntity === 'All' || a.entity === filterEntity;
    const matchCase = !filterCase || a.caseRef === filterCase;
    return matchSearch && matchEntity && matchCase;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const resetPage = () => setPage(1);

  const handleExport = () => {
    const rows = [['ID', 'Case Ref', 'Entity', 'Action', 'Performed By', 'Timestamp', 'Detail', 'Before', 'After']];
    filtered.forEach(a => rows.push([a.id, a.caseRef, a.entity, a.action, a.performedBy, a.performedAt, a.detail || '', a.before || '', a.after || '']));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'fleetguard-audit.csv'; a.click();
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Trail</h1>
          <p className="text-gray-500 text-sm mt-1">Immutable log of all actions across all cases.</p>
        </div>
        <button onClick={handleExport} className="btn-secondary">
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-8 bg-white text-sm" placeholder="Search actions, users, details…"
            value={search} onChange={e => { setSearch(e.target.value); resetPage(); }} />
        </div>
        <select className="input w-40 bg-white text-sm" value={filterEntity} onChange={e => { setFilterEntity(e.target.value); resetPage(); }}>
          {entities.map(e => <option key={e}>{e}</option>)}
        </select>
        <select className="input w-48 bg-white text-sm" value={filterCase} onChange={e => { setFilterCase(e.target.value); resetPage(); }}>
          <option value="">All cases</option>
          {caseRefs.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total Events', value: auditLog.length },
          { label: 'Filtered', value: filtered.length },
          { label: 'Escalations', value: auditLog.filter(a => a.action === 'Escalation Triggered').length },
          { label: 'Cases Tracked', value: caseRefs.length },
        ].map(({ label, value }) => (
          <div key={label} className="card p-4">
            <div className="text-xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Log entries */}
      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Archive size={36} className="text-gray-200 mx-auto mb-3" />
            <div className="text-sm text-gray-400">No audit entries match your filters.</div>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {paginated.map((entry, i) => {
              const Icon = ENTITY_ICONS[entry.entity] || Shield;
              const iconColor = ENTITY_COLORS[entry.entity] || 'bg-gray-100 text-gray-500';
              const badgeColor = ACTION_BADGE[entry.action] || 'bg-gray-100 text-gray-600';
              return (
                <div key={entry.id} className={clsx('flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors', i % 2 === 1 ? 'bg-gray-50/30' : '')}>
                  <div className={clsx('w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5', iconColor)}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={clsx('badge text-xs', badgeColor)}>{entry.action}</span>
                      {entry.caseRef && <span className="text-xs font-mono text-gray-400">{entry.caseRef}</span>}
                    </div>
                    {entry.detail && <p className="text-sm text-gray-700 mb-1">{entry.detail}</p>}
                    {(entry.before || entry.after) && (
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        {entry.before && <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded">{entry.before}</span>}
                        {entry.before && entry.after && <span>→</span>}
                        {entry.after && <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded">{entry.after}</span>}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-medium text-gray-700">{entry.performedBy}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{format(new Date(entry.performedAt), 'dd MMM HH:mm')}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Rows per page:</span>
            <select className="input w-20 bg-white text-xs py-1" value={perPage}
              onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-500">
              {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}
            </span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="btn-secondary text-xs px-2 py-1 disabled:opacity-30">Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="btn-secondary text-xs px-2 py-1 disabled:opacity-30">Next</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
