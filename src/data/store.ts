import { api } from '../lib/api';

// Types
export type WorkflowStage =
  | 'dealer_handover'
  | 'collateral_inspection'
  | 'tracker_installation'
  | 'insurance_activation'
  | 'release_approval'
  | 'vehicle_delivery'
  | 'documents_collection'
  | 'completed';

export type DocStatus = 'pending' | 'approved' | 'rejected';
export type RAGStatus = 'green' | 'amber' | 'red';

export interface Document {
  id: string;
  name: string;
  type: string;
  status: DocStatus;
  uploadedBy: string;
  uploadedAt: string;
  rejectionReason?: string;
  url?: string;
}

export interface AuditEntry {
  id: string;
  vehicleId: string;
  caseRef: string;
  entity: 'Vehicle' | 'Document' | 'Stage' | 'Release' | 'Closure' | 'User';
  action: string;
  performedBy: string;
  performedAt: string;
  detail?: string;
  before?: string;
  after?: string;
}

export interface ReleaseApproval {
  approvedBy: string;
  approvedAt: string;
  remarks: string;
  conditions: string[];
}

export interface ClosureChecklist {
  invoice: boolean;
  customsPapers: boolean;
  registrationCert: boolean;
  insuranceCert: boolean;
  trackerCert: boolean;
  deliveryNote: boolean;
  spareKey: boolean;
  confirmedBy?: string;
  confirmedAt?: string;
  remarks?: string;
}

export interface CreditAdminClosure {
  confirmedBy: string;
  confirmedAt: string;
}

export interface Vehicle {
  id: string;
  caseRef: string;
  registration: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  vin: string;
  chassisNumber: string;
  engineNumber: string;
  color: string;
  assetValue: number;
  disbursementDate: string;
  customerName: string;
  borrowerContact: string;
  dealer: string;
  accountOfficerId: string;
  currentStage: WorkflowStage;
  updatedAt: string;
  status: 'active' | 'completed' | 'flagged';
  notes: string;
  documents: Document[];
  notifications: Notification[];
  releaseApproval?: ReleaseApproval;
  closureChecklist?: ClosureChecklist;
  creditAdminClosure?: CreditAdminClosure;
}

export interface Notification {
  id: string;
  vehicleId: string;
  title: string;
  message: string;
  type: 'milestone' | 'reminder' | 'escalation';
  read: boolean;
  createdAt: string;
  dueDate?: string;
}

export interface User {
  id: string;
  fullname: string;
  email: string;
  role: 'admin' | 'collateral_manager' | 'account_officer' | 'credit_administration' | 'relationship_manager' | 'operations' | 'dealer' | 'tracking_company' | 'insurance_provider' | 'user';
  organisation: string;
  status: boolean;
  createdAt: string;
}

// Stage metadata
export const STAGES: { key: WorkflowStage; label: string; owner: string; slaDays: number; description: string }[] = [
  { key: 'dealer_handover', label: 'Dealer Handover', owner: 'Auto dealer', slaDays: 2, description: 'Dealer acknowledges disbursement and begins registration process' },
  { key: 'collateral_inspection', label: 'Collateral Inspection', owner: 'Collateral manager', slaDays: 1, description: 'Collateral manager verifies registration documents' },
  { key: 'tracker_installation', label: 'Tracker Installation', owner: 'Tracking firm', slaDays: 1, description: 'Tracking firm installs GPS device and uploads certificate' },
  { key: 'insurance_activation', label: 'Insurance Activation', owner: 'Insurance company', slaDays: 1, description: 'Insurer activates policy and uploads certificate' },
  { key: 'release_approval', label: 'Release Approval', owner: 'Collateral manager', slaDays: 1, description: 'Collateral manager formally approves vehicle for release to borrower' },
  { key: 'vehicle_delivery', label: 'Vehicle Delivery', owner: 'Auto dealer', slaDays: 2, description: 'Dealer delivers vehicle and uploads signed delivery note' },
  { key: 'documents_collection', label: 'Documents Collection', owner: 'Collateral manager', slaDays: 5, description: 'Collateral manager confirms receipt of all original documents' },
  { key: 'completed', label: 'Completed', owner: '—', slaDays: 0, description: 'Case fully closed and archived' },
];

export const STAGE_ORDER: WorkflowStage[] = [
  'dealer_handover', 'collateral_inspection', 'tracker_installation',
  'insurance_activation', 'release_approval', 'vehicle_delivery',
  'documents_collection', 'completed',
];

export function getRAGStatus(stage: WorkflowStage, updatedAt: string): RAGStatus {
  if (stage === 'completed') return 'green';
  const stageMeta = STAGES.find(s => s.key === stage);
  if (!stageMeta || stageMeta.slaDays === 0) return 'green';
  const updated = new Date(updatedAt).getTime();
  const now = Date.now();
  const hoursElapsed = (now - updated) / (1000 * 60 * 60);
  const slaHours = stageMeta.slaDays * 24;
  if (hoursElapsed >= slaHours) return 'red';
  if (hoursElapsed >= slaHours * 0.75) return 'amber';
  return 'green';
}

export function nextStage(stage: WorkflowStage): WorkflowStage | null {
  const idx = STAGE_ORDER.indexOf(stage);
  if (idx < 0 || idx >= STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[idx + 1];
}

// ── API response transforms ──────────────────────────────────────────────────
function transformDocument(raw: any): Document {
  return {
    id: raw.id,
    name: raw.documentName || raw.name || '',
    type: raw.documentType || raw.type || '',
    status: raw.status || 'pending',
    uploadedBy: raw.uploadedBy || '',
    uploadedAt: raw.createdAt || raw.uploadedAt || new Date().toISOString(),
    rejectionReason: raw.rejectionReason || undefined,
    url: raw.fileUrl || raw.url || '',
  };
}

function transformNotification(raw: any): Notification {
  return {
    id: raw.id,
    vehicleId: raw.loanId || raw.vehicleId,
    title: raw.title || '',
    message: raw.message || '',
    type: raw.type || 'milestone',
    read: raw.read ?? false,
    createdAt: raw.createdAt || new Date().toISOString(),
    dueDate: raw.dueDate || undefined,
  };
}

function transformLoan(raw: any): Vehicle {
  return {
    id: raw.id,
    caseRef: raw.caseRef || '',
    registration: raw.registration || '',
    vehicleMake: raw.vehicleMake || '',
    vehicleModel: raw.vehicleModel || '',
    vehicleYear: raw.vehicleYear ?? new Date().getFullYear(),
    vin: raw.vin || '',
    chassisNumber: raw.chassisNumber || '',
    engineNumber: raw.engineNumber || '',
    color: raw.color || '',
    assetValue: raw.assetValue ?? 0,
    disbursementDate: raw.disbursementDate || new Date().toISOString(),
    customerName: raw.customerName || '',
    borrowerContact: raw.borrowerContact || '',
    dealer: raw.dealer || '',
    accountOfficerId: raw.accountOfficerId || '',
    currentStage: (raw.currentStage || 'dealer_handover') as WorkflowStage,
    updatedAt: raw.updatedAt || new Date().toISOString(),
    status: (raw.status === 'completed' ? 'completed' : raw.status === 'flagged' ? 'flagged' : 'active') as Vehicle['status'],
    notes: raw.notes || '',
    documents: (raw.documents || []).map(transformDocument),
    notifications: (raw.notifications || []).map(transformNotification),
    releaseApproval: raw.releaseApprovedBy ? {
      approvedBy: raw.releaseApprovedBy,
      approvedAt: raw.releaseApprovedAt || new Date().toISOString(),
      remarks: raw.releaseRemarks || '',
      conditions: raw.releaseConditions || [],
    } : undefined,
    closureChecklist: raw.closureConfirmedBy ? {
      invoice: raw.closureChecklist?.invoice ?? false,
      customsPapers: raw.closureChecklist?.customsPapers ?? false,
      registrationCert: raw.closureChecklist?.registrationCert ?? false,
      insuranceCert: raw.closureChecklist?.insuranceCert ?? false,
      trackerCert: raw.closureChecklist?.trackerCert ?? false,
      deliveryNote: raw.closureChecklist?.deliveryNote ?? false,
      spareKey: raw.closureChecklist?.spareKey ?? false,
      confirmedBy: raw.closureConfirmedBy,
      confirmedAt: raw.closureConfirmedAt,
      remarks: raw.closureChecklist?.remarks || '',
    } : undefined,
    creditAdminClosure: raw.creditAdminConfirmedBy ? {
      confirmedBy: raw.creditAdminConfirmedBy,
      confirmedAt: raw.creditAdminConfirmedAt,
    } : undefined,
  };
}

// ── Loading / error state ─────────────────────────────────────────────────────
let _loading = false;
let _error: string | null = null;
let _initialized = false;

// ── In-memory store ──────────────────────────────────────────────────────────
let _auditLog: AuditEntry[] = [];
let _vehicles: Vehicle[] = [];
let _users: User[] = [];
let _notifListeners: (() => void)[] = [];

export const store = {

  getVehicles: () => [..._vehicles],
  getVehicle: (id: string) => _vehicles.find(v => v.id === id) || null,

  addVehicle: async (v: Omit<Vehicle, 'id' | 'caseRef' | 'currentStage' | 'updatedAt' | 'status' | 'documents' | 'notifications'>): Promise<Vehicle> => {
    const body: Record<string, any> = {
      customer_name: v.customerName,
      vehicle_make: v.vehicleMake,
      vehicle_model: v.vehicleModel,
      vehicle_year: v.vehicleYear,
      chassis_number: v.chassisNumber,
      engine_number: v.engineNumber,
      registration: v.registration,
      color: v.color,
      vin: v.vin,
      asset_value: v.assetValue,
      disbursement_date: v.disbursementDate,
      dealer: v.dealer,
      borrower_contact: v.borrowerContact,
      account_officer_id: v.accountOfficerId || undefined,
      notes: v.notes || undefined,
    };
    try {
      const data = await api.post('/api/loans', body);
      const vehicle = transformLoan(data);
      _vehicles = [vehicle, ..._vehicles];
      _notifyListeners();
      return vehicle;
    } catch (e: any) {
      _error = e.message || 'Failed to register vehicle';
      _loading = false;
      _notifyListeners();
      throw e;
    }
  },

  advanceStage: async (vehicleId: string, remarks?: string): Promise<Vehicle | null> => {
    try {
      const data = await api.put(`/api/loans/${vehicleId}/stage`, { remarks });
      const existing = _vehicles.find(v => v.id === vehicleId);
      const vehicle = transformLoan(data);
      if (existing) vehicle.documents = existing.documents;
      _vehicles = _vehicles.map(v => v.id === vehicleId ? vehicle : v);
      _notifyListeners();
      return vehicle;
    } catch (e: any) {
      _error = e.message || `Failed to advance stage for ${vehicleId}`;
      _loading = false;
      _notifyListeners();
      return null;
    }
  },

  approveRelease: async (vehicleId: string, remarks: string, conditions: string[]): Promise<void> => {
    try {
      const data = await api.put(`/api/loans/${vehicleId}/release`, { remarks, conditions });
      const existing = _vehicles.find(v => v.id === vehicleId);
      const vehicle = transformLoan(data);
      if (existing) vehicle.documents = existing.documents;
      _vehicles = _vehicles.map(v => v.id === vehicleId ? vehicle : v);
      _notifyListeners();
    } catch (e: any) {
      _error = e.message || `Failed to approve release for ${vehicleId}`;
      _loading = false;
      _notifyListeners();
      throw e;
    }
  },

  confirmDocuments: async (vehicleId: string, checklist: Omit<ClosureChecklist, 'confirmedBy' | 'confirmedAt'>): Promise<void> => {
    try {
      const data = await api.put(`/api/loans/${vehicleId}/documents-confirm`, {
        invoice: checklist.invoice,
        customsPapers: checklist.customsPapers,
        registrationCert: checklist.registrationCert,
        insuranceCert: checklist.insuranceCert,
        trackerCert: checklist.trackerCert,
        deliveryNote: checklist.deliveryNote,
        spareKey: checklist.spareKey,
        remarks: checklist.remarks,
      });
      const existing = _vehicles.find(v => v.id === vehicleId);
      const vehicle = transformLoan(data);
      if (existing) vehicle.documents = existing.documents;
      _vehicles = _vehicles.map(v => v.id === vehicleId ? vehicle : v);
      _notifyListeners();
    } catch (e: any) {
      _error = e.message || `Failed to confirm documents for ${vehicleId}`;
      _loading = false;
      _notifyListeners();
      throw e;
    }
  },

  creditAdminConfirmClosure: async (vehicleId: string): Promise<void> => {
    try {
      const data = await api.put(`/api/loans/${vehicleId}/confirm-closure`);
      const existing = _vehicles.find(v => v.id === vehicleId);
      const vehicle = transformLoan(data);
      if (existing) vehicle.documents = existing.documents;
      _vehicles = _vehicles.map(v => v.id === vehicleId ? vehicle : v);
      _notifyListeners();
    } catch (e: any) {
      _error = e.message || `Failed to confirm closure for ${vehicleId}`;
      _loading = false;
      _notifyListeners();
      throw e;
    }
  },

  closeCase: async (vehicleId: string): Promise<void> => {
    try {
      const data = await api.put(`/api/loans/${vehicleId}/close`);
      const existing = _vehicles.find(v => v.id === vehicleId);
      const vehicle = transformLoan(data);
      if (existing) vehicle.documents = existing.documents;
      _vehicles = _vehicles.map(v => v.id === vehicleId ? vehicle : v);
      _notifyListeners();
    } catch (e: any) {
      _error = e.message || `Failed to close case for ${vehicleId}`;
      _loading = false;
      _notifyListeners();
      throw e;
    }
  },

  uploadDocument: async (vehicleId: string, documentType: string, documentName: string, file: File): Promise<void> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('loanId', vehicleId);
    formData.append('documentType', documentType);
    formData.append('documentName', documentName);
    const data = await api.upload('/api/documents/upload', formData);
    const document = transformDocument(data);
    _vehicles = _vehicles.map(veh =>
      veh.id === vehicleId ? { ...veh, documents: [...veh.documents, document] } : veh
    );
    _notifyListeners();
  },

  verifyDocument: async (vehicleId: string, docId: string, status: 'approved' | 'rejected', reason?: string): Promise<void> => {
    const data = await api.put(`/api/documents/${docId}/verify`, { status, rejectionReason: reason });
    const document = transformDocument(data);
    _vehicles = _vehicles.map(veh =>
      veh.id === vehicleId
        ? { ...veh, documents: veh.documents.map(d => d.id === docId ? document : d) }
        : veh
    );
    _notifyListeners();
  },

  markNotificationRead: async (vehicleId: string, notifId: string): Promise<void> => {
    try {
      await api.put(`/api/notifications/${notifId}/read`);
    } catch { /* optimistic — still mark as read locally */ }
    _vehicles = _vehicles.map(v => {
      if (v.id !== vehicleId) return v;
      return { ...v, notifications: v.notifications.map(n => n.id === notifId ? { ...n, read: true } : n) };
    });
    _notifyListeners();
  },

  markAllRead: async (): Promise<void> => {
    try {
      await api.put('/api/notifications/read-all');
    } catch { /* optimistic — still mark as read locally */ }
    _vehicles = _vehicles.map(v => ({ ...v, notifications: v.notifications.map(n => ({ ...n, read: true })) }));
    _notifyListeners();
  },

  getAllNotifications: (): Notification[] =>
    _vehicles.flatMap(v => v.notifications).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),

  getAuditLog: (): AuditEntry[] => [..._auditLog],

  getUsers: () => [..._users],
  addUser: async (u: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
    const data: any = await api.post('/api/users', {
      fullname: u.fullname,
      email: u.email,
      role: u.role,
      organisation: u.organisation,
    });
    const user: User = {
      id: data.id,
      fullname: data.fullname || '',
      email: data.email || '',
      role: data.role || 'user',
      organisation: data.organisation || '',
      status: data.status ?? true,
      createdAt: data.createdAt || new Date().toISOString(),
    };
    _users.push(user);
    _notifyListeners();
    return user;
  },
  toggleUser: async (id: string): Promise<void> => {
    const u = _users.find(x => x.id === id);
    if (!u) return;
    await api.put(`/api/users/${id}`, { status: !u.status });
    _users = _users.map(x => x.id === id ? { ...x, status: !x.status } : x);
    _notifyListeners();
  },

  // ── Loading / error / init state ──────────────────────────────────────────────
  get loading() { return _loading; },
  get error() { return _error; },
  get initialized() { return _initialized; },

  // ── Async API fetch methods ───────────────────────────────────────────────────
  fetchVehicles: async (): Promise<void> => {
    try {
      _loading = true; _notifyListeners();
      const res: any = await api.get('/api/loans?page=1&limit=100');
      const list: any[] = res.data || res || [];
      const oldDocs = new Map(_vehicles.map(v => [v.id, v.documents]));
      _vehicles = list.map(transformLoan).map(v => ({
        ...v,
        documents: oldDocs.get(v.id) || v.documents,
      }));
      _error = null;
    } catch (err: any) {
      _error = err.message || 'Failed to fetch vehicles';
    } finally {
      _loading = false; _notifyListeners();
    }
  },

  fetchVehicle: async (id: string): Promise<Vehicle | null> => {
    try {
      const raw: any = await api.get(`/api/loans/${id}`);
      const loan = transformLoan(raw);
      const idx = _vehicles.findIndex(v => v.id === id);
      if (idx >= 0) _vehicles[idx] = loan;
      else _vehicles.unshift(loan);
      _notifyListeners();
      return loan;
    } catch {
      return null;
    }
  },

  fetchNotifications: async (): Promise<void> => {
    try {
      const raw: any = await api.get('/api/notifications?limit=50');
      const notifs: Notification[] = (Array.isArray(raw) ? raw : raw.data || []).map(transformNotification);
      _vehicles = _vehicles.map(v => ({
        ...v,
        notifications: notifs.filter(n => n.vehicleId === v.id),
      }));
      _notifyListeners();
    } catch {
      // Not critical — keep existing notifications
    }
  },

  fetchAuditLog: async (page = 1, limit = 50): Promise<{ data: AuditEntry[]; total: number }> => {
    try {
      const raw: any = await api.get(`/api/audit?page=${page}&limit=${limit}`);
      const list: any[] = raw.data || raw || [];
      const total: number = raw.pagination?.total || list.length;
      _auditLog = list.map((r: any) => ({
        id: r.id,
        vehicleId: r.loanId || r.vehicleId || '',
        caseRef: r.caseRef || '',
        entity: r.entityType || r.entity || 'Vehicle',
        action: r.action || '',
        performedBy: r.performedBy || '',
        performedAt: r.performedAt || r.createdAt || new Date().toISOString(),
        detail: r.detail || '',
        before: r.beforeValue || r.before,
        after: r.afterValue || r.after,
      })) as AuditEntry[];
      _notifyListeners();
      return { data: [..._auditLog], total };
    } catch {
      return { data: [..._auditLog], total: _auditLog.length };
    }
  },

  fetchUsers: async (): Promise<void> => {
    try {
      const raw: any = await api.get('/api/users');
      const list: any[] = Array.isArray(raw) ? raw : raw.data || [];
      _users = list.map((r: any) => ({
        id: r.id,
        fullname: r.fullname || '',
        email: r.email || '',
        role: r.role || 'user',
        organisation: r.organisation || '',
        status: r.status ?? true,
        createdAt: r.createdAt || new Date().toISOString(),
      })) as User[];
      _notifyListeners();
    } catch {
      // Keep existing users
    }
  },

  refresh: async (): Promise<void> => {
    _loading = true; _error = null; _notifyListeners();
    await Promise.allSettled([
      store.fetchVehicles(),
      store.fetchNotifications(),
      store.fetchUsers(),
    ]);
    _initialized = true;
    _loading = false; _notifyListeners();
  },

  subscribe: (fn: () => void) => {
    _notifListeners.push(fn);
    return () => { _notifListeners = _notifListeners.filter(f => f !== fn); };
  },
};

function _notifyListeners() { _notifListeners.forEach(f => f()); }
