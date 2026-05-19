import { useToastStore } from '@/stores/useToastStore';
import { cn } from '@/lib/utils';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export const ToastContainer = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-4 left-1/2 z-[200] flex w-full max-w-sm -translate-x-1/2 flex-col space-y-2 px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'flex items-center justify-between rounded-lg p-4 shadow-lg animate-in fade-in slide-in-from-top-4',
            toast.type === 'success' && 'bg-green-600 text-white',
            toast.type === 'error' && 'bg-red-600 text-white',
            toast.type === 'info' && 'bg-blue-600 text-white'
          )}
        >
          <div className="flex items-center space-x-2">
            {toast.type === 'success' && <CheckCircle className="h-5 w-5" />}
            {toast.type === 'error' && <AlertCircle className="h-5 w-5" />}
            {toast.type === 'info' && <Info className="h-5 w-5" />}
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
          <button onClick={() => removeToast(toast.id)}>
            <X className="h-4 w-4 opacity-70 hover:opacity-100" />
          </button>
        </div>
      ))}
    </div>
  );
};
