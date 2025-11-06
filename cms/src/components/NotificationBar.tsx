import { useEffect } from 'react';
import { useNotificationStore } from '../store/notificationStore';

const typeStyles: Record<string, string> = {
  success: 'bg-emerald-100 border-emerald-200 text-emerald-800',
  error: 'bg-red-100 border-red-200 text-red-800',
  info: 'bg-sky-100 border-sky-200 text-sky-800',
};

const NotificationBar: React.FC = () => {
  const { message, type, clearNotification } = useNotificationStore((state) => ({
    message: state.message,
    type: state.type,
    clearNotification: state.clearNotification,
  }));

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        clearNotification();
      }
    };

    if (message) {
      window.addEventListener('keydown', handler);
    }

    return () => {
      window.removeEventListener('keydown', handler);
    };
  }, [message, clearNotification]);

  if (!message) {
    return null;
  }

  const style = typeStyles[type] ?? typeStyles.info;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-xl">
      <div className={`flex items-start gap-3 rounded-lg border shadow-lg px-4 py-3 ${style}`}>
        <div className="text-sm font-medium leading-5 flex-1">{message}</div>
        <button
          type="button"
          onClick={clearNotification}
          aria-label="关闭提示"
          className="text-current/60 hover:text-current focus:outline-none"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default NotificationBar;
