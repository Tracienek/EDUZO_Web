// pages/workspace/classes/ClassesPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiUtils } from "../../../utils/newRequest";
import "./ClassesPage.css";
import { useAuth } from "../../../context/auth/AuthContext";

function ClassCard({ c, onOpen, onDelete, canDelete, t }) {
    const isOnline = !!c?.isOnline;
    const duration = c?.durationMinutes ?? 90;

    return (
        <div
            className="class-card"
            role="button"
            tabIndex={0}
            onClick={onOpen}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpen();
                }
            }}
        >
            <div className="class-card-top">
                <div className="class-card-title-wrap">
                    <span
                        className={`dot ${isOnline ? "dot-green" : "dot-gray"}`}
                    />

                    <div className="class-card-title-text">
                        <div className="class-card-title">
                            {c?.name ||
                                c?.className ||
                                t("classesPage.unnamedClass")}
                        </div>

                        <div className="class-card-sub">
                            {c?.subject || t("classesPage.emptyValue")}
                        </div>
                    </div>
                </div>

                {canDelete && (
                    <button
                        className="class-card-delete"
                        type="button"
                        title={t("classesPage.deleteClass")}
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete?.(c);
                        }}
                    >
                        ✕
                    </button>
                )}
            </div>

            <div className="class-card-meta">
                <div className="class-card-row">
                    <span className="label">{t("classesPage.students")}</span>
                    <span className="pill">
                        {c?.totalStudents ??
                            c?.studentCount ??
                            t("classesPage.emptyValue")}
                    </span>
                </div>

                <div className="class-card-row">
                    <span className="label">{t("classesPage.schedule")}</span>
                    <span className="value">
                        {c?.scheduleText || t("classesPage.defaultSchedule")}
                    </span>
                </div>

                <div className="class-card-row">
                    <span className="label">{t("classesPage.duration")}</span>
                    <span className="value">
                        {t("classesPage.durationMinutes", { count: duration })}
                    </span>
                </div>
            </div>

            <div className="class-card-footer">
                <span className="linkish">{t("classesPage.viewDetails")}</span>
            </div>
        </div>
    );
}

export default function ClassesPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [classes, setClasses] = useState([]);
    const { userInfo } = useAuth();
    const isCenter = userInfo?.role === "center";

    const pageTitle = isCenter
        ? t("classesPage.centerClasses", {
              name: userInfo?.fullName || t("classesPage.centerFallback"),
          })
        : t("classesPage.myClasses");

    const fetchClasses = async (setLoadingFlag = false) => {
        try {
            if (setLoadingFlag) setLoading(true);

            const res = await apiUtils.get("/classes/available");
            const data = res?.data?.metadata || res?.data || {};
            const list = Array.isArray(data.classes)
                ? data.classes
                : Array.isArray(data)
                  ? data
                  : [];

            setClasses(list);
        } catch {
            setClasses([]);
        } finally {
            if (setLoadingFlag) setLoading(false);
        }
    };

    useEffect(() => {
        let alive = true;

        (async () => {
            if (!alive) return;
            await fetchClasses(true);
        })();

        const timer = setInterval(() => {
            if (!alive) return;
            fetchClasses(false);
        }, 20000);

        return () => {
            alive = false;
            clearInterval(timer);
        };
    }, []);

    const openClass = (c) => navigate(`/workspace/classes/${c._id}`);

    const onlineClasses = useMemo(
        () => classes.filter((c) => !!c?.isOnline),
        [classes],
    );

    const offlineClasses = useMemo(
        () => classes.filter((c) => !c?.isOnline),
        [classes],
    );

    const handleDelete = async (cls) => {
        if (!isCenter) {
            alert(t("classesPage.notAllowedDelete"));
            return;
        }

        const ok = window.confirm(
            t("classesPage.confirmDelete", {
                name: cls?.name || t("classesPage.unnamedShort"),
            }),
        );
        if (!ok) return;

        try {
            await apiUtils.delete(`/classes/${cls._id}`);
            setClasses((prev) => prev.filter((c) => c._id !== cls._id));
        } catch (err) {
            alert(
                err?.response?.data?.message || t("classesPage.deleteFailed"),
            );
        }
    };

    return (
        <div className="classes-page">
            <div className="classes-page-header">
                <h2>{t("classesPage.onlineClass")}</h2>
            </div>

            {loading && (
                <div className="classes-muted">{t("classesPage.loading")}</div>
            )}

            {!loading && onlineClasses.length === 0 && (
                <div className="classes-muted">
                    {t("classesPage.noActiveClass")}
                </div>
            )}

            {!loading && onlineClasses.length > 0 && (
                <div className="classes-grid">
                    {onlineClasses.map((c) => (
                        <ClassCard
                            key={c._id}
                            c={c}
                            onOpen={() => openClass(c)}
                            onDelete={handleDelete}
                            canDelete={isCenter}
                            t={t}
                        />
                    ))}
                </div>
            )}

            <div className="classes-page-header" style={{ marginTop: 18 }}>
                <h2 title={pageTitle}>{pageTitle}</h2>
            </div>

            {!loading && offlineClasses.length === 0 && (
                <div className="classes-muted">
                    {t("classesPage.noAvailableClasses")}
                </div>
            )}

            {!loading && offlineClasses.length > 0 && (
                <div className="classes-grid">
                    {offlineClasses.map((c) => (
                        <ClassCard
                            key={c._id}
                            c={c}
                            onOpen={() => openClass(c)}
                            onDelete={handleDelete}
                            canDelete={isCenter}
                            t={t}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
