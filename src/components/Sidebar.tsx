import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Car, GitBranch, BarChart3, Bell, Users, Shield, Zap, FileCheck, ClipboardList, User } from 'lucide-react';
import { UserButton } from '@clerk/clerk-react';
import { useAuth } from '../hooks/useAuth';
import { useStore } from '../hooks/useStore';
import { can } from '../lib/permissions';
import { clsx } from 'clsx';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/next-actions', icon: Zap, label: 'Next Actions' },
  { to: '/vehicles', icon: Car, label: 'Vehicles' },
  { to: '/workflow', icon: GitBranch, label: 'Workflow' },
  { to: '/documents', icon: FileCheck, label: 'Documents' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/audit', icon: ClipboardList, label: 'Audit Trail' },
];

const adminItems = [
  { to: '/users', icon: Users, label: 'Users' },
];

const bottomItems = [
  { to: '/profile', icon: User, label: 'Profile & Settings' },
];

export function Sidebar() {
  const { user } = useAuth();
  const { unreadCount } = useStore();
  const role = user?.role || '';

  return (
    <aside className="w-52 shrink-0 bg-[#0f2a2a] text-white flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Shield size={16} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-bold leading-none">FleetGuard</div>
            <div className="text-[10px] text-white/50 mt-0.5 leading-none">Post-disbursement</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              clsx('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative',
                isActive ? 'bg-white/15 text-white' : 'text-white/60 hover:bg-white/8 hover:text-white/90')
            }>
            <Icon size={16} />
            <span>{label}</span>
            {label === 'Notifications' && unreadCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </NavLink>
        ))}

        {can(role, 'viewUsers') && (
          <>
            <div className="pt-3 pb-1 px-3">
              <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Admin</span>
            </div>
            {adminItems.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) =>
                  clsx('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                    isActive ? 'bg-white/15 text-white' : 'text-white/60 hover:bg-white/8 hover:text-white/90')}>
                <Icon size={16} /><span>{label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-white/10">
        {bottomItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              clsx('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-1',
                isActive ? 'bg-white/15 text-white' : 'text-white/60 hover:bg-white/8 hover:text-white/90')}>
            <Icon size={16} /><span>{label}</span>
          </NavLink>
        ))}
        <div className="flex items-center gap-3 px-3 py-2">
          <UserButton afterSignOutUrl="/auth" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-white/80 truncate">{user?.email}</div>
            <div className="text-[10px] text-white/40 capitalize mt-0.5">{user?.role?.replace('_', ' ')}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
