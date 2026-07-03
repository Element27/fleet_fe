import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { Layout } from './components/Layout';
import { Toaster } from './components/Toaster';
import { RequirePermissionRoute } from './components/RequirePermission';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { VehiclesPage, VehicleDetailPage } from './pages/VehiclesPage';
import { WorkflowPage } from './pages/WorkflowPage';
import { ReportsPage } from './pages/ReportsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { UsersPage } from './pages/UsersPage';
import { AuditTrailPage } from './pages/AuditTrailPage';
import { NextActionsPage } from './pages/NextActionsPage';
import { DocumentChecklistPage } from './pages/DocumentChecklistPage';
import { ReleaseApprovalPage } from './pages/ReleaseApprovalPage';
import { DocumentsCollectionPage } from './pages/DocumentsCollectionPage';
import { CaseClosurePage } from './pages/CaseClosurePage';
import { ProfilePage } from './pages/ProfilePage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/next-actions" element={<NextActionsPage />} />
            <Route path="/vehicles" element={<VehiclesPage />} />
            <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
            <Route path="/workflow" element={<WorkflowPage />} />
            <Route path="/documents" element={<DocumentChecklistPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/reports" element={<RequirePermissionRoute action="viewReports"><ReportsPage /></RequirePermissionRoute>} />
            <Route path="/audit" element={<RequirePermissionRoute action="viewAudit"><AuditTrailPage /></RequirePermissionRoute>} />
            <Route path="/users" element={<RequirePermissionRoute action="viewUsers"><UsersPage /></RequirePermissionRoute>} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/release/:id" element={<RequirePermissionRoute action="approveRelease"><ReleaseApprovalPage /></RequirePermissionRoute>} />
            <Route path="/documents-collection/:id" element={<RequirePermissionRoute action="confirmDocuments"><DocumentsCollectionPage /></RequirePermissionRoute>} />
            <Route path="/case-closure/:id" element={<RequirePermissionRoute action="closeCase"><CaseClosurePage /></RequirePermissionRoute>} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
}
