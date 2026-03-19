// src/pages/workspace/teachers/teacherDetail/TeacherDetail.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiUtils } from "../../../../utils/newRequest";
import teacherFallback from "../../../../assets/images/teacher.svg";
import "./TeacherDetail.css";
import { useAuth } from "../../../../context/auth/AuthContext";

/** ---------- helpers ---------- */
const unwrap = (res) => {
    const root = res?.data ?? res;
    return root?.metadata ?? root?.data ?? root;
};

const safeText = (v, fallback = "—") =>
    v == null || v === "" ? fallback : String(v);

const fmtDOB = (value, fallback = "—") => {
    if (!value) return fallback;
    const s = String(value).trim();
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
        const [, yyyy, mm, dd] = m;
        return `${dd}/${mm}/${yyyy}`;
    }
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return fallback;
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = d.getFullYear();
    return `${dd}/${mm}/${yy}`;
};

const normalizeGenderKey = (g) => {
    const x = String(g || "")
        .toLowerCase()
        .trim();
    if (!x) return "emptyValue";
    if (["male", "m", "nam"].includes(x)) return "male";
    if (["female", "f", "nu", "nữ"].includes(x)) return "female";
    return null;
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
const fmtDateTime = (v, fallback = "—") => {
    if (!v) return fallback;
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return fallback;
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

function Stars({ value = 0, ariaLabel }) {
    const v = Math.max(0, Math.min(5, Number(value) || 0));
    const full = Math.floor(v);

    return (
        <span className="fp-stars" aria-label={ariaLabel}>
            {"★★★★★".split("").map((ch, i) => (
                <span
                    key={i}
                    className={i < full ? "fp-star fp-star--on" : "fp-star"}
                >
                    {ch}
                </span>
            ))}
        </span>
    );
}

export default function TeacherDetail() {
    const { t } = useTranslation();
    const { teacherId } = useParams();
    const navigate = useNavigate();
    const { userInfo } = useAuth();

    const role = userInfo?.role;

    const viewerId = String(userInfo?._id || userInfo?.id || "");
    const viewingTeacherId = String(teacherId || "");

    const canClearLogs = role === "center";
    const canViewLogs =
        role === "center" ||
        (role === "teacher" && viewerId === viewingTeacherId);

    const canViewFeedback =
        role === "center" ||
        (role === "teacher" && viewerId === viewingTeacherId);

    const canDeleteTeacher = role === "center";

    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState("");
    const [teacher, setTeacher] = useState(null);

    const [logsLoading, setLogsLoading] = useState(false);
    const [logsError, setLogsError] = useState("");
    const [attendanceLogs, setAttendanceLogs] = useState([]);

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
                    t("teacherDetail.failedToLoadLogs"),
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
                    t("teacherDetail.failedToLoadFeedback"),
            );
            setFeedbacks([]);
        } finally {
            setFbLoading(false);
        }
    };

    useEffect(() => {
        if (!canViewLogs) {
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

        const ok = window.confirm(t("teacherDetail.confirmClearLogs"));
        if (!ok) return;

        try {
            await apiUtils.delete(
                `/center/teachers/${teacherId}/attendance-logs`,
            );
            setAttendanceLogs([]);
        } catch (err) {
            alert(
                err?.response?.data?.message ||
                    t("teacherDetail.failedToClearLogs"),
            );
        }
    };

    useEffect(() => {
        if (!teacherId) return;
        let alive = true;

        (async () => {
            try {
                setLoading(true);
                setPageError("");

                const res = await apiUtils.get("/center/teachers");
                const data = unwrap(res);
                const list = data?.teachers ?? data ?? [];
                const teachers = Array.isArray(list) ? list : [];

                const found = teachers.find(
                    (tch) => String(tch?._id) === String(teacherId),
                );

                if (!alive) return;
                setTeacher(found || null);
            } catch (err) {
                if (!alive) return;
                setPageError(
                    err?.response?.data?.message ||
                        err?.message ||
                        t("teacherDetail.failedToLoadTeacher"),
                );
                setTeacher(null);
            } finally {
                if (alive) setLoading(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, [teacherId, t]);

    const avg = useMemo(() => avgRating(feedbacks), [feedbacks]);

    if (loading)
        return <div className="td-muted">{t("teacherDetail.loading")}</div>;
    if (pageError) return <div className="td-error">{pageError}</div>;
    if (!teacher)
        return <div className="td-muted">{t("teacherDetail.notFound")}</div>;

    const avatarUrl =
        resolveAvatar(teacher?.avatar || teacher?.photoUrl) || teacherFallback;

    const teacherName = safeText(
        teacher?.fullName || teacher?.name,
        t("teacherDetail.unnamedTeacher"),
    );

    const handleDeleteTeacher = async () => {
        const ok = window.confirm(
            t("teacherDetail.confirmDeleteTeacher", {
                name: teacherName || t("teacherDetail.unnamedTeacher"),
            }),
        );
        if (!ok) return;

        try {
            await apiUtils.delete(`/center/teachers/${teacherId}`);
            navigate("/workspace/teachers");
        } catch (err) {
            alert(
                err?.response?.data?.message ||
                    t("teacherDetail.failedToDeleteTeacher"),
            );
        }
    };

    const fbCountLabel = t("teacherDetail.feedbackCount", {
        count: feedbacks.length,
    });

    const attCountLabel = t("teacherDetail.attendanceCount", {
        count: attendanceLogs.length,
    });

    const genderKey = normalizeGenderKey(teacher?.gender);
    const genderText = genderKey
        ? t(`teacherDetail.${genderKey}`)
        : safeText(teacher?.gender, t("teacherDetail.emptyValue"));

    return (
        <div className="td-wrap">
            <div className="td-topbar">
                <button
                    className="td-back"
                    type="button"
                    onClick={() => navigate(-1)}
                >
                    {t("teacherDetail.back")}
                </button>

                {canDeleteTeacher && (
                    <button
                        className="td-delete"
                        type="button"
                        title={t("teacherDetail.delete")}
                        onClick={handleDeleteTeacher}
                    >
                        {t("teacherDetail.delete")}
                    </button>
                )}
            </div>

            <div className="td-grid">
                <section className="td-card td-profile">
                    <div className="td-avatar">
                        <img
                            src={avatarUrl}
                            alt={t("teacherDetail.avatarAlt")}
                            onError={(e) => {
                                e.currentTarget.src = teacherFallback;
                            }}
                            draggable={false}
                        />
                    </div>

                    <div className="td-name">{teacherName}</div>

                    <div className="td-meta">
                        <div className="td-row">
                            <span className="td-label">
                                {t("teacherDetail.email")}
                            </span>
                            <span className="td-value">
                                {safeText(
                                    teacher?.email,
                                    t("teacherDetail.emptyValue"),
                                )}
                            </span>
                        </div>

                        <div className="td-row">
                            <span className="td-label">
                                {t("teacherDetail.dob")}
                            </span>
                            <span className="td-value">
                                {fmtDOB(
                                    teacher?.dob || teacher?.dateOfBirth,
                                    t("teacherDetail.emptyValue"),
                                )}
                            </span>
                        </div>

                        <div className="td-row">
                            <span className="td-label">
                                {t("teacherDetail.gender")}
                            </span>
                            <span className="td-value">{genderText}</span>
                        </div>

                        <div className="td-row">
                            <span className="td-label">
                                {t("teacherDetail.language")}
                            </span>
                            <span className="td-value">
                                {safeText(
                                    teacher?.languageOrSpeciality,
                                    t("teacherDetail.emptyValue"),
                                )}
                            </span>
                        </div>
                    </div>
                </section>

                <section className="td-card">
                    <div className="td-card-head">
                        <h3>{t("teacherDetail.studentFeedback")}</h3>

                        <div
                            style={{
                                display: "flex",
                                gap: 8,
                                alignItems: "center",
                            }}
                        >
                            <span className="td-chip">
                                {!canViewFeedback
                                    ? t("teacherDetail.hidden")
                                    : fbLoading
                                      ? t("teacherDetail.loadingShort")
                                      : fbCountLabel}
                            </span>

                            {canViewFeedback && (
                                <span className="td-chip">
                                    {t("teacherDetail.avg")}:{" "}
                                    <strong>
                                        {avg
                                            ? avg
                                            : t("teacherDetail.emptyValue")}
                                    </strong>
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
                                    {t("teacherDetail.viewFullFeedbacks")}
                                </button>
                            )}
                        </div>
                    </div>

                    {!canViewFeedback && (
                        <div className="td-muted">
                            {t("teacherDetail.noPermissionFeedback")}
                        </div>
                    )}

                    {canViewFeedback && fbError && (
                        <div className="td-error-inline">{fbError}</div>
                    )}

                    {canViewFeedback &&
                        !fbLoading &&
                        !fbError &&
                        feedbacks.length === 0 && (
                            <div className="td-muted">
                                {t("teacherDetail.noFeedback")}
                            </div>
                        )}

                    {canViewFeedback &&
                        !fbLoading &&
                        !fbError &&
                        feedbacks.length > 0 && (
                            <>
                                <div className="td-log-list">
                                    {feedbacks.slice(0, 3).map((f, idx) => {
                                        const id = f?._id || f?.id || `${idx}`;
                                        const student = safeText(
                                            f?.studentName,
                                            t("teacherDetail.emptyValue"),
                                        );
                                        const clsName = safeText(
                                            f?.className,
                                            t("teacherDetail.emptyValue"),
                                        );
                                        const r = Number(f?.rating) || 0;

                                        const text = String(
                                            f?.comment || f?.message || "",
                                        ).trim();

                                        const ts =
                                            f?.createdAt ||
                                            f?.updatedAt ||
                                            f?.time;

                                        return (
                                            <div
                                                key={id}
                                                className="td-log-item"
                                            >
                                                <div>
                                                    <div className="td-log-title">
                                                        {student}
                                                    </div>

                                                    <div className="td-log-sub">
                                                        <Stars
                                                            value={r}
                                                            ariaLabel={t(
                                                                "teacherDetail.ratingAria",
                                                                { value: r },
                                                            )}
                                                        />
                                                        <span
                                                            style={{
                                                                marginLeft: 8,
                                                            }}
                                                        >
                                                            {clsName} •{" "}
                                                            {fmtDateTime(
                                                                ts,
                                                                t(
                                                                    "teacherDetail.emptyValue",
                                                                ),
                                                            )}
                                                        </span>
                                                    </div>

                                                    {text ? (
                                                        <div
                                                            style={{
                                                                marginTop: 6,
                                                            }}
                                                        >
                                                            {text}
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {feedbacks.length > 3 && (
                                    <div
                                        className="td-muted"
                                        style={{ marginTop: 8 }}
                                    >
                                        {t("teacherDetail.showingLatestThree")}
                                    </div>
                                )}
                            </>
                        )}
                </section>

                <section className="td-card td-classes">
                    <div className="td-card-head">
                        <h3>{t("teacherDetail.classesTaught")}</h3>

                        <div
                            style={{
                                display: "flex",
                                gap: 8,
                                alignItems: "center",
                            }}
                        >
                            <span className="td-chip">
                                {!canViewLogs
                                    ? t("teacherDetail.hidden")
                                    : logsLoading
                                      ? t("teacherDetail.loadingShort")
                                      : attCountLabel}
                            </span>

                            {canClearLogs && (
                                <button
                                    type="button"
                                    className="td-btn"
                                    onClick={handleClearLogs}
                                >
                                    {t("teacherDetail.clear")}
                                </button>
                            )}

                            {canViewLogs && (
                                <button
                                    type="button"
                                    className="td-btn"
                                    onClick={fetchLogs}
                                >
                                    {t("teacherDetail.reload")}
                                </button>
                            )}
                        </div>
                    </div>

                    {!canViewLogs && (
                        <div className="td-muted">
                            {t("teacherDetail.noPermissionLogs")}
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
                                {t("teacherDetail.noAttendance")}
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
                                        t("teacherDetail.emptyValue"),
                                    );
                                    const date = fmtDOB(
                                        x.dateKey,
                                        t("teacherDetail.emptyValue"),
                                    );
                                    const time = safeText(
                                        x.timeLabel,
                                        t("teacherDetail.emptyValue"),
                                    );

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
                                                    {t(
                                                        "teacherDetail.attendanceLogLine",
                                                        {
                                                            date,
                                                            time,
                                                        },
                                                    )}
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
                                                    {t("teacherDetail.open")}
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
