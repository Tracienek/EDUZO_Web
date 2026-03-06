// src/pages/feedback/FeedbackPage.jsx
import { useEffect, useMemo, useState, useId } from "react";
import { useParams } from "react-router-dom";
import { apiUtils } from "../../../../../utils/newRequest";
import "./FeedbackPage.css";

function clampRating(n) {
    const x = Number(n);
    if (Number.isNaN(x)) return 5;
    return Math.min(5, Math.max(1, x));
}

export default function FeedbackPage() {
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
                    e?.response?.data?.message || "Cannot load feedback page",
                );
            } finally {
                if (alive) setPageLoading(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, [cid]);

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

        if (!cid) return setError("Missing classId.");
        if (!text) return setError("Please write your feedback.");

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
            setError(e?.response?.data?.message || "Submit failed.");
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
                        {v}/5
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
                                aria-label={`${label} ${n}`}
                            >
                                ★
                            </button>
                        );
                    })}
                </div>

                <div id={`${groupId}-hint`} className="fbp-hint">
                    Use arrow keys or press 1–5.
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
                            <h1 className="fbp-h1">Feedback</h1>
                            <p className="fbp-sub">
                                {className ? (
                                    <>
                                        Class: <b>{className}</b>
                                    </>
                                ) : (
                                    "Class: —"
                                )}
                            </p>
                        </div>

                        <div className="fbp-chip" title="Class ID">
                            <span className="fbp-chip-label">Class ID</span>
                            <span className="fbp-chip-value">{cid || "—"}</span>
                        </div>
                    </header>

                    {error && (
                        <div className="fbp-alert fbp-alert-error" role="alert">
                            <span className="fbp-alert-icon">⚠️</span>
                            <div className="fbp-alert-body">{error}</div>
                        </div>
                    )}

                    <section className="fbp-section">
                        <div className="fbp-section-title">
                            Student (optional)
                        </div>
                        <div className="fbp-field">
                            <input
                                className="fbp-input"
                                value={studentName}
                                onChange={(e) => setStudentName(e.target.value)}
                                placeholder="Your name"
                                autoComplete="name"
                            />
                        </div>
                    </section>

                    <section className="fbp-section">
                        <div className="fbp-section-title">
                            1) Overall rating
                        </div>
                        <Stars
                            value={rating}
                            onChange={setRating}
                            label="Overall rating"
                        />
                    </section>

                    <section className="fbp-section">
                        <div className="fbp-section-title">
                            2) Choose teacher
                        </div>

                        <div className="fbp-teachers" role="list">
                            {teachers.length === 0 ? (
                                <div className="fbp-empty">
                                    No teachers available. You can still submit
                                    feedback for this class.
                                </div>
                            ) : (
                                teachers.map((t) => {
                                    const active =
                                        String(teacherId) === String(t.id);
                                    return (
                                        <button
                                            key={t.id}
                                            type="button"
                                            className={`fbp-pill ${active ? "active" : ""}`}
                                            onClick={() =>
                                                setTeacherId(String(t.id))
                                            }
                                            aria-pressed={active}
                                        >
                                            {t.name}
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        <div className="fbp-hint">
                            Selected:{" "}
                            <b>
                                {selectedTeacher?.name || "No teacher selected"}
                            </b>
                        </div>
                    </section>

                    <section className="fbp-section">
                        <div className="fbp-section-title">3) Understand</div>
                        <Stars
                            value={understand}
                            onChange={setUnderstand}
                            label="Understand"
                        />
                    </section>

                    <section className="fbp-section">
                        <div className="fbp-section-title">4) Teaching way</div>
                        <Stars
                            value={teachingWay}
                            onChange={setTeachingWay}
                            label="Teaching way"
                        />
                    </section>

                    <section className="fbp-section">
                        <div className="fbp-section-title">
                            5) Write feedback
                        </div>
                        <div className="fbp-field">
                            <textarea
                                className="fbp-textarea"
                                rows={6}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Write your feedback here..."
                            />
                            <div className="fbp-counter" aria-live="polite">
                                {message.trim().length === 0
                                    ? "Feedback is required."
                                    : `${message.trim().length} characters`}
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
                            {loading ? "Sending..." : "Submit"}
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
                    aria-label="Feedback submitted successfully"
                >
                    <div
                        className="fbp-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="fbp-modalIcon">✅</div>
                        <h2 className="fbp-modalTitle">Thank you!</h2>
                        <p className="fbp-modalText">
                            Your feedback has been submitted successfully.
                        </p>

                        <div className="fbp-modalActions">
                            <button
                                type="button"
                                className="fbp-btn"
                                onClick={() => setShowSuccessModal(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
