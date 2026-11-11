// src/pages/workspace/teachers/teacherDetail/fullFeedback/FullFeedback.jsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiUtils } from "../../../../../utils/newRequest";
import "./FullFeedback.css";

const unwrap = (res) => {
    const root = res?.data ?? res;
    return root?.metadata ?? root?.data ?? root;
};

const safeText = (v, fallback = "—") =>
    v == null || v === "" ? fallback : String(v);

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
    return (
        <span className="ff-stars" aria-label={ariaLabel}>
            {"★★★★★".split("").map((ch, i) => (
                <span
                    key={i}
                    className={i < v ? "ff-star ff-star--on" : "ff-star"}
                >
                    {ch}
                </span>
            ))}
        </span>
    );
}

export default function FullFeedback() {
    const { t } = useTranslation();
    const { teacherId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [items, setItems] = useState([]);

    const fetchAll = async () => {
        if (!teacherId) return;
        try {
            setLoading(true);
            setErr("");

            const res = await apiUtils.get(
                `/feedback/teacher/${teacherId}?limit=200`,
            );
            const data = unwrap(res);
            const list = data?.feedbacks ?? data ?? [];
            setItems(Array.isArray(list) ? list : []);
        } catch (e) {
            setErr(
                e?.response?.data?.message || t("fullFeedback.failedToLoad"),
            );
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [teacherId]);

    const avg = useMemo(() => avgRating(items), [items]);

    return (
        <div className="ff-wrap">
            <div className="ff-top">
                <button
                    className="ff-back"
                    type="button"
                    onClick={() => navigate(-1)}
                >
                    {t("fullFeedback.back")}
                </button>

                <div className="ff-title">{t("fullFeedback.title")}</div>

                <button className="ff-btn" type="button" onClick={fetchAll}>
                    {t("fullFeedback.reload")}
                </button>
            </div>

            <div className="ff-summary">
                <div className="ff-chip">
                    {t("fullFeedback.total")}: <b>{items.length}</b>
                </div>
                <div className="ff-chip">
                    {t("fullFeedback.avg")}:{" "}
                    <b>{avg ? avg : t("fullFeedback.emptyValue")}</b>
                </div>
            </div>

            {loading && (
                <div className="ff-muted">{t("fullFeedback.loading")}</div>
            )}

            {!loading && err && <div className="ff-error">{err}</div>}

            {!loading && !err && items.length === 0 && (
                <div className="ff-muted">{t("fullFeedback.noFeedback")}</div>
            )}

            {!loading && !err && items.length > 0 && (
                <div className="ff-list">
                    {items.map((f, idx) => {
                        const id = f?._id || f?.id || `${idx}`;
                        const student = safeText(
                            f?.studentName,
                            t("fullFeedback.emptyValue"),
                        );
                        const clsName = safeText(
                            f?.className,
                            t("fullFeedback.emptyValue"),
                        );
                        const r = Number(f?.rating) || 0;
                        const text = String(
                            f?.comment || f?.message || "",
                        ).trim();
                        const ts = f?.createdAt || f?.updatedAt || f?.time;

                        return (
                            <div className="ff-item" key={id}>
                                <div className="ff-itemTop">
                                    <div className="ff-student" title={student}>
                                        {student}
                                    </div>

                                    <div className="ff-sub">
                                        <span className="ff-class">
                                            {clsName}
                                        </span>
                                    </div>

                                    <div className="ff-meta">
                                        <Stars
                                            value={r}
                                            ariaLabel={t(
                                                "fullFeedback.ratingAria",
                                                { value: r },
                                            )}
                                        />
                                        <span className="ff-time">
                                            {fmtDateTime(
                                                ts,
                                                t("fullFeedback.emptyValue"),
                                            )}
                                        </span>
                                    </div>
                                </div>

                                {text ? (
                                    <div className="ff-text">{text}</div>
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
