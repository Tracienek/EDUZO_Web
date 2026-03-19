// src/pages/workspace/classes/createModal/CreateClass.jsx

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { apiUtils } from "../../../../utils/newRequest";
import "./CreateModal.css";

const DAYS = [
    { key: "mon", labelKey: "shortWeekdays.mon", value: "Mon" },
    { key: "tue", labelKey: "shortWeekdays.tue", value: "Tue" },
    { key: "wed", labelKey: "shortWeekdays.wed", value: "Wed" },
    { key: "thu", labelKey: "shortWeekdays.thu", value: "Thu" },
    { key: "fri", labelKey: "shortWeekdays.fri", value: "Fri" },
    { key: "sat", labelKey: "shortWeekdays.sat", value: "Sat" },
    { key: "sun", labelKey: "shortWeekdays.sun", value: "Sun" },
];

const DEFAULT_DAYS = ["Mon", "Wed", "Fri"];
const DEFAULT_TIME = "9:00";
const DEFAULT_PERIOD = "AM";

const DEFAULT_FORM = {
    name: "",
    subject: "",
    selectedDays: DEFAULT_DAYS,
    commonTime: DEFAULT_TIME,
    commonPeriod: DEFAULT_PERIOD,
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

const formatHour12 = (hour24) => {
    const h = hour24 % 12;
    return h === 0 ? 12 : h;
};

const formatTimeOnly = (hour12, minute) => {
    return `${hour12}:${String(minute).padStart(2, "0")}`;
};

const parseTimeParts = (timeText, selectedPeriod = "AM") => {
    if (!timeText) return null;

    const raw = String(timeText).trim().toLowerCase();
    if (!raw) return null;

    const ampmMatch = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
    if (ampmMatch) {
        const hour = Number(ampmMatch[1]);
        const minute = Number(ampmMatch[2] || 0);
        const period = ampmMatch[3].toUpperCase();

        if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;

        return {
            hour12: hour,
            minute,
            period,
        };
    }

    const gMatch = raw.match(/^(\d{1,2})\s*g\s*(\d{1,2})?$/i);
    if (gMatch) {
        const hour24 = Number(gMatch[1]);
        const minute = Number(gMatch[2] || 0);

        if (hour24 < 0 || hour24 > 23 || minute < 0 || minute > 59) return null;

        return {
            hour12: formatHour12(hour24),
            minute,
            period: hour24 >= 12 ? "PM" : "AM",
        };
    }

    const hmMatch = raw.match(/^(\d{1,2}):(\d{2})$/);
    if (hmMatch) {
        const hour = Number(hmMatch[1]);
        const minute = Number(hmMatch[2]);

        if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

        if (hour > 12 || hour === 0) {
            return {
                hour12: formatHour12(hour),
                minute,
                period: hour >= 12 ? "PM" : "AM",
            };
        }

        return {
            hour12: hour,
            minute,
            period: selectedPeriod === "PM" ? "PM" : "AM",
        };
    }

    const hourOnlyMatch = raw.match(/^(\d{1,2})$/);
    if (hourOnlyMatch) {
        const hour = Number(hourOnlyMatch[1]);

        if (hour < 0 || hour > 23) return null;

        if (hour > 12 || hour === 0) {
            return {
                hour12: formatHour12(hour),
                minute: 0,
                period: hour >= 12 ? "PM" : "AM",
            };
        }

        return {
            hour12: hour,
            minute: 0,
            period: selectedPeriod === "PM" ? "PM" : "AM",
        };
    }

    return null;
};

const normalizeTimeFields = (timeText = "", period = "AM") => {
    const parsed = parseTimeParts(timeText, period);
    if (!parsed) {
        return {
            time: String(timeText || "").trim(),
            period: period === "PM" ? "PM" : "AM",
        };
    }

    return {
        time: formatTimeOnly(parsed.hour12, parsed.minute),
        period: parsed.period,
    };
};

const parseTimeToMinutes = (timeText, period = "AM") => {
    const parsed = parseTimeParts(timeText, period);
    if (!parsed) return null;

    let hour24 = parsed.hour12 % 12;
    if (parsed.period === "PM") hour24 += 12;

    return hour24 * 60 + parsed.minute;
};

const normalizeScheduleSlots = (slots = []) => {
    if (!Array.isArray(slots)) return [];

    return slots
        .map((slot) => {
            const normalized = normalizeTimeFields(slot?.time, slot?.period);
            return {
                day: String(slot?.day || "").trim(),
                time: normalized.time,
                period: normalized.period,
            };
        })
        .filter(
            (slot) =>
                slot.day &&
                slot.time &&
                parseTimeToMinutes(slot.time, slot.period) !== null,
        );
};

const buildScheduleText = (slots = []) => {
    return normalizeScheduleSlots(slots)
        .map((s) => `${s.day} - ${s.time} ${s.period}`)
        .join(", ");
};

const toPayloadScheduleSlots = (slots = []) => {
    return normalizeScheduleSlots(slots).map((slot) => ({
        day: slot.day,
        time: `${slot.time} ${slot.period}`,
    }));
};

export default function CreateClass({ open, onClose, onCreated }) {
    const { t } = useTranslation();

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

        const normalizedCommon = normalizeTimeFields(
            form.commonTime,
            form.commonPeriod,
        );

        return orderDays(form.selectedDays).map((day) => ({
            day,
            time: normalizedCommon.time,
            period: normalizedCommon.period,
        }));
    }, [
        form.useCustomSchedule,
        form.scheduleSlots,
        form.selectedDays,
        form.commonTime,
        form.commonPeriod,
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
                    (slot.period === "AM" || slot.period === "PM") &&
                    parseTimeToMinutes(slot.time, slot.period) !== null,
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
        setForm((prev) => {
            const normalizedCommon = normalizeTimeFields(
                prev.commonTime,
                prev.commonPeriod,
            );

            return {
                ...prev,
                useCustomSchedule: true,
                scheduleSlots: orderDays(prev.selectedDays).map((day) => ({
                    day,
                    time: normalizedCommon.time || DEFAULT_TIME,
                    period: normalizedCommon.period || DEFAULT_PERIOD,
                })),
            };
        });
    };

    const disableCustomSchedule = () => {
        setScheduleTouched(true);
        setForm((prev) => {
            const normalizedSlots = normalizeScheduleSlots(prev.scheduleSlots);
            const days = orderDays(normalizedSlots.map((slot) => slot.day));
            const fallbackSlot = normalizedSlots.find(
                (slot) => slot.time && slot.period,
            );

            return {
                ...prev,
                useCustomSchedule: false,
                selectedDays: days.length ? days : DEFAULT_DAYS,
                commonTime: fallbackSlot?.time || DEFAULT_TIME,
                commonPeriod: fallbackSlot?.period || DEFAULT_PERIOD,
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

            const normalizedCommon = normalizeTimeFields(
                prev.commonTime,
                prev.commonPeriod,
            );

            return {
                ...prev,
                scheduleSlots: [
                    ...(prev.scheduleSlots || []),
                    {
                        day: firstUnusedDay,
                        time: normalizedCommon.time || DEFAULT_TIME,
                        period: normalizedCommon.period || DEFAULT_PERIOD,
                    },
                ],
            };
        });
    };

    const closeOnBackdrop = (e) => {
        if (e.target === e.currentTarget) onClose?.();
    };

    const handleBlurCommonTime = () => {
        setForm((prev) => {
            const normalized = normalizeTimeFields(
                prev.commonTime,
                prev.commonPeriod,
            );
            return {
                ...prev,
                commonTime: normalized.time,
                commonPeriod: normalized.period,
            };
        });
    };

    const handleBlurSlotTime = (index) => {
        setForm((prev) => ({
            ...prev,
            scheduleSlots: prev.scheduleSlots.map((slot, i) => {
                if (i !== index) return slot;
                const normalized = normalizeTimeFields(slot.time, slot.period);
                return {
                    ...slot,
                    time: normalized.time,
                    period: normalized.period,
                };
            }),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit || submitting) return;

        try {
            setSubmitting(true);
            setError("");

            const normalizedStateSlots = normalizeScheduleSlots(derivedSlots);
            const payloadSlots = toPayloadScheduleSlots(normalizedStateSlots);

            const durationValue = parsePositiveInt(form.durationMinutes);
            const totalSessionsValue = parsePositiveInt(form.totalSessions);

            const payload = {
                name: form.name.trim(),
                subject: form.subject.trim(),
                scheduleSlots: payloadSlots,
                scheduleText: buildScheduleText(normalizedStateSlots),
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
                    t("createClass.createFailed"),
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
                    aria-label={t("createClass.close")}
                >
                    ×
                </button>

                <h3 className="cm-title">{t("createClass.title")}</h3>

                <form className="cm-form" onSubmit={handleSubmit}>
                    <label className="cm-label">
                        <span>{t("createClass.className")}</span>
                        <input
                            className="cm-input"
                            placeholder={t("createClass.classNamePlaceholder")}
                            value={form.name}
                            onChange={update("name")}
                            autoFocus
                        />
                    </label>

                    <label className="cm-label">
                        <span>{t("createClass.subject")}</span>
                        <input
                            className="cm-input"
                            placeholder={t("createClass.subjectPlaceholder")}
                            value={form.subject}
                            onChange={update("subject")}
                        />
                    </label>

                    <div className="cm-label">
                        <div className="cm-schedule-header">
                            <span>{t("createClass.schedule")}</span>

                            {!form.useCustomSchedule ? (
                                <button
                                    type="button"
                                    className="cm-link-btn"
                                    onClick={enableCustomSchedule}
                                >
                                    {t("createClass.customizePerDay")}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="cm-link-btn"
                                    onClick={disableCustomSchedule}
                                >
                                    {t("createClass.useCommonTime")}
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
                                                {t(d.labelKey)}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div
                                    style={{
                                        display: "flex",
                                        gap: 8,
                                        marginTop: 8,
                                    }}
                                >
                                    <input
                                        className="cm-input"
                                        style={{ flex: 1 }}
                                        value={form.commonTime}
                                        onChange={(e) => {
                                            setScheduleTouched(true);
                                            setForm((prev) => ({
                                                ...prev,
                                                commonTime: e.target.value,
                                            }));
                                        }}
                                        onBlur={handleBlurCommonTime}
                                        placeholder={t(
                                            "createClass.timePlaceholder",
                                        )}
                                    />

                                    <select
                                        className="cm-input"
                                        style={{ width: 90 }}
                                        value={form.commonPeriod}
                                        onChange={(e) => {
                                            setScheduleTouched(true);
                                            setForm((prev) => ({
                                                ...prev,
                                                commonPeriod: e.target.value,
                                            }));
                                        }}
                                    >
                                        <option value="AM">AM</option>
                                        <option value="PM">PM</option>
                                    </select>
                                </div>

                                <div className="cm-helper">
                                    {t("createClass.sameTimeHelper")}
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
                                                        {t(d.labelKey)}
                                                    </option>
                                                ))}
                                            </select>

                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: 8,
                                                    flex: 1,
                                                }}
                                            >
                                                <input
                                                    className="cm-input cm-slot-time"
                                                    style={{ flex: 1 }}
                                                    value={slot.time}
                                                    onChange={(e) =>
                                                        updateSlot(index, {
                                                            time: e.target
                                                                .value,
                                                        })
                                                    }
                                                    onBlur={() =>
                                                        handleBlurSlotTime(
                                                            index,
                                                        )
                                                    }
                                                    placeholder={t(
                                                        "createClass.timePlaceholder",
                                                    )}
                                                />

                                                <select
                                                    className="cm-input cm-period-select"
                                                    value={slot.period || "AM"}
                                                    onChange={(e) =>
                                                        updateSlot(index, {
                                                            period: e.target
                                                                .value,
                                                        })
                                                    }
                                                >
                                                    <option value="AM">
                                                        AM
                                                    </option>
                                                    <option value="PM">
                                                        PM
                                                    </option>
                                                </select>
                                            </div>

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
                                                title={t(
                                                    "createClass.removeScheduleRow",
                                                )}
                                                aria-label={t(
                                                    "createClass.removeScheduleRow",
                                                )}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ),
                                )}

                                <button
                                    type="button"
                                    className="cm-add-slot"
                                    onClick={addSlot}
                                >
                                    {t("createClass.addScheduleRow")}
                                </button>
                            </div>
                        )}

                        {scheduleTouched && (
                            <div className="cm-helper">
                                {t("createClass.preview")}{" "}
                                <b>
                                    {scheduleTextPreview ||
                                        t("createClass.noSchedule")}
                                </b>
                            </div>
                        )}

                        {scheduleTouched &&
                            !canSubmit &&
                            (form.commonTime || form.useCustomSchedule) && (
                                <div
                                    className="cm-helper"
                                    style={{ color: "var(--primary-color)" }}
                                >
                                    {t("createClass.timeFormatHelper.before")}{" "}
                                    <b>9:00</b>{" "}
                                    {t("createClass.timeFormatHelper.or")}{" "}
                                    <b>21:00</b>.{" "}
                                    {t("createClass.timeFormatHelper.after")}
                                </div>
                            )}
                    </div>

                    <label className="cm-label">
                        <span>{t("createClass.durationMinutes")}</span>
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
                            placeholder={t("createClass.durationPlaceholder")}
                        />
                    </label>

                    <label className="cm-label">
                        <span>{t("createClass.totalSessions")}</span>
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
                            placeholder={t(
                                "createClass.totalSessionsPlaceholder",
                            )}
                        />

                        <div className="cm-helper">
                            {t("createClass.totalSessionsHelper")}
                        </div>
                    </label>

                    {error && <div className="cm-error">{error}</div>}

                    <div className="cm-divider" />

                    <button
                        className="cm-primary"
                        type="submit"
                        disabled={!canSubmit || submitting}
                    >
                        {submitting
                            ? t("createClass.creating")
                            : t("createClass.create")}
                    </button>
                </form>
            </div>
        </div>
    );
}
