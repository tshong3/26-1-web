import { create } from 'zustand';
import { notificationService } from '../services/notificationService';

const useNotificationStore = create((set) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchUnreadCount: async () => {
    try {
      const res = await notificationService.getUnreadCount();
      if (res.success) {
        set({ unreadCount: res.data.count || 0 });
      }
    } catch (error) {
      console.error('안 읽은 알림 개수 조회 에러:', error);
    }
  },

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const res = await notificationService.getNotifications();
      if (res.success) {
        set({ notifications: res.data || [] });
      }
    } catch (error) {
      console.error('알림 목록 조회 에러:', error);
    } finally {
      set({ loading: false });
    }
  },

  markAsRead: async (id) => {
    // 빠른 UX를 위해 UI를 먼저 변경하고 서버에 요청을 보냄
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, is_read: 1 } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1)
    }));

    try {
      await notificationService.markAsRead(id);
    } catch (error) {
      console.error('알림 읽음 처리 에러:', error);
    }
  },

  markAllAsRead: async () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, is_read: 1 })),
      unreadCount: 0
    }));

    try {
      await notificationService.markAllAsRead();
    } catch (error) {
      console.error('알림 모두 읽음 처리 에러:', error);
    }
  }
}));

export default useNotificationStore;