import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useToasts } from '../lib/toast';
import { clsx } from 'clsx';

const icons = { success: CheckCircle, error: XCircle, info: Info, warning: AlertTriangle };
const colors = {
  success: 'border-l-green-500 bg-white',
  error: 'border-l-red-500 bg-white',
  info: 'border-l-blue-500 bg-white',
  warning: 'border-l-amber-500 bg-white',
};
const iconColors = { success: 'text-green-500', error: 'text-red-500', info: 'text-blue-500', warning: 'text-amber-500' };

export function Toaster() {
  const { toasts, dismiss } = useToasts();
  if (!toasts.length) return null;
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80">
      {toasts.map(t => {
        const Icon = icons[t.type];
        return (
          <div key={t.id} className={clsx('toast flex items-start gap-3 p-4 rounded-xl shadow-lg border border-l-4', colors[t.type])}>
            <Icon size={18} className={clsx('shrink-0 mt-0.5', iconColors[t.type])} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{t.title}</p>
              {t.message && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{t.message}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} className="shrink-0 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
