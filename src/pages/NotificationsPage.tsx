import { Bell, CheckCheck, AlertTriangle, Info, Milestone } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { store } from '../data/store';
import { clsx } from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const TYPE_STYLES = {
  milestone: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-100' },
  reminder: { bg: 'bg-amber-50', icon: 'text-amber-600', border: 'border-amber-100' },
  escalation: { bg: 'bg-red-50', icon: 'text-red-600', border: 'border-red-100' },
};

const TYPE_ICONS = {
  milestone: Bell,
  reminder: AlertTriangle,
  escalation: AlertTriangle,
};

export function NotificationsPage() {
  const { notifications, vehicles } = useStore();
  const navigate = useNavigate();

  const handleMarkAll = () => store.markAllRead();
  const handleRead = (vehicleId: string, notifId: string) => store.markNotificationRead(vehicleId, notifId);

  const unread = notifications.filter(n => !n.read).length;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 text-sm mt-1">{unread > 0 ? `${unread} unread alerts` : 'All caught up'}</p>
        </div>
        {unread > 0 && (
          <button onClick={handleMarkAll} className="btn-secondary text-xs">
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card p-16 text-center">
          <Bell size={36} className="text-gray-200 mx-auto mb-3" />
          <div className="text-gray-400 text-sm">No notifications yet.</div>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const vehicle = vehicles.find(v => v.id === n.vehicleId);
            const styles = TYPE_STYLES[n.type];
            const Icon = TYPE_ICONS[n.type];
            return (
              <div key={n.id}
                className={clsx('card border p-4 flex gap-4 cursor-pointer hover:shadow-md transition-all',
                  !n.read ? styles.border : 'border-gray-100',
                  !n.read ? styles.bg : 'bg-white')}
                onClick={() => {
                  handleRead(n.vehicleId, n.id);
                  if (vehicle) navigate(`/vehicles/${vehicle.id}`);
                }}>
                <div className={clsx('w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5',
                  !n.read ? '' : 'bg-gray-100')}>
                  <Icon size={15} className={!n.read ? styles.icon : 'text-gray-400'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className={clsx('text-sm font-semibold', !n.read ? 'text-gray-900' : 'text-gray-600')}>
                      {n.title}
                    </span>
                    <span className="text-xs text-gray-400 shrink-0">{formatDistanceToNow(new Date(n.createdAt))} ago</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{n.message}</p>
                  {vehicle && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-400 font-mono">{vehicle.registration}</span>
                      <span className="text-gray-300">·</span>
                      <span className="text-xs text-gray-400">{vehicle.vehicleMake} {vehicle.vehicleModel}</span>
                    </div>
                  )}
                  {n.dueDate && (
                    <div className="flex items-center gap-1 mt-1.5">
                      <span className="text-xs text-amber-600 font-medium">Due: {new Date(n.dueDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                {!n.read && <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
