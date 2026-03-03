// pages/workspace/classes/ClassesPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUtils } from "../../../utils/newRequest";
import "./ClassesPage.css";
import { useAuth } from "../../../context/auth/AuthContext";

function ClassCard({ c, onOpen, onDelete, canDelete }) {
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
            {/* TOP */}
            <div className="class-card-top">
                <div
                    className="class-card-title"
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                >
                    <span
                        className={`dot ${isOnline ? "dot-green" : "dot-gray"}`}
                    />
                    {c?.name || c?.className || "Unnamed class"}
                </div>

                {canDelete && (
                    <button
                        className="class-card-delete"
                        type="button"
                        title="Delete class"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete?.(c);
                        }}
                    >
                        ✕
                    </button>
                )}
            </div>

            <div className="class-card-sub">{c?.subject || "—"}</div>

            <div className="class-card-meta">
                <div className="class-card-row">
                    <span className="label">Students</span>
                    <span className="pill">
                        {c?.totalStudents ?? c?.studentCount ?? "—"}
                    </span>
                </div>

                <div className="class-card-row">
                    <span className="label">Schedule</span>
                    <span className="value">
                        {c?.scheduleText || "Mon, Wed, Fri - 9:00 AM"}
                    </span>
                </div>

                <div className="class-card-row">
                    <span className="label">Duration</span>
                    <span className="value">{duration} min</span>
                </div>
            </div>

            <div className="class-card-footer">
                <span className="linkish">View Details</span>
            </div>
        </div>
    );
}

export default function ClassesPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [classes, setClasses] = useState([]);
    const { userInfo } = useAuth();
    const isCenter = userInfo?.role === "center";

    const pageTitle =
        userInfo?.role === "center"
            ? `${userInfo?.fullName || "Center"}’s Classes`
            : "My Classes";

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

        const t = setInterval(() => {
            if (!alive) return;
            fetchClasses(false);
        }, 20000);

        return () => {
            alive = false;
            clearInterval(t);
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
            alert("You are not allowed to delete classes.");
            return;
        }

        const ok = window.confirm(
            `Delete class "${cls?.name || "Unnamed"}"?\nThis action cannot be undone.`,
        );
        if (!ok) return;

        try {
            await apiUtils.delete(`/classes/${cls._id}`);
            setClasses((prev) => prev.filter((c) => c._id !== cls._id));
        } catch (err) {
            alert(err?.response?.data?.message || "Failed to delete class");
        }
    };

    return (
        <div className="classes-page">
            {/* ===== Online Class Section ===== */}
            <div className="classes-page-header">
                <h2>Online Class</h2>
            </div>

            {loading && <div className="classes-muted">Loading...</div>}

            {!loading && onlineClasses.length === 0 && (
                <div className="classes-muted">
                    No class is active right now
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
                        />
                    ))}
                </div>
            )}

            {/* ===== Your Classes (Offline) ===== */}
            <div className="classes-page-header" style={{ marginTop: 18 }}>
                <h2 title={pageTitle}>{pageTitle}</h2>
            </div>

            {!loading && offlineClasses.length === 0 && (
                <div className="classes-muted">No available classes</div>
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
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
