import { create } from 'zustand';
import { notificationService } from '../services/notificationService';

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  nextCursor: null,
  loading: false,

  // 안 읽은 알림 개수 새로고침(배지)
  fetchUnreadCount: async () => {
    try {
      const data = await notificationService.getUnreadCount();
      set({ unreadCount: data.count });
    } catch (error) {
      console.error('안 읽은 알림 개수 조회 실패:', error);
    }
  },

  // 알림 목록 불러오기(최신순)
  fetchNotifications: async (isMore = false) => {
    set({ loading: true });
    try {
      const params = { limit: 20 };
      if (isMore && get().nextCursor) {
        params.cursor = get().nextCursor;
      }

      const data = await notificationService.getNotifications(params);
      
      set((state) => ({
        notifications: isMore ? [...state.notifications, ...data.notifications] : data.notifications,
        nextCursor: data.nextCursor,
        loading: false
      }));
    } catch (error) {
      console.error('알림 목록 조회 실패:', error);
      set({ loading: false });
    }
  },

  // 특정 알림 읽음 처리
  markAsRead: async (id) => {
    try {
      await notificationService.markAsRead(id);
      // 로컬 상태 즉시 업데이트(서버 다시 안 불러와도 되게끔)
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, is_read: 1 } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error);
    }
  },

  // 모든 알림 읽음 처리
  markAllAsRead: async () => {
    try {
      await notificationService.markAllAsRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, is_read: 1 })),
        unreadCount: 0
      }));
    } catch (error) {
      console.error('전체 알림 읽음 처리 실패:', error);
    }
  }
}));

export default useNotificationStore;