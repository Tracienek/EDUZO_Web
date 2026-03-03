import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiUtils } from "../../../../../../utils/newRequest";
import "./FullClassFeedback.css";

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
        <span className="fcf-stars" aria-label={`Rating ${v} out of 5`}>
            {"★★★★★".split("").map((ch, i) => (
                <span
                    key={i}
                    className={i < v ? "fcf-star fcf-star--on" : "fcf-star"}
                >
                    {ch}
                </span>
            ))}
        </span>
    );
}

export default function FullClassFeedback() {
    const { classId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [feedbacks, setFeedbacks] = useState([]);
    const [className, setClassName] = useState("");

    const fetchAll = async () => {
        if (!classId) return;
        try {
            setLoading(true);
            setErr("");

            const res = await apiUtils.get(`/classes/${classId}/feedback`);
            const data = unwrap(res);

            const list = data?.feedbacks ?? data?.records ?? data ?? [];
            setFeedbacks(Array.isArray(list) ? list : []);

            const klass = data?.class ?? data?.klass ?? null;
            setClassName(
                klass?.name || klass?.className || data?.className || "",
            );
        } catch (e) {
            setErr(e?.response?.data?.message || "Failed to load feedback");
            setFeedbacks([]);
            setClassName("");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, [classId]);

    const avg = useMemo(() => avgRating(feedbacks), [feedbacks]);

    return (
        <div className="fcf-wrap">
            <div className="fcf-top">
                <button
                    className="fcf-back"
                    type="button"
                    onClick={() => navigate(-1)}
                >
                    Back
                </button>

                <div className="fcf-title">
                    Full Class Feedback {className ? `• ${className}` : ""}
                </div>

                <button className="fcf-btn" type="button" onClick={fetchAll}>
                    Reload
                </button>
            </div>

            <div className="fcf-summary">
                <span className="fcf-chip">
                    Total: <b>{feedbacks.length}</b>
                </span>
                <span className="fcf-chip">
                    Avg: <b>{avg ? avg : "—"}</b>
                </span>
            </div>

            {loading && <div className="fcf-muted">Loading feedback...</div>}
            {!loading && err && <div className="fcf-error">{err}</div>}

            {!loading && !err && feedbacks.length === 0 && (
                <div className="fcf-muted">No feedback yet.</div>
            )}

            {!loading && !err && feedbacks.length > 0 && (
                <div className="fcf-list">
                    {feedbacks.map((f, idx) => {
                        const id = f?._id || f?.id || `${idx}`;
                        const name = f?.studentName || "—";
                        const r = Number(f?.rating) || 0;
                        const c = String(f?.comment || f?.message || "").trim();
                        const ts = f?.createdAt || f?.updatedAt || f?.time;
                        const teacherName = f?.teacherName || "—";

                        return (
                            <div className="fcf-item" key={id}>
                                <div className="fcf-itemTop">
                                    <div className="fcf-name" title={name}>
                                        {name}
                                    </div>

                                    <div className="fcf-meta">
                                        <Stars value={r} />
                                        <span className="fcf-time">
                                            {fmtDT(ts)}
                                        </span>
                                    </div>
                                </div>

                                <div className="fcf-sub">
                                    Teacher: <b>{teacherName}</b>
                                </div>

                                {c ? (
                                    <div className="fcf-comment">{c}</div>
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
