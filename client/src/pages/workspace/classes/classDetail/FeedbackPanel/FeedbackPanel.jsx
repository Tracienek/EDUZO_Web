// src/pages/workspace/classes/classDetail/FeedbackPanel/FeedbackPanel.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { apiUtils } from "../../../../../utils/newRequest";
import "./FeedbackPanel.css";

/** ---------- helpers ---------- */
const unwrap = (res) => {
    const root = res?.data ?? res;
    return root?.metadata ?? root?.data ?? root;
};

const pad2 = (n) => String(n).padStart(2, "0");

const fmtDT = (v) => {
    if (!v) return "—";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "—";
    return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()} ${pad2(
        d.getHours(),
    )}:${pad2(d.getMinutes())}`;
};

const getClientOrigin = () => {
    if (typeof window === "undefined") return "";
    return window.location.origin;
};

const safeStr = (v) => (v == null ? "" : String(v));

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

export default function FeedbackPanel({
    classId: classIdProp,
    role,
    userInfo,
    classNameValue,
}) {
    const navigate = useNavigate();

    const params = useParams();
    const loc = useLocation();

    const classId = classIdProp || params.classId || params.id || "";
    const qs = useMemo(() => new URLSearchParams(loc.search), [loc.search]);

    const classIdFromQuery = qs.get("classId");
    const effectiveClassId = classId || classIdFromQuery || "";

    const forcePublic = qs.get("public") === "1" || qs.get("mode") === "public";
    const isAdmin = (role === "teacher" || role === "center") && !forcePublic;

    const [cls, setCls] = useState(null);
    const [clsLoading, setClsLoading] = useState(false);

    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const [feedbacks, setFeedbacks] = useState([]);

    const [studentName, setStudentName] = useState(
        userInfo?.fullName || userInfo?.name || "",
    );
    const [studentId, setStudentId] = useState("");
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");

    const [isQrOpen, setIsQrOpen] = useState(false);

    const className = classNameValue || cls?.name || cls?.className || "—";

    const teacherId =
        role === "teacher" ? userInfo?._id || userInfo?.id || "" : "";

    const teacherName =
        role === "teacher"
            ? userInfo?.fullName || userInfo?.name || "Teacher"
            : "Center";

    const students = useMemo(() => {
        const list = cls?.students;
        return Array.isArray(list) ? list : [];
    }, [cls]);

    const publicFormUrl = useMemo(() => {
        if (!effectiveClassId) return "";
        const origin = getClientOrigin();
        return `${origin}/feedback/${encodeURIComponent(effectiveClassId)}?mode=public${
            teacherId ? `&teacherId=${encodeURIComponent(teacherId)}` : ""
        }`;
    }, [effectiveClassId, teacherId]);

    const qrImgSrc = useMemo(() => {
        if (!publicFormUrl) return "";
        return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
            publicFormUrl,
        )}`;
    }, [publicFormUrl]);

    const qrImgLargeSrc = useMemo(() => {
        if (!publicFormUrl) return "";
        return `https://api.qrserver.com/v1/create-qr-code/?size=520x520&data=${encodeURIComponent(
            publicFormUrl,
        )}`;
    }, [publicFormUrl]);

    useEffect(() => {
        if (!isQrOpen) return;

        const onKeyDown = (e) => {
            if (e.key === "Escape") {
                setIsQrOpen(false);
            }
        };

        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [isQrOpen]);

    useEffect(() => {
        if (!effectiveClassId) return;
        let alive = true;

        (async () => {
            try {
                setClsLoading(true);
                const res = await apiUtils.get(
                    `/classes/${effectiveClassId}/feedback`,
                );
                const data = unwrap(res);
                const klass = data?.class ?? data;
                if (!alive) return;
                setCls(klass || null);
            } catch {
                if (alive) setCls(null);
            } finally {
                if (alive) setClsLoading(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, [effectiveClassId]);

    const fetchFeedbacks = async () => {
        if (!effectiveClassId) return;
        setLoading(true);
        setErr("");
        try {
            const res = await apiUtils.get(
                `/classes/${effectiveClassId}/feedback`,
            );
            const data = unwrap(res);
            const list = data?.feedbacks ?? data?.records ?? data ?? [];
            setFeedbacks(Array.isArray(list) ? list : []);
        } catch (e) {
            setErr(e?.response?.data?.message || "Failed to load feedback");
            setFeedbacks([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeedbacks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [effectiveClassId]);

    useEffect(() => {
        if (!studentId) return;
        const found = students.find(
            (s) => String(s?._id || s?.id || s?.email) === String(studentId),
        );
        const name = found?.fullName || found?.name;
        if (name && !studentName) setStudentName(name);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [studentId, students]);

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!effectiveClassId) return;

        const sn = safeStr(studentName).trim();
        if (!sn) {
            alert("Please enter student's name");
            return;
        }
        const r = Number(rating);
        if (!(r >= 1 && r <= 5)) {
            alert("Please choose a rating from 1 to 5");
            return;
        }

        const teacherIdFromQuery = qs.get("teacherId");

        const payload = {
            classId: effectiveClassId,
            className,
            teacherId: teacherId || teacherIdFromQuery || null,
            teacherName: teacherName || null,
            studentId: studentId || null,
            studentName: sn,
            rating: r,
            comment: safeStr(comment).trim(),
            createdByUserId: userInfo?._id || userInfo?.id || null,
        };

        try {
            await apiUtils.post(
                `/classes/${effectiveClassId}/feedback`,
                payload,
            );

            setComment("");
            setRating(5);

            fetchFeedbacks();

            alert("Thanks! Your feedback was submitted.");
        } catch (err2) {
            alert(
                err2?.response?.data?.message ||
                    "Submit failed. Please try again.",
            );
        }
    };

    const copyLink = async () => {
        if (!publicFormUrl) return;
        try {
            await navigator.clipboard.writeText(publicFormUrl);
            alert("Link copied");
        } catch {
            window.prompt("Copy this link:", publicFormUrl);
        }
    };

    const avg = useMemo(() => avgRating(feedbacks), [feedbacks]);

    return (
        <>
            <section className="fp-wrap" aria-label="Feedback panel">
                <div className="fp-head">
                    <div>
                        <h3 className="fp-title">Feedback</h3>
                        <div className="fp-sub">
                            {teacherId ? (
                                <>
                                    {" "}
                                    • Teacher: <strong>{teacherName}</strong>
                                </>
                            ) : (
                                <>
                                    {" "}
                                    • Teacher: <strong>Center</strong>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="fp-badges">
                        <span className="fp-chip">
                            Avg: <strong>{avg ? avg : "—"}</strong>
                        </span>
                        <span className="fp-chip">
                            <strong>{feedbacks.length}</strong> feedback
                        </span>
                    </div>
                </div>

                {isAdmin && (
                    <div className="fp-qrCard">
                        <div className="fp-qrLeft">
                            <div className="fp-qrTitle">
                                Share QR for students
                            </div>
                            <div className="fp-qrDesc">
                                Students scan the QR → open the form → submit
                                feedback.
                            </div>

                            <div className="fp-linkRow">
                                <input
                                    className="fp-linkInput"
                                    readOnly
                                    value={publicFormUrl || ""}
                                    placeholder="Public feedback link"
                                />
                                <button
                                    type="button"
                                    className="fp-btn"
                                    onClick={copyLink}
                                    disabled={!publicFormUrl}
                                >
                                    Copy
                                </button>
                            </div>
                        </div>

                        <div className="fp-qrRight">
                            {qrImgSrc ? (
                                <button
                                    type="button"
                                    className="fp-qrTrigger"
                                    onClick={() => setIsQrOpen(true)}
                                    aria-label="Open large QR code"
                                    title="Click to enlarge QR"
                                >
                                    <img
                                        src={qrImgSrc}
                                        alt="Class feedback QR"
                                        className="fp-qrImg"
                                        draggable={false}
                                    />
                                    <span className="fp-qrZoomHint">
                                        Click to enlarge
                                    </span>
                                </button>
                            ) : (
                                <div className="fp-qrPlaceholder">
                                    QR unavailable
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {!isAdmin && (
                    <form className="fp-form" onSubmit={onSubmit}>
                        <div className="fp-formGrid">
                            <div className="fp-field">
                                <label className="fp-label">
                                    Student’s name
                                </label>
                                <input
                                    className="fp-input"
                                    value={studentName}
                                    onChange={(e) =>
                                        setStudentName(e.target.value)
                                    }
                                    placeholder="Enter student name"
                                />
                            </div>

                            <div className="fp-field">
                                <label className="fp-label">
                                    Student’s class
                                </label>
                                <input
                                    className="fp-input"
                                    value={className}
                                    readOnly
                                />
                            </div>

                            <div className="fp-field fp-field--full">
                                <label className="fp-label">
                                    Choose student (optional)
                                </label>
                                <select
                                    className="fp-select"
                                    value={studentId}
                                    onChange={(e) =>
                                        setStudentId(e.target.value)
                                    }
                                    disabled={
                                        clsLoading || students.length === 0
                                    }
                                >
                                    <option value="">
                                        {clsLoading
                                            ? "Loading students..."
                                            : students.length
                                              ? "Select from roster"
                                              : "No roster available"}
                                    </option>
                                    {students.map((s, idx) => {
                                        const id = String(
                                            s?._id || s?.id || s?.email || idx,
                                        );
                                        const name =
                                            s?.fullName || s?.name || id;
                                        return (
                                            <option value={id} key={id}>
                                                {name}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            <div className="fp-field fp-field--full">
                                <label className="fp-label">
                                    Rate teaching quality
                                </label>
                                <div
                                    className="fp-rateRow"
                                    role="radiogroup"
                                    aria-label="Teaching quality rating"
                                >
                                    {[1, 2, 3, 4, 5].map((n) => {
                                        const on = n === rating;
                                        return (
                                            <button
                                                key={n}
                                                type="button"
                                                className={
                                                    on
                                                        ? "fp-rateBtn fp-rateBtn--on"
                                                        : "fp-rateBtn"
                                                }
                                                onClick={() => setRating(n)}
                                                role="radio"
                                                aria-checked={on}
                                                aria-label={`Rate ${n} out of 5`}
                                            >
                                                ★
                                            </button>
                                        );
                                    })}
                                    <span className="fp-rateVal">
                                        {rating}/5
                                    </span>
                                </div>
                            </div>

                            <div className="fp-field fp-field--full">
                                <label className="fp-label">
                                    Short paragraph
                                </label>
                                <textarea
                                    className="fp-textarea"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Write your feedback..."
                                    rows={4}
                                />
                            </div>
                        </div>

                        <div className="fp-formActions">
                            <button
                                type="submit"
                                className="fp-btn fp-btn--primary"
                            >
                                Submit feedback
                            </button>
                        </div>
                    </form>
                )}

                <div className="fp-listHead">
                    <h4 className="fp-listTitle">Recent feedback</h4>
                    <button
                        type="button"
                        className="fp-btn fp-btn--ghost"
                        onClick={() =>
                            navigate(
                                `/workspace/classes/${encodeURIComponent(effectiveClassId)}/feedbacks`,
                            )
                        }
                        disabled={!effectiveClassId}
                    >
                        View full feedbacks
                    </button>
                </div>

                {loading && <div className="fp-muted">Loading feedback...</div>}
                {!loading && err && <div className="fp-error">{err}</div>}

                {!loading && !err && feedbacks.length === 0 && (
                    <div className="fp-empty">No feedback yet.</div>
                )}

                {!loading && !err && feedbacks.length > 0 && (
                    <div className="fp-list">
                        {feedbacks.slice(0, 10).map((f, idx) => {
                            const id = f?._id || f?.id || `${idx}`;
                            const name = f?.studentName || "—";
                            const r = Number(f?.rating) || 0;
                            const c = (f?.comment || f?.message || "").trim();
                            const ts = f?.createdAt || f?.updatedAt || f?.time;

                            return (
                                <div className="fp-item" key={id}>
                                    <div className="fp-itemTop">
                                        <div
                                            className="fp-itemName"
                                            title={name}
                                        >
                                            {name}
                                        </div>
                                        <div className="fp-itemMeta">
                                            <Stars value={r} />
                                            <span className="fp-itemTime">
                                                {fmtDT(ts)}
                                            </span>
                                        </div>
                                    </div>

                                    {c ? (
                                        <div className="fp-itemComment">
                                            {c}
                                        </div>
                                    ) : null}
                                </div>
                            );
                        })}

                        {feedbacks.length > 10 && (
                            <div className="fp-muted" style={{ marginTop: 8 }}>
                                Showing latest 10. Click “View full feedbacks”
                                to see all.
                            </div>
                        )}
                    </div>
                )}
            </section>

            {isQrOpen && qrImgLargeSrc && (
                <div
                    className="fp-modalOverlay"
                    onClick={() => setIsQrOpen(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Large QR code"
                >
                    <div
                        className="fp-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="fp-modalHead">
                            <div className="fp-modalTitle">
                                QR feedback link
                            </div>
                            <button
                                type="button"
                                className="fp-modalClose"
                                onClick={() => setIsQrOpen(false)}
                                aria-label="Close QR popup"
                            >
                                ×
                            </button>
                        </div>

                        <div className="fp-modalBody">
                            <img
                                src={qrImgLargeSrc}
                                alt="Large class feedback QR"
                                className="fp-qrImgLarge"
                                draggable={false}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
