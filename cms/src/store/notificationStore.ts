import { create } from 'zustand';

export type NotificationType = 'success' | 'error' | 'info';

interface NotificationState {
  message: string | null;
  type: NotificationType;
  timeoutId?: ReturnType<typeof setTimeout>;
  showNotification: (message: string, type?: NotificationType, durationMs?: number) => void;
  clearNotification: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  message: null,
  type: 'info',
  timeoutId: undefined,

  showNotification: (message, type = 'info', durationMs = 3000) => {
    const { timeoutId } = get();
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const newTimeoutId = setTimeout(() => {
      set({ message: null, timeoutId: undefined });
    }, durationMs);

    set({
      message,
      type,
      timeoutId: newTimeoutId,
    });
  },

  clearNotification: () => {
    const { timeoutId } = get();
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    set({ message: null, timeoutId: undefined });
  },
}));
