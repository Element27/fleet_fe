import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, AlertTriangle, CheckCircle, FileText, Plus, X } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { store, STAGES } from '../data/store';
import { toast } from '../lib/toast';
import { clsx } from 'clsx';
import { format } from 'date-fns';

const REQUIRED_DOCS = [
  { type: 'invoice', label: 'Vehicle Invoice' },
  { type: 'registration', label: 'Registration Certificate' },
  { type: 'tracker', label: 'Tracker Installation Certificate' },
  { type: 'insurance', label: 'Insurance Certificate' },
];

const PRE_CHECKS = [
  'Vehicle registration documents verified',
  'Tracker installation certificate confirmed',
  'Insurance policy active and valid',
  'All document signatures valid',
  'Vehicle details match loan application',
];

export function ReleaseApprovalPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { vehicles } = useStore();
  const vehicle = vehicles.find(v => v.id === id);

  const [remarks, setRemarks] = useState('');
  const [conditions, setConditions] = useState<string[]>([]);
  const [condInput, setCondInput] = useState('');
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  if (!vehicle) return (
    <div className="p-8 text-center text-gray-500">Vehicle not found. <button onClick={() => navigate('/vehicles')} className="text-primary hover:underline">Go back</button></div>
  );

  if (vehicle.currentStage !== 'release_approval') {
    return (
      <div className="p-8 max-w-xl mx-auto">
        <button onClick={() => navigate(`/vehicles/${id}`)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5"><ArrowLeft size={15} /> Back</button>
        <div className="card p-10 text-center">
          <ShieldCheck size={40} className="text-gray-200 mx-auto mb-3" />
          {vehicle.releaseApproval ? (
            <>
              <div className="text-base font-semibold text-gray-900 mb-1">Release already approved</div>
              <div className="text-sm text-gray-500">Approved by {vehicle.releaseApproval.approvedBy} on {format(new Date(vehicle.releaseApproval.approvedAt), 'dd MMM yyyy, HH:mm')}</div>
            </>
          ) : (
            <>
              <div className="text-base font-semibold text-gray-900 mb-1">Not at release stage yet</div>
              <div className="text-sm text-gray-500">This vehicle is currently at <strong>{STAGES.find(s => s.key === vehicle.currentStage)?.label}</strong>.</div>
            </>
          )}
          <button onClick={() => navigate(`/vehicles/${id}`)} className="btn-primary mx-auto mt-5">View case</button>
        </div>
      </div>
    );
  }

  const allChecked = PRE_CHECKS.every((_, i) => checks[String(i)]);
  const missingDocs = REQUIRED_DOCS.filter(req => !vehicle.documents.some(d => d.type === req.type && d.status === 'approved'));

  const addCondition = () => {
    const t = condInput.trim();
    if (t && !conditions.includes(t)) setConditions(c => [...c, t]);
    setCondInput('');
  };

  const handleApprove = async () => {
    if (!allChecked) { toast.error('Complete all pre-checks', 'All checklist items must be confirmed before approving release.'); return; }
    if (missingDocs.length > 0) { toast.error('Missing documents', `${missingDocs.map(d => d.label).join(', ')} must be approved first.`); return; }
    setSubmitting(true);
    await store.approveRelease(vehicle.id, remarks || 'Approved for release.', conditions);
    toast.success('Release approved', `${vehicle.vehicleMake} ${vehicle.vehicleModel} cleared for delivery to ${vehicle.customerName}.`);
    navigate(`/vehicles/${id}`);
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <button onClick={() => navigate(`/vehicles/${id}`)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5 transition-colors">
        <ArrowLeft size={15} /> Back to vehicle
      </button>

      {/* Header */}
      <div className="flex items-start gap-4 mb-7">
        <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
          <ShieldCheck size={22} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehicle Release Approval</h1>
          <p className="text-gray-500 text-sm mt-0.5">{vehicle.vehicleMake} {vehicle.vehicleModel} · {vehicle.registration} · {vehicle.customerName}</p>
        </div>
      </div>

      {/* Warning if docs missing */}
      {missingDocs.length > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
          <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <div className="text-sm font-semibold text-amber-800 mb-1">Missing approved documents</div>
            <div className="text-xs text-amber-700">{missingDocs.map(d => d.label).join(', ')} must be uploaded and approved before release can proceed.</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-5">
        {/* Pre-release checklist */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Pre-release Checklist</h2>
          <p className="text-xs text-gray-400 mb-4">Confirm each item before approving release.</p>
          <div className="space-y-3">
            {PRE_CHECKS.map((item, i) => (
              <label key={i} className={clsx('flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all border',
                checks[String(i)] ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-transparent hover:border-gray-200')}>
                <input type="checkbox" className="mt-0.5 accent-primary"
                  checked={!!checks[String(i)]}
                  onChange={e => setChecks(c => ({ ...c, [String(i)]: e.target.checked }))} />
                <span className={clsx('text-sm', checks[String(i)] ? 'text-green-800 line-through' : 'text-gray-700')}>{item}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Document status */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Required Documents</h2>
          <div className="space-y-2 mb-5">
            {REQUIRED_DOCS.map(req => {
              const doc = vehicle.documents.find(d => d.type === req.type);
              const approved = doc?.status === 'approved';
              return (
                <div key={req.type} className={clsx('flex items-center justify-between p-3 rounded-xl border',
                  approved ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200')}>
                  <div className="flex items-center gap-2">
                    <FileText size={14} className={approved ? 'text-green-600' : 'text-red-400'} />
                    <span className="text-xs font-medium text-gray-700">{req.label}</span>
                  </div>
                  {approved
                    ? <CheckCircle size={14} className="text-green-600" />
                    : <span className="text-xs text-red-600 font-medium">Missing</span>}
                </div>
              );
            })}
          </div>

          <h2 className="text-sm font-semibold text-gray-900 mb-2">Conditions (optional)</h2>
          <div className="flex gap-2 mb-2">
            <input className="input text-xs flex-1" placeholder="Add a release condition…" value={condInput}
              onChange={e => setCondInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCondition())} />
            <button onClick={addCondition} className="btn-secondary px-3"><Plus size={14} /></button>
          </div>
          {conditions.length > 0 && (
            <div className="space-y-1">
              {conditions.map((c, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-xs text-gray-700">{c}</span>
                  <button onClick={() => setConditions(cs => cs.filter((_, j) => j !== i))}><X size={12} className="text-gray-400 hover:text-red-500" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Remarks */}
      <div className="card p-6 mt-5">
        <label className="label">Approval Remarks</label>
        <textarea className="input resize-none h-24" placeholder="Add remarks for this release approval…"
          value={remarks} onChange={e => setRemarks(e.target.value)} />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-5">
        <button onClick={() => navigate(`/vehicles/${id}`)} className="btn-secondary">Cancel</button>
        <button onClick={handleApprove} disabled={submitting || missingDocs.length > 0}
          className={clsx('btn-primary', (!allChecked || missingDocs.length > 0) ? 'opacity-50 cursor-not-allowed' : '')}>
          <ShieldCheck size={16} />
          {submitting ? 'Approving…' : 'Approve Release'}
        </button>
      </div>
      {!allChecked && (
        <p className="text-xs text-center text-amber-600 mt-2">Complete all {PRE_CHECKS.length} checklist items to enable approval.</p>
      )}
    </div>
  );
}
