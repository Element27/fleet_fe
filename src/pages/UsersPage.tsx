import { useState } from 'react';
import { UserPlus, CheckCircle, XCircle, Shield } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { store, type User } from '../data/store';
import { useAuth } from '../hooks/useAuth';
import { can } from '../lib/permissions';
import RequirePermission from '../components/RequirePermission';
import { toast } from '../lib/toast';
import { format } from 'date-fns';

const ROLES = ['admin', 'collateral_manager', 'account_officer', 'credit_administration', 'relationship_manager', 'operations', 'dealer', 'tracking_company', 'insurance_provider', 'user'];

export function UsersPage() {
  const { users: storeUsers } = useStore();
  const { user } = useAuth();
  const role = user?.role || '';
  const [users, setUsers] = useState<User[]>(storeUsers);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fullname: '', email: '', role: 'user', organisation: '' });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await store.addUser({
        fullname: form.fullname,
        email: form.email,
        role: form.role as User['role'],
        organisation: form.organisation,
        status: true,
      });
      setUsers(prev => [created, ...prev]);
      toast.success('User created', `${form.fullname} added to FleetGuard.`);
    } catch (err: any) {
      toast.error('Failed to create user', err.message);
    }
    setForm({ fullname: '', email: '', role: 'user', organisation: '' });
    setShowForm(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 text-sm mt-1">{users.length} registered users</p>
        </div>
        <RequirePermission action="manageUsers">
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            <UserPlus size={15} /> Add User
          </button>
        </RequirePermission>
      </div>

      {showForm && (
        <div className="card p-6 mb-5 border border-primary/20">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">New User</h2>
          <form onSubmit={handleAdd} className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input className="input" value={form.fullname} onChange={set('fullname')} required placeholder="Amara Okafor" />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={set('email')} required placeholder="amara@bank.com" />
            </div>
            <div>
              <label className="label">Organisation</label>
              <input className="input" value={form.organisation} onChange={set('organisation')} placeholder="FleetGuard Bank" />
            </div>
            <div>
              <label className="label">Role</label>
              <select className="input" value={form.role} onChange={set('role')}>
                {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="col-span-2 flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn-primary">Create User</button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {['Name', 'Email', 'Organisation', 'Role', 'Joined', 'Status', ''].map(h => (
                <th key={h} className="text-left text-xs text-gray-400 font-semibold uppercase tracking-wider py-3 px-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4 font-medium text-gray-900">
                  <div className="flex items-center gap-2">
                    {u.role === 'admin' && <Shield size={12} className="text-primary" />}
                    {u.fullname}
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-500">{u.email}</td>
                <td className="py-3 px-4 text-gray-500">{u.organisation || '—'}</td>
                <td className="py-3 px-4">
                  <span className="badge bg-gray-100 text-gray-700 capitalize text-xs">{u.role.replace('_', ' ')}</span>
                </td>
                <td className="py-3 px-4 text-gray-400 text-xs">{format(new Date(u.createdAt), 'dd MMM yyyy')}</td>
                <td className="py-3 px-4">
                  <span className={`flex items-center gap-1 text-xs font-medium ${u.status ? 'text-green-600' : 'text-gray-400'}`}>
                    {u.status ? <CheckCircle size={12} /> : <XCircle size={12} />}
                    {u.status ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {can(role, 'manageUsers') && (
                    <button onClick={async () => {
                      try {
                        await store.toggleUser(u.id);
                        setUsers(prev => prev.map(x => x.id === u.id ? { ...x, status: !x.status } : x));
                        toast.info(u.status ? 'User deactivated' : 'User activated');
                      } catch (err: any) {
                        toast.error('Failed to update user', err.message);
                      }
                    }}
                      className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
                      {u.status ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
