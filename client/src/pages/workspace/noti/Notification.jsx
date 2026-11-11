// client/src/pages/workspace/notification/Notification.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
    const { t } = useTranslation();
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

    const deleteOne = async (n) => {
        const ok = window.confirm(t("notifications.confirmDeleteOne"));
        if (!ok) return;

        try {
            await deleteNotification(n._id);
            setItems((prev) => prev.filter((x) => x._id !== n._id));
        } catch (err) {
            alert(
                err?.response?.data?.message ||
                    t("notifications.deleteOneFailed"),
            );
        }
    };

    const deleteAll = async () => {
        const ok = window.confirm(t("notifications.confirmDeleteAll"));
        if (!ok) return;

        try {
            await deleteAllNotifications();
            setItems([]);
        } catch (err) {
            alert(
                err?.response?.data?.message ||
                    t("notifications.deleteAllFailed"),
            );
        }
    };

    const openNoti = async (n) => {
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

        if (n.classId) {
            try {
                await apiUtils.get(`/classes/${n.classId}`);

                const isTuition =
                    n.title === "Tuition due" ||
                    n.title === t("notifications.tuitionDueTitle");

                const q = isTuition ? "?tab=tuition" : "";
                navigate(`/workspace/classes/${n.classId}${q}`);
            } catch (err) {
                alert(
                    err?.response?.data?.message ||
                        t("notifications.classNotFound"),
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
                    t("notifications.markAllFailed"),
            );
        }
    };

    return (
        <div className="noti-wrap">
            <div className="noti-head">
                <div className="noti-title">{t("notifications.title")}</div>

                <div className="noti-actions">
                    <button
                        type="button"
                        className="noti-btn"
                        onClick={refresh}
                        disabled={loading}
                    >
                        {t("notifications.refresh")}
                    </button>

                    <button
                        type="button"
                        className="noti-btn-primary"
                        onClick={markAll}
                        disabled={loading || !items.length}
                    >
                        {t("notifications.markAll")}
                    </button>

                    <button
                        type="button"
                        className="noti-btn-danger"
                        onClick={deleteAll}
                        disabled={loading || !items.length}
                    >
                        {t("notifications.deleteAll")}
                    </button>
                </div>
            </div>

            {loading && (
                <div className="noti-muted">{t("notifications.loading")}</div>
            )}

            {!loading && items.length === 0 && (
                <div className="noti-empty">{t("notifications.empty")}</div>
            )}

            <div className="noti-list">
                {items.map((n) => {
                    const read = isRead(n);
                    const isTuition =
                        n.title === "Tuition due" ||
                        n.title === t("notifications.tuitionDueTitle");

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
                            title={
                                n.classId
                                    ? t("notifications.openClassDetail")
                                    : t("notifications.open")
                            }
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
                                        title={t("notifications.delete")}
                                        aria-label={t("notifications.delete")}
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

                            {!!n.title && (
                                <div className="noti-item-title">
                                    {n.title === "Tuition due"
                                        ? t("notifications.tuitionDueTitle")
                                        : n.title}
                                </div>
                            )}

                            {!!n.className && (
                                <div className="noti-item-sub">
                                    {t("notifications.classLabel", {
                                        name: n.className,
                                    })}
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
