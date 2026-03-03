// client/src/services/notificationService.js
import { apiUtils } from "../utils/newRequest";

export const getMyNotifications = async () => {
    const res = await apiUtils.get("/notifications");
    return res?.data?.metadata?.notifications || [];
};

export const markNotificationRead = async (id) => {
    const res = await apiUtils.patch(`/notifications/${id}/read`);
    return res?.data?.metadata || res?.data;
};

export const markAllNotificationsRead = async () => {
    const res = await apiUtils.patch(`/notifications/read-all`);
    return res?.data?.metadata || res?.data;
};

export const deleteNotification = async (id) => {
    const res = await apiUtils.delete(`/notifications/${id}`);
    return res?.data?.metadata || res?.data;
};

export const deleteAllNotifications = async () => {
    const res = await apiUtils.delete(`/notifications/delete-all`);
    return res?.data?.metadata || res?.data;
};
