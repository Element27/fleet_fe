import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Lock, FileText, ShieldCheck, MapPin, Calendar } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { store, STAGES } from '../data/store';
import { toast } from '../lib/toast';
import { clsx } from 'clsx';
import { format, formatDistanceToNow } from 'date-fns';

export function CaseClosurePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { vehicles } = useStore();
  const vehicle = vehicles.find(v => v.id === id);
  const [confirm, setConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!vehicle) return (
    <div className="p-8 text-center text-gray-500">Vehicle not found.</div>
  );

  const canClose = vehicle.currentStage === 'documents_collection' && !!vehicle.closureChecklist?.confirmedAt && !!vehicle.creditAdminClosure?.confirmedAt;
  const isClosed = vehicle.currentStage === 'completed';

  const handleClose = async () => {
    if (!confirm) { toast.error('Confirm closure', 'Please tick the confirmation checkbox first.'); return; }
    setSubmitting(true);
    await store.closeCase(vehicle.id);
    toast.success('Case closed', `${vehicle.caseRef} has been archived. Compliance complete.`);
    navigate(`/vehicles/${id}`);
  };

  const stageIdx = (s: string) => STAGES.findIndex(x => x.key === s);
  const currentIdx = stageIdx(vehicle.currentStage);

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <button onClick={() => navigate(`/vehicles/${id}`)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5 transition-colors">
        <ArrowLeft size={15} /> Back to vehicle
      </button>

      {/* Header */}
      <div className="flex items-start gap-4 mb-7">
        <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
          <Lock size={22} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Case Closure</h1>
          <p className="text-gray-500 text-sm mt-0.5">{vehicle.caseRef} · {vehicle.vehicleMake} {vehicle.vehicleModel} · {vehicle.customerName}</p>
        </div>
      </div>

      {isClosed ? (
        <div className="card p-10 text-center">
          <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
          <div className="text-lg font-bold text-gray-900 mb-1">Case Fully Closed</div>
          <div className="text-sm text-gray-500">This case was closed and archived successfully.</div>
          <button onClick={() => navigate(`/vehicles/${id}`)} className="btn-primary mx-auto mt-5">View case</button>
        </div>
      ) : (
        <>
          {/* Case summary */}
          <div className="card p-6 mb-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Case Summary</h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              {[
                ['Case Reference', vehicle.caseRef],
                ['Vehicle', `${vehicle.vehicleMake} ${vehicle.vehicleModel} ${vehicle.vehicleYear}`],
                ['Registration', vehicle.registration],
                ['Borrower', vehicle.customerName],
                ['Dealer', vehicle.dealer],
                ['Disbursement Date', vehicle.disbursementDate ? format(new Date(vehicle.disbursementDate), 'dd MMM yyyy') : '—'],
                ['Asset Value', `₦${vehicle.assetValue.toLocaleString()}`],
                ['Current Stage', STAGES.find(s => s.key === vehicle.currentStage)?.label || vehicle.currentStage],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-col gap-0.5">
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">{k}</span>
                  <span className="text-gray-900 font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pre-closure gate checks */}
          <div className="card p-6 mb-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Pre-closure Gate Checks</h2>
            <div className="space-y-2">
              {[
                { label: 'Vehicle release approved', done: !!vehicle.releaseApproval },
                { label: 'Vehicle delivered to borrower', done: currentIdx >= stageIdx('vehicle_delivery') },
                { label: 'All original documents collected', done: !!vehicle.closureChecklist?.confirmedAt },
                { label: 'Credit administration confirmed closure', done: !!vehicle.creditAdminClosure?.confirmedAt },
                { label: 'All uploaded documents approved', done: vehicle.documents.length > 0 && vehicle.documents.every(d => d.status === 'approved') },
              ].map(({ label, done }) => (
                <div key={label} className={clsx('flex items-center gap-3 p-3 rounded-xl',
                  done ? 'bg-green-50' : 'bg-gray-50')}>
                  {done
                    ? <CheckCircle2 size={16} className="text-green-600 shrink-0" />
                    : <div className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0" />}
                  <span className={clsx('text-sm', done ? 'text-green-800' : 'text-gray-500')}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Documents summary */}
          {vehicle.closureChecklist && (
            <div className="card p-6 mb-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-1">Originals Confirmed</h2>
              <p className="text-xs text-gray-400 mb-3">
                Confirmed by {vehicle.closureChecklist.confirmedBy} · {formatDistanceToNow(new Date(vehicle.closureChecklist.confirmedAt!))} ago
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ['Invoice', vehicle.closureChecklist.invoice],
                  ['Customs Papers', vehicle.closureChecklist.customsPapers],
                  ['Registration Cert', vehicle.closureChecklist.registrationCert],
                  ['Insurance Cert', vehicle.closureChecklist.insuranceCert],
                  ['Tracker Cert', vehicle.closureChecklist.trackerCert],
                  ['Delivery Note', vehicle.closureChecklist.deliveryNote],
                  ['Spare Key', vehicle.closureChecklist.spareKey],
                ].map(([label, val]) => (
                  <div key={label as string} className={clsx('flex items-center gap-2 text-xs p-2 rounded-lg',
                    val ? 'text-green-700' : 'text-red-500')}>
                    {val ? <CheckCircle2 size={12} /> : <div className="w-3 h-3 rounded-full border border-red-400" />}
                    {label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confirmation checkbox */}
          <div className="card p-6 mb-5">
            <label className={clsx('flex items-start gap-3 cursor-pointer', !canClose ? 'opacity-50 pointer-events-none' : '')}>
              <input type="checkbox" className="mt-0.5 accent-primary w-4 h-4 shrink-0"
                checked={confirm} onChange={e => setConfirm(e.target.checked)} />
              <span className="text-sm text-gray-700 leading-relaxed">
                I confirm that all post-disbursement compliance requirements for case <strong>{vehicle.caseRef}</strong> have been fulfilled. I authorise this case to be closed and archived. This action cannot be undone.
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button onClick={() => navigate(`/vehicles/${id}`)} className="btn-secondary">Cancel</button>
            <button onClick={handleClose}
              disabled={submitting || !canClose || !confirm}
              className={clsx('btn-primary bg-green-600 hover:bg-green-700',
                (!canClose || !confirm) ? 'opacity-50 cursor-not-allowed' : '')}>
              <Lock size={16} />
              {submitting ? 'Closing…' : 'Close Case'}
            </button>
          </div>
          {!canClose && (
            <p className="text-xs text-center text-amber-600 mt-2">
              Complete all gate checks above before closing this case.
            </p>
          )}
        </>
      )}
    </div>
  );
}
