import api from './api';

export const notificationService = {
  // 알림 목록 조회
  getNotifications: async (params = {}) => {
    const response = await api.get('/api/notifications', { params });
    return response.data;
  },

  // 안 읽은 알림 개수 조회(배지)
  getUnreadCount: async () => {
    const response = await api.get('/api/notifications/unread-count');
    return response.data;
  },

  // 개별 알림 읽음 처리
  markAsRead: async (id) => {
    const response = await api.patch(`/api/notifications/${id}/read`);
    return response.data;
  },

  // 전체 알림 읽음 처리
  markAllAsRead: async () => {
    const response = await api.patch('/api/notifications/read-all');
    return response.data;
  }
};