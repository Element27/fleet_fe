import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Search, ChevronRight, ArrowLeft, Upload, CheckCircle, XCircle, Clock, FileText, ShieldCheck, Archive, Lock } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { store, STAGES, STAGE_ORDER, getRAGStatus, type Vehicle, type WorkflowStage } from '../data/store';
import { useAuth } from '../hooks/useAuth';
import { can } from '../lib/permissions';
import RequirePermission from '../components/RequirePermission';
import { toast } from '../lib/toast';
import { clsx } from 'clsx';
import { formatDistanceToNow, format } from 'date-fns';

// ── RAG ──────────────────────────────────────────────────────────────────────
const RAG_BADGE: Record<string, string> = {
  green: 'bg-green-50 text-green-700 border border-green-200',
  amber: 'bg-amber-50 text-amber-700 border border-amber-200',
  red: 'bg-red-50 text-red-700 border border-red-200',
};
const RAG_DOT: Record<string, string> = {
  green: 'bg-green-500', amber: 'bg-amber-500', red: 'bg-red-500',
};
const RAG_LABEL: Record<string, string> = {
  green: 'On Track', amber: 'Due Soon', red: 'Overdue',
};

// ── Register Vehicle Modal ────────────────────────────────────────────────────
function RegisterModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    registration: '', vehicleYear: '', vehicleMake: '', vehicleModel: '',
    vin: '', color: '', chassisNumber: '', engineNumber: '',
    assetValue: '', disbursementDate: '', dealer: '',
    customerName: '', borrowerContact: '', notes: '',
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.registration || !form.vehicleMake || !form.vehicleModel) {
      toast.error('Required fields missing', 'Registration, Make and Model are required.');
      return;
    }
    const v = await store.addVehicle({
      registration: form.registration,
      vehicleMake: form.vehicleMake,
      vehicleModel: form.vehicleModel,
      vehicleYear: parseInt(form.vehicleYear) || new Date().getFullYear(),
      vin: form.vin,
      color: form.color,
      chassisNumber: form.chassisNumber,
      engineNumber: form.engineNumber,
      assetValue: parseFloat(form.assetValue) || 0,
      disbursementDate: form.disbursementDate || new Date().toISOString(),
      dealer: form.dealer,
      customerName: form.customerName,
      borrowerContact: form.borrowerContact,
      notes: form.notes,
      accountOfficerId: '',
    });
    toast.success('Vehicle registered', `${v.vehicleMake} ${v.vehicleModel} — case ${v.caseRef} created.`);
    onClose();
    navigate(`/vehicles/${v.id}`);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-base font-semibold text-gray-900">Register vehicle</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-2 gap-4">
            {[
              { k: 'registration', label: 'Registration *', placeholder: 'JJJ894KP' },
              { k: 'vehicleYear', label: 'Year', placeholder: '2024' },
              { k: 'vehicleMake', label: 'Make *', placeholder: 'Toyota' },
              { k: 'vehicleModel', label: 'Model *', placeholder: 'Camry' },
              { k: 'vin', label: 'VIN', placeholder: 'JTDBF32K...' },
              { k: 'color', label: 'Color', placeholder: 'Pearl White' },
              { k: 'chassisNumber', label: 'Chassis #', placeholder: '' },
              { k: 'engineNumber', label: 'Engine #', placeholder: '' },
              { k: 'assetValue', label: 'Asset Value', placeholder: '19568000' },
              { k: 'disbursementDate', label: 'Disbursement Date', placeholder: '', type: 'date' },
              { k: 'dealer', label: 'Dealer', placeholder: 'Autochek' },
              { k: 'customerName', label: 'Borrower', placeholder: 'Full name' },
            ].map(({ k, label, placeholder, type }) => (
              <div key={k}>
                <label className="label">{label}</label>
                <input type={type || 'text'} className="input" placeholder={placeholder} value={(form as any)[k]} onChange={set(k)} />
              </div>
            ))}
            <div className="col-span-2">
              <label className="label">Borrower Contact</label>
              <input className="input" placeholder="Phone or email" value={form.borrowerContact} onChange={set('borrowerContact')} />
            </div>
            <div className="col-span-2">
              <label className="label">Notes</label>
              <textarea className="input resize-none h-20" value={form.notes} onChange={set('notes')} />
            </div>
          </div>
          <div className="flex justify-end mt-5">
            <button type="submit" className="btn-primary">Register</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Vehicles List ─────────────────────────────────────────────────────────────
export function VehiclesPage() {
  const { vehicles } = useStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const role = user?.role || '';

  const filtered = vehicles.filter(v =>
    [v.registration, v.vehicleMake, v.vehicleModel, v.customerName, v.dealer, v.caseRef]
      .some(f => f.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehicles</h1>
          <p className="text-gray-500 text-sm mt-1">Registered assets under post-disbursement monitoring.</p>
        </div>
        <RequirePermission action="createLoan">
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> New vehicle
          </button>
        </RequirePermission>
      </div>

      <div className="relative mb-5">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input pl-9 bg-white" placeholder="Search reg, make, borrower…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <Car size={40} className="text-gray-300 mx-auto mb-3" />
          <div className="text-gray-500 text-sm">No vehicles found.</div>
          <RequirePermission action="createLoan">
            <button className="btn-primary mx-auto mt-4" onClick={() => setShowModal(true)}><Plus size={15} /> Register first vehicle</button>
          </RequirePermission>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filtered.map(v => {
            const rag = getRAGStatus(v.currentStage, v.updatedAt);
            const stageMeta = STAGES.find(s => s.key === v.currentStage);
            return (
              <div key={v.id} onClick={() => navigate(`/vehicles/${v.id}`)}
                className="card p-5 cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5 group">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-xs text-gray-400 font-mono mb-0.5">{v.registration}</div>
                    <div className="text-base font-semibold text-gray-900 group-hover:text-primary transition-colors">{v.vehicleMake} {v.vehicleModel}</div>
                  </div>
                  <span className={clsx('badge', RAG_BADGE[rag])}>{stageMeta?.label}</span>
                </div>
                <div className="space-y-1 text-xs text-gray-500">
                  <div className="flex justify-between"><span className="uppercase tracking-wider font-medium">Borrower</span><span className="text-gray-700">{v.customerName}</span></div>
                  <div className="flex justify-between"><span className="uppercase tracking-wider font-medium">Dealer</span><span className="text-gray-700">{v.dealer}</span></div>
                  <div className="flex justify-between"><span className="uppercase tracking-wider font-medium">Value</span><span className="font-mono text-gray-700">{v.assetValue.toLocaleString()}</span></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && <RegisterModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

// ── Vehicle Detail ────────────────────────────────────────────────────────────
const DOC_TYPES = ['Vehicle Invoice', 'Customs Papers', 'Registration Certificate', 'Insurance Certificate', 'Tracker Installation Certificate', 'Delivery Note', 'Spare Key Acknowledgement'];

function UploadDocModal({ vehicleId, onClose }: { vehicleId: string; onClose: () => void }) {
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { toast.error('No file selected', 'Please choose a file to upload.'); return; }
    try {
      const docTypeSnake = docType.toLowerCase().replace(/\s+/g, '_');
      await store.uploadDocument(vehicleId, docTypeSnake, name || docType, file);
      toast.success('Document uploaded', `${name || docType} submitted for review.`);
      onClose();
    } catch (err: any) {
      toast.error('Upload failed', err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-100 flex justify-between">
          <h2 className="text-base font-semibold">Upload document</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">Document Type</label>
            <select className="input" value={docType} onChange={e => setDocType(e.target.value)}>
              {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Display Name (optional)</label>
            <input className="input" placeholder={docType} value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer" onClick={() => fileRef.current?.click()}>
            <input ref={fileRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setFile(e.target.files?.[0] || null)} />
            <Upload size={24} className="text-gray-300 mx-auto mb-2" />
            {file ? (
              <p className="text-sm text-gray-700 font-medium">{file.name}</p>
            ) : (
              <p className="text-sm text-gray-500">Click to select file</p>
            )}
            <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG up to 20MB</p>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Upload</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreditAdminConfirmModal({ vehicleId, onClose }: { vehicleId: string; onClose: () => void }) {
  const [confirm, setConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm) { toast.error('Confirmation required', 'Please check the confirmation box.'); return; }
    setSubmitting(true);
    await store.creditAdminConfirmClosure(vehicleId);
    toast.success('Closure confirmed', 'Credit administration has approved this case for closure.');
    onClose();
    navigate(`/vehicles/${vehicleId}`);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-base font-semibold text-gray-900">Credit Admin Closure Confirmation</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            I confirm that I have reviewed the completed documents checklist for this case and authorize it to proceed to final closure.
          </p>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" className="mt-0.5 accent-primary w-4 h-4 shrink-0"
              checked={confirm} onChange={e => setConfirm(e.target.checked)} />
            <span className="text-sm text-gray-700 leading-relaxed">
              I confirm that all documents are in order and I authorize closure proceeding.
            </span>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={submitting || !confirm}
              className="btn-primary bg-green-600 hover:bg-green-700">
              {submitting ? 'Confirming…' : 'Confirm & Authorize'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function VehicleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { vehicles } = useStore();
  const { user } = useAuth();
  const vehicle = vehicles.find(v => v.id === id);
  const role = user?.role || '';
  const [showUpload, setShowUpload] = useState(false);
  const [showCreditAdmin, setShowCreditAdmin] = useState(false);
  const [rejectDocId, setRejectDocId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (id) store.fetchVehicle(id);
  }, [id]);

  if (!vehicle) return (
    <div className="p-8 text-center">
      <div className="text-gray-500">Vehicle not found.</div>
      <button className="btn-primary mx-auto mt-4" onClick={() => navigate('/vehicles')}><ArrowLeft size={15} /> Back</button>
    </div>
  );

  const rag = getRAGStatus(vehicle.currentStage, vehicle.updatedAt);
  const stageIdx = STAGE_ORDER.indexOf(vehicle.currentStage);

  const handleAdvance = async () => {
    if (vehicle.currentStage === 'release_approval') { navigate(`/release/${vehicle.id}`); return; }
    if (vehicle.currentStage === 'documents_collection') { navigate(`/documents-collection/${vehicle.id}`); return; }
    if (vehicle.currentStage === 'vehicle_delivery') {
      const updated = await store.advanceStage(vehicle.id);
      if (updated) { toast.success('Delivery confirmed', 'Stage advanced to Documents Collection.'); }
      return;
    }
    const updated = await store.advanceStage(vehicle.id);
    if (updated) {
      const nextMeta = STAGES.find(s => s.key === updated.currentStage);
      toast.success(`Milestone: ${nextMeta?.label}`, `${nextMeta?.owner} has been notified.`);
    }
  };

  const handleVerify = async (docId: string) => {
    await store.verifyDocument(vehicle.id, docId, 'approved');
    toast.success('Document approved');
  };

  const handleRejectConfirm = async () => {
    if (!rejectDocId || !rejectReason.trim()) return;
    try {
      await store.verifyDocument(vehicle.id, rejectDocId, 'rejected', rejectReason.trim());
      toast.success('Document rejected');
      setRejectDocId(null);
      setRejectReason('');
    } catch (err: any) {
      toast.error('Failed to reject document', err.message);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <button onClick={() => navigate('/vehicles')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5 transition-colors">
        <ArrowLeft size={15} /> Back to Vehicles
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="font-mono text-xs text-gray-400">{vehicle.registration}</span>
            <span className="text-gray-300">·</span>
            <span className="font-mono text-xs text-gray-400">{vehicle.caseRef}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{vehicle.vehicleMake} {vehicle.vehicleModel} {vehicle.vehicleYear}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{vehicle.customerName} · {vehicle.dealer}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={clsx('badge', RAG_BADGE[rag])}><span className={clsx('w-1.5 h-1.5 rounded-full mr-1.5 inline-block', RAG_DOT[rag])} />{RAG_LABEL[rag]}</span>
          {can(role, 'closeCase') && vehicle.currentStage === 'documents_collection' && vehicle.closureChecklist?.confirmedAt && vehicle.creditAdminClosure?.confirmedAt && (
            <button onClick={() => navigate(`/case-closure/${vehicle.id}`)} className="btn-primary bg-green-600 hover:bg-green-700">
              <Lock size={14} /> Close Case
            </button>
          )}
          {can(role, 'creditAdminConfirm') && vehicle.currentStage === 'documents_collection' && vehicle.closureChecklist?.confirmedAt && !vehicle.creditAdminClosure?.confirmedAt && (
            <button onClick={() => setShowCreditAdmin(true)} className="btn-primary bg-blue-600 hover:bg-blue-700">
              <ShieldCheck size={14} /> Credit Admin Confirmation
            </button>
          )}
          {can(role, 'approveRelease') && vehicle.currentStage === 'release_approval' && (
            <button onClick={() => navigate(`/release/${vehicle.id}`)} className="btn-primary">
              <ShieldCheck size={14} /> Approve Release
            </button>
          )}
          {can(role, 'confirmDocuments') && vehicle.currentStage === 'documents_collection' && !vehicle.closureChecklist?.confirmedAt && (
            <button onClick={() => navigate(`/documents-collection/${vehicle.id}`)} className="btn-primary">
              <Archive size={14} /> Confirm Documents
            </button>
          )}
          {can(role, 'advanceStage') && vehicle.currentStage !== 'completed' && vehicle.currentStage !== 'release_approval' && vehicle.currentStage !== 'documents_collection' && (
            <button onClick={handleAdvance} className="btn-primary">
              Advance Stage <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Left column */}
        <div className="col-span-2 space-y-5">
          {/* Workflow timeline */}
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-5">Workflow Timeline</h2>
            <div className="space-y-0">
              {STAGES.map((s, i) => {
                const isDone = stageIdx > i;
                const isCurrent = stageIdx === i;
                const isPending = stageIdx < i;
                return (
                  <div key={s.key} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={clsx('w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 border-2',
                        isDone ? 'bg-green-500 border-green-500' :
                        isCurrent ? 'bg-primary border-primary' :
                        'bg-white border-gray-200')}>
                        {isDone ? <CheckCircle size={14} className="text-white" /> :
                         isCurrent ? <Clock size={12} className="text-white" /> :
                         <div className="w-2 h-2 rounded-full bg-gray-300" />}
                      </div>
                      {i < STAGES.length - 1 && <div className={clsx('w-0.5 flex-1 my-1', isDone ? 'bg-green-300' : 'bg-gray-150')} style={{minHeight:'24px'}} />}
                    </div>
                    <div className={clsx('pb-5', i === STAGES.length - 1 ? '' : '')}>
                      <div className={clsx('text-sm font-semibold', isDone ? 'text-green-700' : isCurrent ? 'text-gray-900' : 'text-gray-400')}>
                        {s.label}
                      </div>
                      <div className={clsx('text-xs mt-0.5', isDone ? 'text-green-500' : isCurrent ? 'text-primary' : 'text-gray-400')}>
                        {isDone ? '✓ Completed' : isCurrent ? `In progress · ${s.owner}` : `Pending · ${s.owner}`}
                      </div>
                      {isCurrent && s.slaDays > 0 && (
                        <div className="text-xs text-amber-600 mt-0.5">SLA: {s.slaDays * 24}h</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Documents */}
          <div className="card p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-sm font-semibold text-gray-900">Documents</h2>
              <button className="btn-secondary text-xs" onClick={() => setShowUpload(true)}>
                <Upload size={13} /> Upload
              </button>
            </div>
            {vehicle.documents.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                <FileText size={28} className="mx-auto mb-2 text-gray-300" />
                No documents uploaded yet.
              </div>
            ) : (
              <div className="space-y-2">
                {vehicle.documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <FileText size={16} className="text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-800">{doc.name}</div>
                        <div className="text-xs text-gray-400">{doc.uploadedBy} · {formatDistanceToNow(new Date(doc.uploadedAt))} ago</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={clsx('badge text-xs',
                        doc.status === 'approved' ? 'bg-green-50 text-green-700' :
                        doc.status === 'rejected' ? 'bg-red-50 text-red-700' :
                        'bg-gray-100 text-gray-600')}>
                        {doc.status}
                      </span>
                      {doc.status === 'pending' && can(role, 'verifyDocument') && (
                        <div className="flex gap-1">
                          <button onClick={() => handleVerify(doc.id)}
                            className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors">
                            <CheckCircle size={13} />
                          </button>
                          <button onClick={() => { setRejectDocId(doc.id); setRejectReason(''); }}
                            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                            <XCircle size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column — details */}
        <div className="space-y-5">
          <div className="card p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Vehicle Details</h3>
            <div className="space-y-3 text-sm">
              {[
                ['VIN', vehicle.vin],
                ['Chassis #', vehicle.chassisNumber],
                ['Engine #', vehicle.engineNumber],
                ['Color', vehicle.color],
                ['Year', String(vehicle.vehicleYear)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <span className="text-gray-500 shrink-0">{k}</span>
                  <span className="text-gray-900 font-mono text-xs text-right">{v || '—'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Loan Details</h3>
            <div className="space-y-3 text-sm">
              {[
                ['Case Ref', vehicle.caseRef],
                ['Borrower', vehicle.customerName],
                ['Contact', vehicle.borrowerContact],
                ['Dealer', vehicle.dealer],
                ['Asset Value', vehicle.assetValue.toLocaleString()],
                ['Disbursed', vehicle.disbursementDate ? format(new Date(vehicle.disbursementDate), 'dd MMM yyyy') : '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <span className="text-gray-500 shrink-0">{k}</span>
                  <span className="text-gray-900 text-xs text-right">{v || '—'}</span>
                </div>
              ))}
            </div>
          </div>

          {vehicle.notes && (
            <div className="card p-5">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Notes</h3>
              <p className="text-sm text-gray-700 leading-relaxed">{vehicle.notes}</p>
            </div>
          )}
        </div>
      </div>

      {showUpload && <UploadDocModal vehicleId={vehicle.id} onClose={() => setShowUpload(false)} />}
      {showCreditAdmin && <CreditAdminConfirmModal vehicleId={vehicle.id} onClose={() => setShowCreditAdmin(false)} />}

      {rejectDocId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setRejectDocId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-base font-semibold">Reject document</h2>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-500">Provide a reason for rejecting this document.</p>
              <textarea className="input resize-none h-24 w-full" placeholder="Reason for rejection…" value={rejectReason} onChange={e => setRejectReason(e.target.value)} autoFocus />
              <div className="flex justify-end gap-2">
                <button type="button" className="btn-secondary" onClick={() => setRejectDocId(null)}>Cancel</button>
                <button type="button" disabled={!rejectReason.trim()} onClick={handleRejectConfirm}
                  className="btn-primary bg-red-600 hover:bg-red-700 disabled:opacity-50">
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Mini Car icon for import
function Car({ size = 16, className = '' }: { size?: number; className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-3"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>;
}
