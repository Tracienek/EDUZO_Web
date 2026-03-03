// client/src/pages/workspace/classes/createModal/CreateClass.jsx

import { useEffect, useMemo, useState } from "react";
import { apiUtils } from "../../../../utils/newRequest";
import "./CreateModal.css";

const DAYS = [
    { key: "mon", label: "Mon", value: "Mon" },
    { key: "tue", label: "Tue", value: "Tue" },
    { key: "wed", label: "Wed", value: "Wed" },
    { key: "thu", label: "Thu", value: "Thu" },
    { key: "fri", label: "Fri", value: "Fri" },
    { key: "sat", label: "Sat", value: "Sat" },
    { key: "sun", label: "Sun", value: "Sun" },
];

const DEFAULT_FORM = {
    name: "",
    subject: "",
    scheduleDays: ["Mon", "Wed", "Fri"], // ✅ default to pass validation
    scheduleTime: "9:00 AM",
    durationMinutes: 90,
    totalSessions: 12, // ✅ denominator (set to 10 if you want default 10)
};

const unwrap = (res) => {
    const root = res?.data ?? res;
    const data = root?.metadata ?? root?.data ?? root ?? null;
    return data?.class ?? data?.newClass ?? data;
};

const buildScheduleText = (days = [], time = "") => {
    const d = (Array.isArray(days) ? days : []).filter(Boolean);
    const left = d.length ? d.join(", ") : "Mon, Wed, Fri";
    const t = String(time || "").trim();
    return t ? `${left} - ${t}` : left;
};

export default function CreateClass({ open, onClose, onCreated }) {
    const [form, setForm] = useState(DEFAULT_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [scheduleTouched, setScheduleTouched] = useState(false);

    const scheduleTextPreview = useMemo(() => {
        return buildScheduleText(form.scheduleDays, form.scheduleTime);
    }, [form.scheduleDays, form.scheduleTime]);

    const canSubmit = useMemo(() => {
        const okName = !!form.name.trim();
        const okSubject = !!form.subject.trim();
        const okDays =
            Array.isArray(form.scheduleDays) && form.scheduleDays.length > 0;
        const okDuration = Number(form.durationMinutes) > 0;
        const okTotal = Number(form.totalSessions) > 0;
        return okName && okSubject && okDays && okDuration && okTotal;
    }, [
        form.name,
        form.subject,
        form.scheduleDays,
        form.durationMinutes,
        form.totalSessions,
    ]);

    useEffect(() => {
        if (open) {
            setForm(DEFAULT_FORM);
            setScheduleTouched(false);
            setError("");
            setSubmitting(false);
        }
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e) => {
            if (e.key === "Escape") onClose?.();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, onClose]);

    const update = (key) => (e) => {
        setError("");
        setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

    const toggleDay = (dayValue) => {
        setError("");
        setScheduleTouched(true);

        setForm((prev) => {
            const set = new Set(prev.scheduleDays || []);
            if (set.has(dayValue)) set.delete(dayValue);
            else set.add(dayValue);

            const ordered = DAYS.map((d) => d.value).filter((v) => set.has(v));
            return { ...prev, scheduleDays: ordered };
        });
    };

    const closeOnBackdrop = (e) => {
        if (e.target === e.currentTarget) onClose?.();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit || submitting) return;

        try {
            setSubmitting(true);
            setError("");

            const payload = {
                name: form.name.trim(),
                subject: form.subject.trim(),
                scheduleText: scheduleTextPreview,
                durationMinutes: Number(form.durationMinutes) || 90,
                totalSessions: Math.max(1, Number(form.totalSessions) || 12), // ✅
            };

            const res = await apiUtils.post("/classes", payload);
            const created = unwrap(res);

            onCreated?.(created);
            onClose?.();
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                    err?.message ||
                    "Create class failed. Please try again.",
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (!open) return null;

    return (
        <div
            className="cm-backdrop"
            role="dialog"
            aria-modal="true"
            onMouseDown={closeOnBackdrop}
        >
            <div className="cm-modal" onMouseDown={(e) => e.stopPropagation()}>
                <button
                    className="cm-close"
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                >
                    ×
                </button>

                <h3 className="cm-title">Create class</h3>

                <form className="cm-form" onSubmit={handleSubmit}>
                    <label className="cm-label">
                        <span>Class Name</span>
                        <input
                            className="cm-input"
                            placeholder="e.g: IELTS 1"
                            value={form.name}
                            onChange={update("name")}
                            autoFocus
                        />
                    </label>

                    <label className="cm-label">
                        <span>Subject</span>
                        <input
                            className="cm-input"
                            placeholder="e.g: English"
                            value={form.subject}
                            onChange={update("subject")}
                        />
                    </label>

                    {/* Schedule: days + time */}
                    <div className="cm-label">
                        <span>Schedule</span>

                        <div className="cm-days">
                            {DAYS.map((d) => {
                                const checked = (
                                    form.scheduleDays || []
                                ).includes(d.value);
                                return (
                                    <button
                                        key={d.key}
                                        type="button"
                                        className={`cm-day-chip ${
                                            checked ? "active" : ""
                                        }`}
                                        onClick={() => toggleDay(d.value)}
                                    >
                                        {d.label}
                                    </button>
                                );
                            })}
                        </div>

                        <div
                            className="cm-input cm-input-with-icon"
                            style={{ marginTop: 8 }}
                        >
                            <input
                                className="cm-input-inner"
                                value={form.scheduleTime}
                                onChange={(e) => {
                                    setScheduleTouched(true);
                                    update("scheduleTime")(e);
                                }}
                                placeholder="e.g: 9:00 AM"
                            />
                        </div>

                        {scheduleTouched && (
                            <div className="cm-helper">
                                Preview: <b>{scheduleTextPreview}</b>
                            </div>
                        )}
                    </div>

                    {/* Duration */}
                    <label className="cm-label">
                        <span>Duration (minutes)</span>
                        <input
                            className="cm-input"
                            type="number"
                            min="15"
                            step="5"
                            value={form.durationMinutes}
                            onChange={(e) => {
                                setError("");
                                const v = Number(e.target.value);
                                setForm((prev) => ({
                                    ...prev,
                                    durationMinutes: v,
                                }));
                            }}
                            placeholder="e.g: 90"
                        />
                    </label>

                    {/* ✅ Total sessions */}
                    <label className="cm-label">
                        <span>Total sessions</span>
                        <input
                            className="cm-input"
                            type="number"
                            min="1"
                            step="1"
                            value={form.totalSessions ?? 12}
                            onChange={(e) => {
                                setError("");
                                const v = Math.max(
                                    1,
                                    Number(e.target.value || 12),
                                );
                                setForm((prev) => ({
                                    ...prev,
                                    totalSessions: v,
                                }));
                            }}
                            placeholder="e.g: 10"
                        />
                        <div className="cm-helper">
                            Tuition email unlocks after completing these
                            sessions.
                        </div>
                    </label>

                    {error && <div className="cm-error">{error}</div>}

                    <div className="cm-divider" />

                    <button
                        className="cm-primary"
                        type="submit"
                        disabled={!canSubmit || submitting}
                    >
                        {submitting ? "Creating..." : "Create"}
                    </button>
                </form>
            </div>
        </div>
    );
}
