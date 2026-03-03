// src/pages/workspace/teachers/teacherDetail/TeacherDetail.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiUtils } from "../../../../utils/newRequest";
import teacherFallback from "../../../../assets/images/teacher.svg";
import "./TeacherDetail.css";
import { useAuth } from "../../../../context/auth/AuthContext";

/** ---------- helpers ---------- */
const unwrap = (res) => {
    const root = res?.data ?? res;
    return root?.metadata ?? root?.data ?? root;
};

const safeText = (v) => (v == null || v === "" ? "—" : String(v));

const fmtDOB = (value) => {
    if (!value) return "—";
    const s = String(value).trim();
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
        const [, yyyy, mm, dd] = m;
        return `${dd}/${mm}/${yyyy}`;
    }
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return "—";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = d.getFullYear();
    return `${dd}/${mm}/${yy}`;
};

const normalizeGender = (g) => {
    const x = String(g || "")
        .toLowerCase()
        .trim();
    if (!x) return "—";
    if (["male", "m", "nam"].includes(x)) return "Male";
    if (["female", "f", "nu", "nữ"].includes(x)) return "Female";
    return safeText(g);
};

const getServerOrigin = () => {
    const isProd = import.meta.env.VITE_ENV === "production";
    const origin = isProd
        ? import.meta.env.VITE_SERVER_ORIGIN
        : import.meta.env.VITE_SERVER_LOCAL_ORIGIN;

    return origin || window.location.origin;
};

const resolveAvatar = (url) => {
    if (!url) return "";
    const s = String(url);
    if (/^https?:\/\//i.test(s)) return s;
    if (s.startsWith("/uploads/")) return `${getServerOrigin()}${s}`;
    return s;
};

const pad2 = (n) => String(n).padStart(2, "0");
const fmtDateTime = (v) => {
    if (!v) return "—";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "—";
    return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()} ${pad2(
        d.getHours(),
    )}:${pad2(d.getMinutes())}`;
};

const avgRating = (items) => {
    const list = Array.isArray(items) ? items : [];
    const nums = list
        .map((x) => Number(x?.rating))
        .filter((n) => n >= 1 && n <= 5);
    if (!nums.length) return 0;
    const sum = nums.reduce((a, b) => a + b, 0);
    return Math.round((sum / nums.length) * 10) / 10;
};

function Stars({ value = 0 }) {
    const v = Math.max(0, Math.min(5, Number(value) || 0));
    return (
        <span className="fp-stars" aria-label={`Rating ${v} out of 5`}>
            {"★★★★★".split("").map((ch, i) => (
                <span
                    key={i}
                    className={i < v ? "fp-star fp-star--on" : "fp-star"}
                >
                    {ch}
                </span>
            ))}
        </span>
    );
}

export default function TeacherDetail() {
    const { teacherId } = useParams();
    const navigate = useNavigate();
    const { userInfo } = useAuth();

    const role = userInfo?.role;

    // viewer guards: center can view any; teacher can view only self
    const viewerId = String(userInfo?._id || userInfo?.id || "");
    const viewingTeacherId = String(teacherId || "");

    const canClearLogs = role === "center";
    const canViewLogs =
        role === "center" ||
        (role === "teacher" && viewerId === viewingTeacherId);

    // feedback permissions (same rule as logs)
    const canViewFeedback =
        role === "center" ||
        (role === "teacher" && viewerId === viewingTeacherId);

    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState("");
    const [teacher, setTeacher] = useState(null);

    // attendance logs
    const [logsLoading, setLogsLoading] = useState(false);
    const [logsError, setLogsError] = useState("");
    const [attendanceLogs, setAttendanceLogs] = useState([]);

    // feedback
    const [fbLoading, setFbLoading] = useState(false);
    const [fbError, setFbError] = useState("");
    const [feedbacks, setFeedbacks] = useState([]);

    const fetchLogs = async () => {
        if (!teacherId) return;
        if (!canViewLogs) return;

        try {
            setLogsLoading(true);
            setLogsError("");

            const res = await apiUtils.get(
                `/center/teachers/${teacherId}/attendance-logs?limit=200`,
            );
            const data = unwrap(res);
            const list = data?.logs ?? data ?? [];
            setAttendanceLogs(Array.isArray(list) ? list : []);
        } catch (err) {
            setLogsError(
                err?.response?.data?.message ||
                    err?.message ||
                    "Failed to load logs",
            );
            setAttendanceLogs([]);
        } finally {
            setLogsLoading(false);
        }
    };

    const fetchTeacherFeedbacks = async () => {
        if (!teacherId) return;
        if (!canViewFeedback) return;

        try {
            setFbLoading(true);
            setFbError("");

            // ✅ backend should implement: GET /v1/api/feedback/teacher/:teacherId
            const res = await apiUtils.get(
                `/feedback/teacher/${teacherId}?limit=50`,
            );
            const data = unwrap(res);
            const list = data?.feedbacks ?? data ?? [];
            setFeedbacks(Array.isArray(list) ? list : []);
        } catch (err) {
            setFbError(
                err?.response?.data?.message ||
                    err?.message ||
                    "Failed to load feedback",
            );
            setFeedbacks([]);
        } finally {
            setFbLoading(false);
        }
    };

    useEffect(() => {
        if (!canViewLogs) {
            // if cannot view, ensure not showing stale logs
            setAttendanceLogs([]);
            setLogsError("");
            setLogsLoading(false);
            return;
        }
        fetchLogs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [teacherId, canViewLogs]);

    useEffect(() => {
        if (!canViewFeedback) {
            setFeedbacks([]);
            setFbError("");
            setFbLoading(false);
            return;
        }
        fetchTeacherFeedbacks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [teacherId, canViewFeedback]);

    const handleClearLogs = async () => {
        if (!canClearLogs) return;

        const ok = window.confirm(
            "This will delete all attendance logs for this teacher. Continue?",
        );
        if (!ok) return;

        try {
            await apiUtils.delete(
                `/center/teachers/${teacherId}/attendance-logs`,
            );
            setAttendanceLogs([]);
        } catch (err) {
            alert(err?.response?.data?.message || "Failed to clear logs");
        }
    };

    /** ===== load teacher ===== */
    useEffect(() => {
        if (!teacherId) return;
        let alive = true;

        (async () => {
            try {
                setLoading(true);
                setPageError("");

                // NOTE: current backend loads list then finds by id
                // recommended later: GET /center/teachers/:id
                const res = await apiUtils.get("/center/teachers");
                const data = unwrap(res);
                const list = data?.teachers ?? data ?? [];
                const teachers = Array.isArray(list) ? list : [];

                const found = teachers.find(
                    (t) => String(t?._id) === String(teacherId),
                );

                if (!alive) return;
                setTeacher(found || null);
            } catch (err) {
                if (!alive) return;
                setPageError(
                    err?.response?.data?.message ||
                        err?.message ||
                        "Failed to load teacher",
                );
                setTeacher(null);
            } finally {
                if (alive) setLoading(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, [teacherId]);

    const avg = useMemo(() => avgRating(feedbacks), [feedbacks]);

    if (loading) return <div className="td-muted">Loading...</div>;
    if (pageError) return <div className="td-error">{pageError}</div>;
    if (!teacher) return <div className="td-muted">Teacher not found</div>;

    const avatarUrl =
        resolveAvatar(teacher?.avatar || teacher?.photoUrl) || teacherFallback;

    const teacherName = safeText(teacher?.fullName || teacher?.name);

    const handleDeleteTeacher = async () => {
        const ok = window.confirm(
            `Delete teacher "${teacherName || "Unnamed"}"?\nThis action cannot be undone.`,
        );
        if (!ok) return;

        try {
            await apiUtils.delete(`/center/teachers/${teacherId}`);
            navigate("/workspace/teachers");
        } catch (err) {
            alert(err?.response?.data?.message || "Failed to delete teacher");
        }
    };

    return (
        <div className="td-wrap">
            <div className="td-topbar">
                <button
                    className="td-back"
                    type="button"
                    onClick={() => navigate(-1)}
                >
                    Back
                </button>

                <div className="td-title" title={teacherName}>
                    {teacherName}
                </div>

                <button
                    className="td-delete"
                    type="button"
                    title="Delete teacher"
                    onClick={handleDeleteTeacher}
                >
                    Delete
                </button>
            </div>

            <div className="td-grid">
                <section className="td-card td-profile">
                    <div className="td-avatar">
                        <img
                            src={avatarUrl}
                            alt="teacher avatar"
                            onError={(e) => {
                                e.currentTarget.src = teacherFallback;
                            }}
                            draggable={false}
                        />
                    </div>

                    <div className="td-name">{teacherName}</div>

                    <div className="td-meta">
                        <div className="td-row">
                            <span className="td-label">Email</span>
                            <span className="td-value">
                                {safeText(teacher?.email)}
                            </span>
                        </div>

                        <div className="td-row">
                            <span className="td-label">DOB</span>
                            <span className="td-value">
                                {fmtDOB(teacher?.dob || teacher?.dateOfBirth)}
                            </span>
                        </div>

                        <div className="td-row">
                            <span className="td-label">Gender</span>
                            <span className="td-value">
                                {normalizeGender(teacher?.gender)}
                            </span>
                        </div>

                        <div className="td-row">
                            <span className="td-label">Language</span>
                            <span className="td-value">
                                {safeText(teacher?.languageOrSpeciality)}
                            </span>
                        </div>
                    </div>
                </section>

                {/* ===== Student Feedback (REAL) ===== */}
                <section className="td-card">
                    <div className="td-card-head">
                        <h3>Student Feedback</h3>

                        <div
                            style={{
                                display: "flex",
                                gap: 8,
                                alignItems: "center",
                            }}
                        >
                            <span className="td-chip">
                                {!canViewFeedback
                                    ? "Hidden"
                                    : fbLoading
                                      ? "Loading..."
                                      : `${feedbacks.length} feedback`}
                            </span>

                            {canViewFeedback && (
                                <span className="td-chip">
                                    Avg: <strong>{avg ? avg : "—"}</strong>
                                </span>
                            )}

                            {canViewFeedback && (
                                <button
                                    type="button"
                                    className="td-btn"
                                    onClick={() =>
                                        navigate(
                                            `/workspace/teachers/${teacherId}/feedbacks`,
                                        )
                                    }
                                >
                                    View full feedbacks
                                </button>
                            )}
                        </div>
                    </div>

                    {!canViewFeedback && (
                        <div className="td-muted">
                            You don&apos;t have permission to view this
                            teacher&apos;s feedback.
                        </div>
                    )}

                    {canViewFeedback && fbError && (
                        <div className="td-error-inline">{fbError}</div>
                    )}

                    {canViewFeedback &&
                        !fbLoading &&
                        !fbError &&
                        feedbacks.length === 0 && (
                            <div className="td-muted">No feedback yet.</div>
                        )}

                    {canViewFeedback &&
                        !fbLoading &&
                        !fbError &&
                        feedbacks.length > 0 && (
                            <div className="td-log-list">
                                {feedbacks.slice(0, 3).map((f, idx) => {
                                    const id = f?._id || f?.id || `${idx}`;
                                    const student = safeText(f?.studentName);
                                    const clsName = safeText(f?.className);
                                    const r = Number(f?.rating) || 0;

                                    // support both FE variants
                                    const text = String(
                                        f?.comment || f?.message || "",
                                    ).trim();

                                    const ts =
                                        f?.createdAt || f?.updatedAt || f?.time;

                                    {
                                        feedbacks.length > 3 && (
                                            <div
                                                className="td-muted"
                                                style={{ marginTop: 8 }}
                                            >
                                                Showing latest 3. Click “View
                                                full feedbacks” to see all.
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={id} className="td-log-item">
                                            <div>
                                                <div className="td-log-title">
                                                    {student}
                                                </div>

                                                <div className="td-log-sub">
                                                    <Stars value={r} />{" "}
                                                    <span
                                                        style={{
                                                            marginLeft: 8,
                                                        }}
                                                    >
                                                        {clsName} •{" "}
                                                        {fmtDateTime(ts)}
                                                    </span>
                                                </div>

                                                {text ? (
                                                    <div
                                                        style={{ marginTop: 6 }}
                                                    >
                                                        {text}
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                </section>

                {/* ===== Classes / Attendance Logs ===== */}
                <section className="td-card td-classes">
                    <div className="td-card-head">
                        <h3>Classes Taught</h3>

                        <div
                            style={{
                                display: "flex",
                                gap: 8,
                                alignItems: "center",
                            }}
                        >
                            <span className="td-chip">
                                {!canViewLogs
                                    ? "Hidden"
                                    : logsLoading
                                      ? "Loading..."
                                      : `${attendanceLogs.length} attendance`}
                            </span>

                            {canClearLogs && (
                                <button
                                    type="button"
                                    className="td-btn"
                                    onClick={handleClearLogs}
                                >
                                    Clear
                                </button>
                            )}

                            {canViewLogs && (
                                <button
                                    type="button"
                                    className="td-btn"
                                    onClick={fetchLogs}
                                >
                                    Reload
                                </button>
                            )}
                        </div>
                    </div>

                    {!canViewLogs && (
                        <div className="td-muted">
                            You don&apos;t have permission to view this
                            teacher&apos;s attendance logs.
                        </div>
                    )}

                    {canViewLogs && logsError && (
                        <div className="td-error-inline">{logsError}</div>
                    )}

                    {canViewLogs &&
                        !logsLoading &&
                        !logsError &&
                        attendanceLogs.length === 0 && (
                            <div className="td-muted">
                                No attendance activity yet.
                            </div>
                        )}

                    {canViewLogs &&
                        !logsLoading &&
                        !logsError &&
                        attendanceLogs.length > 0 && (
                            <div className="td-log-list">
                                {attendanceLogs.map((x) => {
                                    const className = safeText(
                                        x.classNameSnapshot,
                                    );
                                    const date = fmtDOB(x.dateKey); // yyyy-mm-dd -> dd/mm/yyyy
                                    const time = safeText(x.timeLabel);

                                    return (
                                        <div
                                            key={x._id}
                                            className="td-log-item"
                                        >
                                            <div>
                                                <div className="td-log-title">
                                                    {className}
                                                </div>
                                                <div className="td-log-sub">
                                                    {date} - {time} attendance
                                                </div>
                                            </div>

                                            {x.classId && (
                                                <button
                                                    type="button"
                                                    className="td-link"
                                                    onClick={() =>
                                                        navigate(
                                                            `/workspace/classes/${x.classId}`,
                                                        )
                                                    }
                                                >
                                                    Open
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                </section>
            </div>
        </div>
    );
}
