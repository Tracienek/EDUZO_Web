// client/src/pages/workspace/notification/Notification.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/auth/AuthContext";
import {
    getMyNotifications,
    markAllNotificationsRead,
    markNotificationRead,
    deleteNotification,
    deleteAllNotifications,
} from "../../../services/notificationService";

import "./Notification.css";
import { apiUtils } from "../../../utils/newRequest";

const getMyId = (userInfo) => userInfo?._id || userInfo?.userId;

export default function NotificationsPage() {
    const navigate = useNavigate();
    const { userInfo } = useAuth();
    const myId = useMemo(() => getMyId(userInfo), [userInfo]);

    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);

    const refresh = async () => {
        try {
            setLoading(true);
            const list = await getMyNotifications();
            setItems(Array.isArray(list) ? list : []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const isRead = (n) =>
        myId ? (n.readBy || []).some((x) => String(x) === String(myId)) : false;

    // ===== delete one notification =====
    const deleteOne = async (n) => {
        const ok = window.confirm(
            "Delete this notification?\nThis action cannot be undone.",
        );
        if (!ok) return;

        try {
            await deleteNotification(n._id);
            setItems((prev) => prev.filter((x) => x._id !== n._id));
        } catch (err) {
            alert(
                err?.response?.data?.message || "Failed to delete notification",
            );
        }
    };

    // ===== delete all notifications =====
    const deleteAll = async () => {
        const ok = window.confirm(
            "Delete ALL notifications?\nThis action cannot be undone.",
        );
        if (!ok) return;

        try {
            await deleteAllNotifications();
            setItems([]);
        } catch (err) {
            alert(
                err?.response?.data?.message ||
                    "Failed to delete all notifications",
            );
        }
    };

    const openNoti = async (n) => {
        // mark read locally + api
        if (!isRead(n)) {
            try {
                await markNotificationRead(n._id);
                setItems((prev) =>
                    prev.map((x) =>
                        x._id === n._id
                            ? { ...x, readBy: [...(x.readBy || []), myId] }
                            : x,
                    ),
                );
            } catch {
                // ignore
            }
        }

        // go class detail (if exists)
        if (n.classId) {
            try {
                await apiUtils.get(`/classes/${n.classId}`);

                // ✅ optional: jump to tuition area if it's a tuition due notification
                const q = n.title === "Tuition due" ? "?tab=tuition" : "";
                navigate(`/workspace/classes/${n.classId}${q}`);
            } catch (err) {
                alert(
                    err?.response?.data?.message ||
                        "Lớp đã bị xóa hoặc không tồn tại.",
                );
            }
        }
    };

    const markAll = async () => {
        try {
            await markAllNotificationsRead();
            if (myId) {
                setItems((prev) =>
                    prev.map((x) => ({
                        ...x,
                        readBy: [...new Set([...(x.readBy || []), myId])],
                    })),
                );
            }
        } catch (err) {
            alert(
                err?.response?.data?.message ||
                    "Failed to mark all notifications as read",
            );
        }
    };

    return (
        <div className="noti-wrap">
            <div className="noti-head">
                <div className="noti-title">Notifications</div>

                <div className="noti-actions">
                    <button
                        type="button"
                        className="noti-btn"
                        onClick={refresh}
                        disabled={loading}
                    >
                        Refresh
                    </button>

                    <button
                        type="button"
                        className="noti-btn-primary"
                        onClick={markAll}
                        disabled={loading || !items.length}
                    >
                        Mark all as read
                    </button>

                    <button
                        type="button"
                        className="noti-btn-danger"
                        onClick={deleteAll}
                        disabled={loading || !items.length}
                    >
                        Delete all
                    </button>
                </div>
            </div>

            {loading && <div className="noti-muted">Loading...</div>}

            {!loading && items.length === 0 && (
                <div className="noti-empty">No notifications yet</div>
            )}

            <div className="noti-list">
                {items.map((n) => {
                    const read = isRead(n);
                    const isTuition = n.title === "Tuition due";

                    // ✅ IMPORTANT: use div role="button" to avoid nested button warning
                    return (
                        <div
                            key={n._id}
                            className={`noti-item ${
                                read ? "is-read" : "is-unread"
                            } ${isTuition ? "is-tuition" : ""}`}
                            role="button"
                            tabIndex={0}
                            onClick={() => openNoti(n)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    openNoti(n);
                                }
                            }}
                            title={n.classId ? "Open class detail" : "Open"}
                        >
                            <div className="noti-item-top">
                                <div className="noti-item-time">
                                    {n.createdAt
                                        ? new Date(n.createdAt).toLocaleString()
                                        : ""}
                                </div>

                                <div className="noti-item-right">
                                    {!read && (
                                        <span
                                            className="noti-dot"
                                            aria-hidden="true"
                                        />
                                    )}

                                    <button
                                        type="button"
                                        className="noti-delete"
                                        title="Delete notification"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteOne(n);
                                        }}
                                        onKeyDown={(e) => e.stopPropagation()}
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>

                            {/* ✅ show title if exists */}
                            {!!n.title && (
                                <div className="noti-item-title">{n.title}</div>
                            )}

                            {!!n.className && (
                                <div className="noti-item-sub">
                                    Class: {n.className}
                                </div>
                            )}

                            <div className="noti-item-content">{n.content}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
