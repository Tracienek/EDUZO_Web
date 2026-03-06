// src/pages/workspace/classes/createModal/CreateClass.jsx

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

const DEFAULT_DAYS = ["Mon", "Wed", "Fri"];
const DEFAULT_TIME = "9:00 AM";

const DEFAULT_FORM = {
    name: "",
    subject: "",
    selectedDays: DEFAULT_DAYS,
    commonTime: DEFAULT_TIME,
    scheduleSlots: [],
    useCustomSchedule: false,
    durationMinutes: "90",
    totalSessions: "12",
};

const unwrap = (res) => {
    const root = res?.data ?? res;
    const data = root?.metadata ?? root?.data ?? root ?? null;
    return data?.class ?? data?.newClass ?? data;
};

const orderDays = (days = []) => {
    const set = new Set(days);
    return DAYS.map((d) => d.value).filter((v) => set.has(v));
};

const parsePositiveInt = (value) => {
    if (value === "" || value === null || value === undefined) return null;
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    return Math.floor(n);
};

const parseTimeToMinutes = (timeText) => {
    if (!timeText) return null;

    const raw = String(timeText).trim().toLowerCase();

    const ampmMatch = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
    if (ampmMatch) {
        let hour = Number(ampmMatch[1]);
        const minute = Number(ampmMatch[2] || 0);
        const period = ampmMatch[3].toLowerCase();

        if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;

        if (period === "pm" && hour !== 12) hour += 12;
        if (period === "am" && hour === 12) hour = 0;

        return hour * 60 + minute;
    }

    const hmMatch = raw.match(/^(\d{1,2}):(\d{2})$/);
    if (hmMatch) {
        const hour = Number(hmMatch[1]);
        const minute = Number(hmMatch[2]);

        if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
        return hour * 60 + minute;
    }

    return null;
};

const formatMinutesTo12h = (mins) => {
    const total = Number(mins);
    if (!Number.isFinite(total)) return "";

    const hour24 = Math.floor(total / 60);
    const minute = total % 60;
    const period = hour24 >= 12 ? "PM" : "AM";
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

    return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
};

const normalizeTimeInput = (value = "") => {
    const text = String(value || "").trim();
    if (!text) return "";

    const mins = parseTimeToMinutes(text);
    if (mins === null) return text;

    return formatMinutesTo12h(mins);
};

const normalizeScheduleSlots = (slots = []) => {
    if (!Array.isArray(slots)) return [];

    return slots
        .map((slot) => ({
            day: String(slot?.day || "").trim(),
            time: normalizeTimeInput(slot?.time),
        }))
        .filter((slot) => slot.day && slot.time);
};

const buildScheduleText = (slots = []) => {
    return normalizeScheduleSlots(slots)
        .map((s) => `${s.day} - ${s.time}`)
        .join(", ");
};

export default function CreateClass({ open, onClose, onCreated }) {
    const [form, setForm] = useState(DEFAULT_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [scheduleTouched, setScheduleTouched] = useState(false);

    useEffect(() => {
        if (open) {
            setForm(DEFAULT_FORM);
            setSubmitting(false);
            setError("");
            setScheduleTouched(false);
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

    const derivedSlots = useMemo(() => {
        if (form.useCustomSchedule) {
            return normalizeScheduleSlots(form.scheduleSlots || []);
        }

        return orderDays(form.selectedDays).map((day) => ({
            day,
            time: normalizeTimeInput(form.commonTime),
        }));
    }, [
        form.useCustomSchedule,
        form.scheduleSlots,
        form.selectedDays,
        form.commonTime,
    ]);

    const scheduleTextPreview = useMemo(() => {
        return buildScheduleText(derivedSlots);
    }, [derivedSlots]);

    const canSubmit = useMemo(() => {
        const okName = !!form.name.trim();
        const okSubject = !!form.subject.trim();

        const okSlots =
            Array.isArray(derivedSlots) &&
            derivedSlots.length > 0 &&
            derivedSlots.every(
                (slot) =>
                    slot.day &&
                    slot.time &&
                    parseTimeToMinutes(slot.time) !== null,
            );

        const durationValue = parsePositiveInt(form.durationMinutes);
        const totalSessionsValue = parsePositiveInt(form.totalSessions);

        const okDuration = durationValue !== null && durationValue >= 15;
        const okTotal = totalSessionsValue !== null && totalSessionsValue >= 1;

        return okName && okSubject && okSlots && okDuration && okTotal;
    }, [
        form.name,
        form.subject,
        derivedSlots,
        form.durationMinutes,
        form.totalSessions,
    ]);

    const update = (key) => (e) => {
        setError("");
        setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

    const toggleDay = (dayValue) => {
        setError("");
        setScheduleTouched(true);

        setForm((prev) => {
            const set = new Set(prev.selectedDays || []);
            if (set.has(dayValue)) set.delete(dayValue);
            else set.add(dayValue);

            return {
                ...prev,
                selectedDays: orderDays([...set]),
            };
        });
    };

    const enableCustomSchedule = () => {
        setScheduleTouched(true);
        setForm((prev) => ({
            ...prev,
            useCustomSchedule: true,
            scheduleSlots: orderDays(prev.selectedDays).map((day) => ({
                day,
                time:
                    normalizeTimeInput(prev.commonTime) ||
                    normalizeTimeInput(DEFAULT_TIME),
            })),
        }));
    };

    const disableCustomSchedule = () => {
        setScheduleTouched(true);
        setForm((prev) => {
            const normalizedSlots = normalizeScheduleSlots(prev.scheduleSlots);
            const days = orderDays(normalizedSlots.map((slot) => slot.day));
            const fallbackTime =
                normalizedSlots.find((slot) => slot.time)?.time ||
                normalizeTimeInput(prev.commonTime) ||
                normalizeTimeInput(DEFAULT_TIME);

            return {
                ...prev,
                useCustomSchedule: false,
                selectedDays: days.length ? days : DEFAULT_DAYS,
                commonTime: fallbackTime,
            };
        });
    };

    const updateSlot = (index, patch) => {
        setError("");
        setScheduleTouched(true);

        setForm((prev) => ({
            ...prev,
            scheduleSlots: prev.scheduleSlots.map((slot, i) =>
                i === index ? { ...slot, ...patch } : slot,
            ),
        }));
    };

    const removeSlot = (index) => {
        setError("");
        setScheduleTouched(true);

        setForm((prev) => ({
            ...prev,
            scheduleSlots: prev.scheduleSlots.filter((_, i) => i !== index),
        }));
    };

    const addSlot = () => {
        setError("");
        setScheduleTouched(true);

        setForm((prev) => {
            const usedDays = new Set(
                (prev.scheduleSlots || []).map((s) => s.day),
            );

            const firstUnusedDay =
                DAYS.find((d) => !usedDays.has(d.value))?.value || "Mon";

            return {
                ...prev,
                scheduleSlots: [
                    ...(prev.scheduleSlots || []),
                    {
                        day: firstUnusedDay,
                        time:
                            normalizeTimeInput(prev.commonTime) ||
                            normalizeTimeInput(DEFAULT_TIME),
                    },
                ],
            };
        });
    };

    const closeOnBackdrop = (e) => {
        if (e.target === e.currentTarget) onClose?.();
    };

    const handleBlurCommonTime = () => {
        setForm((prev) => ({
            ...prev,
            commonTime: normalizeTimeInput(prev.commonTime),
        }));
    };

    const handleBlurSlotTime = (index) => {
        setForm((prev) => ({
            ...prev,
            scheduleSlots: prev.scheduleSlots.map((slot, i) =>
                i === index
                    ? { ...slot, time: normalizeTimeInput(slot.time) }
                    : slot,
            ),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit || submitting) return;

        try {
            setSubmitting(true);
            setError("");

            const normalizedSlots = normalizeScheduleSlots(derivedSlots);

            const durationValue = parsePositiveInt(form.durationMinutes);
            const totalSessionsValue = parsePositiveInt(form.totalSessions);

            const payload = {
                name: form.name.trim(),
                subject: form.subject.trim(),
                scheduleSlots: normalizedSlots,
                scheduleText: buildScheduleText(normalizedSlots),
                durationMinutes: durationValue ?? 90,
                totalSessions: Math.max(1, totalSessionsValue ?? 12),
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

                    <div className="cm-label">
                        <div className="cm-schedule-header">
                            <span>Schedule</span>

                            {!form.useCustomSchedule ? (
                                <button
                                    type="button"
                                    className="cm-link-btn"
                                    onClick={enableCustomSchedule}
                                >
                                    Customize per day
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="cm-link-btn"
                                    onClick={disableCustomSchedule}
                                >
                                    Use common time
                                </button>
                            )}
                        </div>

                        {!form.useCustomSchedule ? (
                            <>
                                <div className="cm-days">
                                    {DAYS.map((d) => {
                                        const checked = (
                                            form.selectedDays || []
                                        ).includes(d.value);

                                        return (
                                            <button
                                                key={d.key}
                                                type="button"
                                                className={`cm-day-chip ${
                                                    checked ? "active" : ""
                                                }`}
                                                onClick={() =>
                                                    toggleDay(d.value)
                                                }
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
                                        value={form.commonTime}
                                        onChange={(e) => {
                                            setScheduleTouched(true);
                                            update("commonTime")(e);
                                        }}
                                        onBlur={handleBlurCommonTime}
                                        placeholder="e.g: 9:00 AM or 21:00"
                                    />
                                </div>

                                <div className="cm-helper">
                                    Same time will be applied to all selected
                                    days.
                                </div>
                            </>
                        ) : (
                            <div className="cm-slot-list">
                                {(form.scheduleSlots || []).map(
                                    (slot, index) => (
                                        <div
                                            className="cm-schedule-row"
                                            key={`${slot.day}-${index}`}
                                        >
                                            <select
                                                className="cm-input cm-slot-day"
                                                value={slot.day}
                                                onChange={(e) =>
                                                    updateSlot(index, {
                                                        day: e.target.value,
                                                    })
                                                }
                                            >
                                                {DAYS.map((d) => (
                                                    <option
                                                        key={d.key}
                                                        value={d.value}
                                                    >
                                                        {d.label}
                                                    </option>
                                                ))}
                                            </select>

                                            <input
                                                className="cm-input cm-slot-time"
                                                value={slot.time}
                                                onChange={(e) =>
                                                    updateSlot(index, {
                                                        time: e.target.value,
                                                    })
                                                }
                                                onBlur={() =>
                                                    handleBlurSlotTime(index)
                                                }
                                                placeholder="e.g: 9:00 AM or 21:00"
                                            />

                                            <button
                                                type="button"
                                                className="cm-remove-slot"
                                                onClick={() =>
                                                    removeSlot(index)
                                                }
                                                disabled={
                                                    form.scheduleSlots.length <=
                                                    1
                                                }
                                                title="Remove schedule row"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ),
                                )}

                                <button
                                    type="button"
                                    className="cm-add-slot"
                                    onClick={addSlot}
                                >
                                    + Add schedule row
                                </button>
                            </div>
                        )}

                        {scheduleTouched && (
                            <div className="cm-helper">
                                Preview:{" "}
                                <b>{scheduleTextPreview || "No schedule"}</b>
                            </div>
                        )}

                        {scheduleTouched &&
                            !canSubmit &&
                            (form.commonTime || form.useCustomSchedule) && (
                                <div
                                    className="cm-helper"
                                    style={{ color: "#b91c1c" }}
                                >
                                    Time format must be like <b>9:00 AM</b> or{" "}
                                    <b>21:00</b>.
                                </div>
                            )}
                    </div>

                    <label className="cm-label">
                        <span>Duration (minutes)</span>
                        <input
                            className="cm-input"
                            type="number"
                            min="15"
                            step="5"
                            value={form.durationMinutes}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    durationMinutes: e.target.value,
                                }))
                            }
                            placeholder="e.g: 90"
                        />
                    </label>

                    <label className="cm-label">
                        <span>Total sessions</span>
                        <input
                            className="cm-input"
                            type="number"
                            min="1"
                            step="1"
                            value={form.totalSessions}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    totalSessions: e.target.value,
                                }))
                            }
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
