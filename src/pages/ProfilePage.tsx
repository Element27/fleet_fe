import { User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Your account information.</p>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-5 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <User size={28} className="text-primary" />
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">{user?.fullname}</div>
            <div className="text-sm text-gray-500">{user?.email}</div>
            <span className="badge bg-primary/10 text-primary text-xs mt-1 capitalize">{user?.role?.replace('_', ' ')}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Full Name</label>
            <input className="input bg-gray-50 text-gray-500" value={user?.fullname || ''} disabled />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input bg-gray-50 text-gray-500" value={user?.email || ''} disabled />
          </div>
          <div>
            <label className="label">Organisation</label>
            <input className="input bg-gray-50 text-gray-500" value={user?.organisation || ''} disabled />
          </div>
          <div>
            <label className="label">Role</label>
            <input className="input bg-gray-50 text-gray-500" value={user?.role?.replace('_', ' ') || ''} disabled />
          </div>
        </div>
      </div>
    </div>
  );
}
