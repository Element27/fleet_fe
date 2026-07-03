import { useAuth } from '../hooks/useAuth';

const PERMISSIONS: Record<string, string[]> = {
  admin: [
    'viewLoans', 'createLoan', 'advanceStage', 'approveRelease',
    'confirmDocuments', 'closeCase', 'creditAdminConfirm',
    'verifyDocument', 'uploadDocument', 'viewUsers', 'manageUsers',
    'viewReports', 'viewAudit',
  ],
  collateral_manager: [
    'viewLoans', 'createLoan', 'advanceStage', 'approveRelease',
    'confirmDocuments', 'closeCase', 'verifyDocument',
    'uploadDocument', 'viewReports', 'viewAudit',
  ],
  account_officer: [
    'viewLoans', 'createLoan', 'uploadDocument',
  ],
  credit_administration: [
    'viewLoans', 'creditAdminConfirm', 'viewReports',
  ],
  relationship_manager: [
    'viewLoans', 'viewReports',
  ],
  dealer: [
    'viewLoans', 'uploadDocument',
  ],
  tracking_company: [
    'viewLoans', 'uploadDocument',
  ],
  insurance_provider: [
    'viewLoans', 'uploadDocument',
  ],
  operations: [
    'viewLoans',
  ],
  user: [
    'viewLoans', 'uploadDocument',
  ],
};

export function can(role: string, action: string): boolean {
  return PERMISSIONS[role]?.includes(action) ?? false;
}

export function useCan(action: string): boolean {
  const { user } = useAuth();
  if (!user) return false;
  return can(user.role, action);
}
