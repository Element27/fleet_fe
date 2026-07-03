import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Archive, CheckCircle2, Circle, AlertTriangle } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { store, STAGES } from '../data/store';
import { toast } from '../lib/toast';
import { clsx } from 'clsx';
import { format } from 'date-fns';

const ORIGINALS = [
  { key: 'invoice', label: 'Original Vehicle Invoice', description: 'Signed original from dealer' },
  { key: 'customsPapers', label: 'Customs Papers', description: 'Import documentation (if applicable)' },
  { key: 'registrationCert', label: 'Registration Certificate', description: 'Original vehicle registration' },
  { key: 'insuranceCert', label: 'Insurance Certificate', description: 'Original policy document from insurer' },
  { key: 'trackerCert', label: 'Tracker Installation Certificate', description: 'Signed original from tracking firm' },
  { key: 'deliveryNote', label: 'Signed Delivery Note', description: 'Customer-signed proof of delivery' },
  { key: 'spareKey', label: 'Spare Key Acknowledgement', description: 'Receipt for spare key custody' },
];

type ChecklistKey = 'invoice' | 'customsPapers' | 'registrationCert' | 'insuranceCert' | 'trackerCert' | 'deliveryNote' | 'spareKey';

export function DocumentsCollectionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { vehicles } = useStore();
  const vehicle = vehicles.find(v => v.id === id);

  const existing = vehicle?.closureChecklist;
  const [checks, setChecks] = useState<Record<ChecklistKey, boolean>>({
    invoice: existing?.invoice ?? false,
    customsPapers: existing?.customsPapers ?? false,
    registrationCert: existing?.registrationCert ?? false,
    insuranceCert: existing?.insuranceCert ?? false,
    trackerCert: existing?.trackerCert ?? false,
    deliveryNote: existing?.deliveryNote ?? false,
    spareKey: existing?.spareKey ?? false,
  });
  const [remarks, setRemarks] = useState(existing?.remarks ?? '');
  const [submitting, setSubmitting] = useState(false);

  if (!vehicle) return (
    <div className="p-8 text-center text-gray-500">Vehicle not found. <button onClick={() => navigate('/vehicles')} className="text-primary hover:underline">Go back</button></div>
  );

  const isDocStage = vehicle.currentStage === 'documents_collection';
  const isCompleted = vehicle.currentStage === 'completed';
  const checkedCount = Object.values(checks).filter(Boolean).length;
  const allChecked = checkedCount === ORIGINALS.length;
  const progress = Math.round((checkedCount / ORIGINALS.length) * 100);

  const toggle = (k: ChecklistKey) => {
    if (existing?.confirmedAt) return;
    setChecks(c => ({ ...c, [k]: !c[k] }));
  };

  const handleConfirm = async () => {
    if (!allChecked) { toast.error('Incomplete checklist', 'All original documents must be confirmed as received.'); return; }
    setSubmitting(true);
    await store.confirmDocuments(vehicle.id, { ...checks, remarks });
    toast.success('Documents confirmed', 'Checklist saved. Credit admin confirmation is now required to proceed to closure.');
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
          <Archive size={22} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Original Documents Collection</h1>
          <p className="text-gray-500 text-sm mt-0.5">{vehicle.vehicleMake} {vehicle.vehicleModel} · {vehicle.registration} · {vehicle.customerName}</p>
        </div>
      </div>

      {/* Already confirmed banner */}
      {existing?.confirmedAt && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-4 mb-5">
          <CheckCircle2 size={16} className="text-green-600 mt-0.5 shrink-0" />
          <div>
            <div className="text-sm font-semibold text-green-800">Documents already confirmed</div>
            <div className="text-xs text-green-700 mt-0.5">Confirmed by {existing.confirmedBy} on {format(new Date(existing.confirmedAt), 'dd MMM yyyy, HH:mm')}</div>
          </div>
        </div>
      )}

      {!isDocStage && !isCompleted && !existing?.confirmedAt && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
          <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <div className="text-sm font-semibold text-amber-800">Not yet at this stage</div>
            <div className="text-xs text-amber-700">Vehicle is currently at <strong>{STAGES.find(s => s.key === vehicle.currentStage)?.label}</strong>. Documents collection is available after vehicle delivery.</div>
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="card p-5 mb-5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-gray-700">Collection progress</span>
          <span className="text-sm font-bold text-primary">{checkedCount}/{ORIGINALS.length} documents</span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="text-xs text-gray-400 mt-1.5">{progress}% complete</div>
      </div>

      {/* Checklist */}
      <div className="card p-6 mb-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Original Documents Checklist</h2>
        <div className="space-y-2">
          {ORIGINALS.map(({ key, label, description }) => {
            const k = key as ChecklistKey;
            const checked = checks[k];
            const locked = !!existing?.confirmedAt;
            return (
              <div key={k} onClick={() => toggle(k)}
                className={clsx('flex items-center gap-4 p-4 rounded-xl border transition-all',
                  locked ? 'cursor-default' : 'cursor-pointer',
                  checked ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-transparent hover:border-gray-200')}>
                <div className={clsx('shrink-0 transition-colors', checked ? 'text-green-600' : 'text-gray-300')}>
                  {checked ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                </div>
                <div className="flex-1">
                  <div className={clsx('text-sm font-medium', checked ? 'text-green-900' : 'text-gray-800')}>{label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{description}</div>
                </div>
                {checked && !locked && (
                  <span className="text-xs text-green-600 font-medium">Received ✓</span>
                )}
                {checked && locked && (
                  <span className="text-xs text-green-600 font-medium">Confirmed</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Remarks */}
      <div className="card p-6 mb-5">
        <label className="label">Remarks / Notes</label>
        <textarea className="input resize-none h-24"
          placeholder="e.g. Customs papers not applicable (locally purchased). Spare key held in vault 3B."
          value={remarks}
          onChange={e => setRemarks(e.target.value)}
          disabled={!!existing?.confirmedAt} />
      </div>

      {/* Actions */}
      {!existing?.confirmedAt && (
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(`/vehicles/${id}`)} className="btn-secondary">Cancel</button>
          <button onClick={handleConfirm}
            disabled={submitting || !isDocStage || !allChecked}
            className={clsx('btn-primary', (!allChecked || !isDocStage) ? 'opacity-50 cursor-not-allowed' : '')}>
            <CheckCircle2 size={16} />
            {submitting ? 'Confirming…' : 'Confirm All Received'}
          </button>
        </div>
      )}
      {!allChecked && !existing?.confirmedAt && (
        <p className="text-xs text-center text-amber-600 mt-2">{ORIGINALS.length - checkedCount} document(s) still unchecked.</p>
      )}
    </div>
  );
}
