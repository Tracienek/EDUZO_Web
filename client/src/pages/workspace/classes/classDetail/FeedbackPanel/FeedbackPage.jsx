// src/pages/feedback/FeedbackPage.jsx
import { useEffect, useMemo, useState, useId } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiUtils } from "../../../../../utils/newRequest";
import "./FeedbackPage.css";

function clampRating(n) {
    const x = Number(n);
    if (Number.isNaN(x)) return 5;
    return Math.min(5, Math.max(1, x));
}

export default function FeedbackPage() {
    const { t, i18n } = useTranslation();
    const { classId } = useParams();
    const cid = useMemo(() => String(classId || "").trim(), [classId]);

    const [className, setClassName] = useState("");
    const [teachers, setTeachers] = useState([]);

    const [studentName, setStudentName] = useState("");

    const [rating, setRating] = useState(5);
    const [teacherId, setTeacherId] = useState("");
    const [understand, setUnderstand] = useState(5);
    const [teachingWay, setTeachingWay] = useState(5);
    const [message, setMessage] = useState("");

    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    const [error, setError] = useState("");

    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const selectedTeacher = useMemo(
        () => teachers.find((t) => String(t.id) === String(teacherId)),
        [teacherId, teachers],
    );

    useEffect(() => {
        if (!cid) return;

        let alive = true;

        (async () => {
            try {
                setError("");
                setShowSuccessModal(false);
                setPageLoading(true);

                const res = await apiUtils.get(`/feedback/public/${cid}`);
                const meta = res?.data?.metadata || {};

                if (!alive) return;

                setClassName(meta.className || "");
                setTeachers(Array.isArray(meta.teachers) ? meta.teachers : []);

                const first = (meta.teachers || [])[0]?.id;
                setTeacherId(first ? String(first) : "");
            } catch (e) {
                setError(
                    e?.response?.data?.message ||
                        t("feedbackPage.cannotLoadPage"),
                );
            } finally {
                if (alive) setPageLoading(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, [cid, t]);

    useEffect(() => {
        if (!showSuccessModal) return;

        const onKeyDown = (e) => {
            if (e.key === "Escape") {
                setShowSuccessModal(false);
            }
        };

        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [showSuccessModal]);

    const submit = async () => {
        const text = message.trim();
        const sname = studentName.trim();

        setError("");
        setShowSuccessModal(false);

        if (!cid) return setError(t("feedbackPage.missingClassId"));
        if (!text) return setError(t("feedbackPage.writeFeedbackError"));

        try {
            setLoading(true);

            const payload = {
                classId: cid,
                className,
                studentName: sname,
                teacherId: teacherId || null,
                teacherName: selectedTeacher?.name || "",
                rating: clampRating(rating),
                understand: clampRating(understand),
                teachingWay: clampRating(teachingWay),
                message: text,
            };

            await apiUtils.post(`/feedback/public/${cid}`, payload);

            setStudentName("");
            setMessage("");
            setRating(5);
            setUnderstand(5);
            setTeachingWay(5);

            if (teachers.length > 0) {
                const first = teachers[0]?.id;
                setTeacherId(first ? String(first) : "");
            } else {
                setTeacherId("");
            }

            setShowSuccessModal(true);
        } catch (e) {
            setError(
                e?.response?.data?.message || t("feedbackPage.submitFailed"),
            );
        } finally {
            setLoading(false);
        }
    };

    const Stars = ({ value, onChange, label }) => {
        const groupId = useId();
        const v = clampRating(value);

        const set = (n) => onChange(clampRating(n));

        const onKeyDown = (e) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
                e.preventDefault();
                set(v - 1);
            }
            if (e.key === "ArrowRight" || e.key === "ArrowUp") {
                e.preventDefault();
                set(v + 1);
            }
            if (e.key >= "1" && e.key <= "5") {
                e.preventDefault();
                set(Number(e.key));
            }
        };

        return (
            <div className="fbp-stars-wrap">
                <div className="fbp-stars-head">
                    <div className="fbp-stars-label">{label}</div>
                    <div className="fbp-stars-value" aria-live="polite">
                        {t("feedbackPage.outOfFive", { value: v })}
                    </div>
                </div>

                <div
                    className="fbp-stars"
                    role="radiogroup"
                    aria-label={label}
                    aria-describedby={`${groupId}-hint`}
                    tabIndex={0}
                    onKeyDown={onKeyDown}
                >
                    {[1, 2, 3, 4, 5].map((n) => {
                        const on = v >= n;
                        const selected = v === n;
                        return (
                            <button
                                key={n}
                                type="button"
                                className={`fbp-star ${on ? "on" : ""} ${selected ? "selected" : ""}`}
                                onClick={() => set(n)}
                                role="radio"
                                aria-checked={selected}
                                aria-label={t("feedbackPage.starAria", {
                                    label,
                                    value: n,
                                })}
                            >
                                ★
                            </button>
                        );
                    })}
                </div>

                <div id={`${groupId}-hint`} className="fbp-hint">
                    {t("feedbackPage.starsHint")}
                </div>
            </div>
        );
    };

    if (pageLoading) {
        return (
            <div className="fbp-wrap">
                <div className="fbp-card">
                    <div className="fbp-skeleton">
                        <div className="fbp-skel-line w40" />
                        <div className="fbp-skel-line w60" />
                        <div className="fbp-skel-block" />
                        <div className="fbp-skel-block" />
                        <div className="fbp-skel-block" />
                    </div>
                </div>
            </div>
        );
    }

    const disableSubmit = loading || !message.trim();

    return (
        <>
            <div className="fbp-wrap">
                <div className="fbp-card">
                    <header className="fbp-header">
                        <div>
                            <h1 className="fbp-h1">
                                {t("feedbackPage.title")}
                            </h1>
                            <p className="fbp-sub">
                                {className ? (
                                    <>
                                        {t("feedbackPage.class")}:{" "}
                                        <b>{className}</b>
                                    </>
                                ) : (
                                    `${t("feedbackPage.class")}: —`
                                )}
                            </p>
                        </div>

                        <div
                            className="workspace-lang-switch"
                            aria-label="Language switcher"
                        >
                            <button
                                type="button"
                                className={`workspace-lang-btn ${
                                    i18n.language === "vi" ? "active" : ""
                                }`}
                                onClick={() => i18n.changeLanguage("vi")}
                            >
                                VI
                            </button>

                            <button
                                type="button"
                                className={`workspace-lang-btn ${
                                    i18n.language === "en" ? "active" : ""
                                }`}
                                onClick={() => i18n.changeLanguage("en")}
                            >
                                EN
                            </button>

                            <button
                                type="button"
                                className={`workspace-lang-btn ${
                                    i18n.language === "zh" ? "active" : ""
                                }`}
                                onClick={() => i18n.changeLanguage("zh")}
                            >
                                中文
                            </button>
                        </div>

                        {/* <div
                            className="fbp-chip"
                            title={t("feedbackPage.classId")}
                        >
                            <span className="fbp-chip-label">
                                {t("feedbackPage.classId")}
                            </span>
                            <span className="fbp-chip-value">{cid || "—"}</span>
                        </div> */}
                    </header>

                    {error && (
                        <div className="fbp-alert fbp-alert-error" role="alert">
                            <span className="fbp-alert-icon">⚠️</span>
                            <div className="fbp-alert-body">{error}</div>
                        </div>
                    )}

                    <section className="fbp-section">
                        <div className="fbp-section-title">
                            {t("feedbackPage.studentOptional")}
                        </div>
                        <div className="fbp-field">
                            <input
                                className="fbp-input"
                                value={studentName}
                                onChange={(e) => setStudentName(e.target.value)}
                                placeholder={t("feedbackPage.yourName")}
                                autoComplete="name"
                            />
                        </div>
                    </section>

                    <section className="fbp-section">
                        <div className="fbp-section-title">
                            {t("feedbackPage.overallRatingTitle")}
                        </div>
                        <Stars
                            value={rating}
                            onChange={setRating}
                            label={t("feedbackPage.overallRating")}
                        />
                    </section>

                    <section className="fbp-section">
                        <div className="fbp-section-title">
                            {t("feedbackPage.chooseTeacherTitle")}
                        </div>

                        <div className="fbp-teachers" role="list">
                            {teachers.length === 0 ? (
                                <div className="fbp-empty">
                                    {t("feedbackPage.noTeachers")}
                                </div>
                            ) : (
                                teachers.map((tch) => {
                                    const active =
                                        String(teacherId) === String(tch.id);
                                    return (
                                        <button
                                            key={tch.id}
                                            type="button"
                                            className={`fbp-pill ${active ? "active" : ""}`}
                                            onClick={() =>
                                                setTeacherId(String(tch.id))
                                            }
                                            aria-pressed={active}
                                        >
                                            {tch.name}
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        <div className="fbp-hint">
                            {t("feedbackPage.selected")}:{" "}
                            <b>
                                {selectedTeacher?.name ||
                                    t("feedbackPage.noTeacherSelected")}
                            </b>
                        </div>
                    </section>

                    <section className="fbp-section">
                        <div className="fbp-section-title">
                            {t("feedbackPage.understandTitle")}
                        </div>
                        <Stars
                            value={understand}
                            onChange={setUnderstand}
                            label={t("feedbackPage.understand")}
                        />
                    </section>

                    <section className="fbp-section">
                        <div className="fbp-section-title">
                            {t("feedbackPage.teachingWayTitle")}
                        </div>
                        <Stars
                            value={teachingWay}
                            onChange={setTeachingWay}
                            label={t("feedbackPage.teachingWay")}
                        />
                    </section>

                    <section className="fbp-section">
                        <div className="fbp-section-title">
                            {t("feedbackPage.writeFeedbackTitle")}
                        </div>
                        <div className="fbp-field">
                            <textarea
                                className="fbp-textarea"
                                rows={6}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder={t("feedbackPage.writePlaceholder")}
                            />
                            <div className="fbp-counter" aria-live="polite">
                                {message.trim().length === 0
                                    ? t("feedbackPage.feedbackRequired")
                                    : t("feedbackPage.characters", {
                                          count: message.trim().length,
                                      })}
                            </div>
                        </div>
                    </section>

                    <div className="fbp-actions">
                        <button
                            type="button"
                            className="fbp-btn"
                            onClick={submit}
                            disabled={disableSubmit}
                        >
                            {loading
                                ? t("feedbackPage.sending")
                                : t("feedbackPage.submit")}
                        </button>
                    </div>
                </div>
            </div>

            {showSuccessModal && (
                <div
                    className="fbp-modalOverlay"
                    onClick={() => setShowSuccessModal(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-label={t("feedbackPage.successAria")}
                >
                    <div
                        className="fbp-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="fbp-modalIcon">✅</div>
                        <h2 className="fbp-modalTitle">
                            {t("feedbackPage.thankYou")}
                        </h2>
                        <p className="fbp-modalText">
                            {t("feedbackPage.successMessage")}
                        </p>

                        <div className="fbp-modalActions">
                            <button
                                type="button"
                                className="fbp-btn"
                                onClick={() => setShowSuccessModal(false)}
                            >
                                {t("feedbackPage.close")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
