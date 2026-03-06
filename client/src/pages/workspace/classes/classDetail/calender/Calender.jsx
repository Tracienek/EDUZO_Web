import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiUtils } from "../../../../../utils/newRequest";
import "./Calender.css";

const WEEKDAY_MAP = {
    sun: 0,
    sunday: 0,
    mon: 1,
    monday: 1,
    tue: 2,
    tues: 2,
    tuesday: 2,
    wed: 3,
    wednesday: 3,
    thu: 4,
    thur: 4,
    thurs: 4,
    thursday: 4,
    fri: 5,
    friday: 5,
    sat: 6,
    saturday: 6,
};

const DAY_ALIASES = {
    mon: "Mon",
    monday: "Mon",
    tue: "Tue",
    tues: "Tue",
    tuesday: "Tue",
    wed: "Wed",
    wednesday: "Wed",
    thu: "Thu",
    thur: "Thu",
    thurs: "Thu",
    thursday: "Thu",
    fri: "Fri",
    friday: "Fri",
    sat: "Sat",
    saturday: "Sat",
    sun: "Sun",
    sunday: "Sun",
};

const WEEKDAY_LABELS = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
];

const EVENT_COLORS = [
    "ec-event--purple",
    "ec-event--green",
    "ec-event--orange",
    "ec-event--pink",
    "ec-event--blue",
    "ec-event--yellow",
    "ec-event--gray",
    "ec-event--mint",
];

const HOURS = Array.from({ length: 20 }, (_, i) => i + 4); // 04:00 -> 23:00
const PIXELS_PER_HOUR = 76;
const CALENDAR_START_HOUR = 4;

const pad2 = (n) => String(n).padStart(2, "0");

const startOfWeekMonday = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
};

const addDays = (date, days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
};

const formatDateKey = (date) => {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
        date.getDate(),
    )}`;
};

const formatTimeLabel = (hour) => `${pad2(hour)}:00`;

const parseTimeToMinutes = (timeText) => {
    if (!timeText) return null;

    const raw = String(timeText).trim().toLowerCase();

    const ampmMatch = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
    if (ampmMatch) {
        let hour = Number(ampmMatch[1]);
        const minute = Number(ampmMatch[2] || 0);
        const period = ampmMatch[3].toLowerCase();

        if (hour > 12 || minute > 59) return null;

        if (period === "pm" && hour !== 12) hour += 12;
        if (period === "am" && hour === 12) hour = 0;

        return hour * 60 + minute;
    }

    const hmMatch = raw.match(/^(\d{1,2}):(\d{2})$/);
    if (hmMatch) {
        const hour = Number(hmMatch[1]);
        const minute = Number(hmMatch[2]);

        if (hour > 23 || minute > 59) return null;
        return hour * 60 + minute;
    }

    const simpleHourMatch = raw.match(/^(\d{1,2})$/);
    if (simpleHourMatch) {
        const hour = Number(simpleHourMatch[1]);
        if (hour > 23) return null;
        return hour * 60;
    }

    return null;
};

const formatMinutesToLabel = (mins) => {
    const hour = Math.floor(mins / 60);
    const minute = mins % 60;
    return `${pad2(hour)}:${pad2(minute)}`;
};

const normalizeDayLabel = (value = "") => {
    return (
        DAY_ALIASES[
            String(value || "")
                .trim()
                .toLowerCase()
        ] || ""
    );
};

const normalizeScheduleSlots = (slots = []) => {
    if (!Array.isArray(slots)) return [];

    return slots
        .map((slot) => ({
            day: normalizeDayLabel(slot?.day),
            time: String(slot?.time || "").trim(),
        }))
        .filter((slot) => slot.day && slot.time);
};

const parseScheduleTextToSlots = (scheduleText = "") => {
    const text = String(scheduleText || "").trim();
    if (!text) return [];

    // format mới: "Wed - 19:00 AM, Thu - 9:00 pM, Sat - 9:00 AM"
    const directPattern = /(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s*-\s*([^,]+)/gi;
    const directSlots = [];
    let match;

    while ((match = directPattern.exec(text)) !== null) {
        directSlots.push({
            day: normalizeDayLabel(match[1]),
            time: String(match[2] || "").trim(),
        });
    }

    if (directSlots.length > 0) {
        return normalizeScheduleSlots(directSlots);
    }

    // format cũ: "Mon, Wed, Fri - 9:00 AM"
    const legacyMatch = text.match(
        /^((?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)(?:\s*,\s*(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun))*)\s*-\s*(.+)$/i,
    );

    if (!legacyMatch) return [];

    const days = String(legacyMatch[1] || "")
        .split(",")
        .map((x) => normalizeDayLabel(x))
        .filter(Boolean);

    const time = String(legacyMatch[2] || "").trim();
    if (!time) return [];

    return normalizeScheduleSlots(days.map((day) => ({ day, time })));
};

const getScheduleSlots = (cls) => {
    const fromSlots = normalizeScheduleSlots(cls?.scheduleSlots || []);
    if (fromSlots.length > 0) return fromSlots;
    return parseScheduleTextToSlots(cls?.scheduleText || "");
};

const parseClassSchedules = (cls, durationMinutes = 90) => {
    const slots = getScheduleSlots(cls);

    return slots
        .map((slot) => {
            const weekday = WEEKDAY_MAP[String(slot.day || "").toLowerCase()];
            const startMinutes = parseTimeToMinutes(slot.time);

            if (typeof weekday !== "number" || startMinutes === null) {
                return null;
            }

            const endMinutes = startMinutes + (Number(durationMinutes) || 90);

            return {
                weekday,
                startMinutes,
                endMinutes,
                timeLabel: `${formatMinutesToLabel(startMinutes)} - ${formatMinutesToLabel(endMinutes)}`,
                rawTime: slot.time,
                dayLabel: slot.day,
            };
        })
        .filter(Boolean);
};

const getColorClass = (index) => EVENT_COLORS[index % EVENT_COLORS.length];

const eventsOverlap = (a, b) => {
    return a.startMinutes < b.endMinutes && b.startMinutes < a.endMinutes;
};

const buildOverlapLayout = (events) => {
    if (!events.length) return [];

    const sorted = [...events].sort((a, b) => {
        if (a.startMinutes !== b.startMinutes) {
            return a.startMinutes - b.startMinutes;
        }
        return a.endMinutes - b.endMinutes;
    });

    const clusters = [];
    let currentCluster = [];
    let currentClusterEnd = -1;

    sorted.forEach((event) => {
        if (!currentCluster.length) {
            currentCluster = [event];
            currentClusterEnd = event.endMinutes;
            return;
        }

        if (event.startMinutes < currentClusterEnd) {
            currentCluster.push(event);
            currentClusterEnd = Math.max(currentClusterEnd, event.endMinutes);
        } else {
            clusters.push(currentCluster);
            currentCluster = [event];
            currentClusterEnd = event.endMinutes;
        }
    });

    if (currentCluster.length) {
        clusters.push(currentCluster);
    }

    const laidOut = [];

    clusters.forEach((cluster) => {
        const columns = [];

        cluster.forEach((event) => {
            let placedColumnIndex = -1;

            for (let i = 0; i < columns.length; i += 1) {
                const lastEventInColumn = columns[i][columns[i].length - 1];
                if (!eventsOverlap(lastEventInColumn, event)) {
                    placedColumnIndex = i;
                    break;
                }
            }

            if (placedColumnIndex === -1) {
                columns.push([event]);
                placedColumnIndex = columns.length - 1;
            } else {
                columns[placedColumnIndex].push(event);
            }

            laidOut.push({
                ...event,
                columnIndex: placedColumnIndex,
                columns: columns.length,
            });
        });

        const totalColumns = columns.length;

        for (let i = 0; i < laidOut.length; i += 1) {
            const item = laidOut[i];
            if (cluster.some((e) => e.id === item.id)) {
                laidOut[i] = {
                    ...item,
                    columns: totalColumns,
                };
            }
        }
    });

    return laidOut;
};

export default function CalenderPage() {
    const navigate = useNavigate();
    const { classId } = useParams();

    const [loading, setLoading] = useState(true);
    const [classes, setClasses] = useState([]);
    const [weekStart, setWeekStart] = useState(() =>
        startOfWeekMonday(new Date()),
    );
    const [selectedDateKey, setSelectedDateKey] = useState(() =>
        formatDateKey(new Date()),
    );

    useEffect(() => {
        let alive = true;

        (async () => {
            try {
                setLoading(true);
                const res = await apiUtils.get("/classes/available");
                const list = res?.data?.metadata?.classes || [];
                if (!alive) return;
                setClasses(list);
            } catch (err) {
                console.error("Failed to fetch classes:", err);
                if (alive) setClasses([]);
            } finally {
                if (alive) setLoading(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, []);

    const weekDays = useMemo(() => {
        return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    }, [weekStart]);

    const allEvents = useMemo(() => {
        const result = [];

        classes.forEach((cls, index) => {
            const schedules = parseClassSchedules(
                cls,
                cls?.durationMinutes || 90,
            );

            schedules.forEach((s, sIndex) => {
                const eventDate = weekDays.find(
                    (d) => d.getDay() === s.weekday,
                );
                if (!eventDate) return;

                result.push({
                    id: `${cls._id}-${s.weekday}-${sIndex}`,
                    classId: cls._id,
                    title: cls.name || "Untitled Class",
                    subject: cls.subject || "",
                    weekday: s.weekday,
                    dateKey: formatDateKey(eventDate),
                    startMinutes: s.startMinutes,
                    endMinutes: s.endMinutes,
                    timeLabel: s.timeLabel,
                    rawTime: s.rawTime,
                    dayLabel: s.dayLabel,
                    isOnline: !!cls.isOnline,
                    totalStudents:
                        cls.totalStudents ??
                        cls.studentCount ??
                        cls.students?.length ??
                        0,
                    colorClass: getColorClass(index),
                });
            });
        });

        return result.sort((a, b) => a.startMinutes - b.startMinutes);
    }, [classes, weekDays]);

    const selectedDate = useMemo(() => {
        return (
            weekDays.find((d) => formatDateKey(d) === selectedDateKey) ||
            weekDays[0]
        );
    }, [selectedDateKey, weekDays]);

    const selectedDayEvents = useMemo(() => {
        const daily = allEvents.filter(
            (event) => event.dateKey === selectedDateKey,
        );
        return buildOverlapLayout(daily);
    }, [allEvents, selectedDateKey]);

    const maxColumnsInDay = useMemo(() => {
        if (!selectedDayEvents.length) return 1;
        return Math.max(...selectedDayEvents.map((e) => e.columns || 1));
    }, [selectedDayEvents]);

    const shouldScrollX = maxColumnsInDay > 4;

    const handlePrevWeek = () => {
        const next = addDays(weekStart, -7);
        setWeekStart(next);
        setSelectedDateKey(formatDateKey(next));
    };

    const handleNextWeek = () => {
        const next = addDays(weekStart, 7);
        setWeekStart(next);
        setSelectedDateKey(formatDateKey(next));
    };

    if (loading) {
        return <div className="ec-loading">Loading calendar...</div>;
    }

    return (
        <div className="ec-page">
            <div className="ec-card">
                <div className="ec-toolbar">
                    <div className="ec-toolbar-left">
                        <button
                            type="button"
                            className="ec-back-btn"
                            onClick={() =>
                                classId
                                    ? navigate(`/workspace/classes/${classId}`)
                                    : navigate("/workspace/classes")
                            }
                        >
                            Back
                        </button>
                    </div>

                    <div>
                        <h1 className="ec-title">Calendar</h1>
                    </div>

                    <div className="ec-toolbar-right">
                        <button
                            type="button"
                            className="ec-nav-btn"
                            onClick={handlePrevWeek}
                        >
                            ←
                        </button>
                        <button
                            type="button"
                            className="ec-nav-btn"
                            onClick={handleNextWeek}
                        >
                            →
                        </button>
                    </div>
                </div>

                <div className="ec-week-header">
                    {weekDays.map((date) => {
                        const dateKey = formatDateKey(date);
                        const isActive = dateKey === selectedDateKey;

                        return (
                            <button
                                key={dateKey}
                                type="button"
                                className={`ec-week-day ${isActive ? "is-active" : ""}`}
                                onClick={() => setSelectedDateKey(dateKey)}
                            >
                                <span className="ec-week-day-name">
                                    {WEEKDAY_LABELS[date.getDay()]}
                                </span>
                                <span className="ec-week-day-number">
                                    {date.getDate()} <p>/</p>{" "}
                                    {date.getMonth() + 1}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="ec-selected-label">
                    <p>
                        {selectedDate
                            ? `${WEEKDAY_LABELS[selectedDate.getDay()]}`
                            : ""}
                        {" · "}
                        {selectedDayEvents.length} class(es)
                    </p>
                </div>

                <div
                    className={`ec-calendar-board ${
                        shouldScrollX ? "ec-calendar-board--scroll" : ""
                    }`}
                >
                    <div className="ec-time-column">
                        {HOURS.map((hour) => (
                            <div key={hour} className="ec-time-slot">
                                {formatTimeLabel(hour)}
                            </div>
                        ))}
                    </div>

                    <div
                        className={`ec-day-board ${
                            shouldScrollX ? "ec-day-board--wide" : ""
                        }`}
                    >
                        {HOURS.map((hour) => (
                            <div key={hour} className="ec-board-row" />
                        ))}

                        <div className="ec-events-layer">
                            {selectedDayEvents.map((event) => {
                                const top =
                                    ((event.startMinutes -
                                        CALENDAR_START_HOUR * 60) /
                                        60) *
                                    PIXELS_PER_HOUR;

                                const height =
                                    ((event.endMinutes - event.startMinutes) /
                                        60) *
                                    PIXELS_PER_HOUR;

                                const horizontalGap = 4;
                                const width =
                                    event.columns > 1
                                        ? `calc((100% - ${(event.columns - 1) * horizontalGap}px) / ${event.columns})`
                                        : "100%";

                                const left =
                                    event.columns > 1
                                        ? `calc(${event.columnIndex} * (${width} + ${horizontalGap}px))`
                                        : "0px";

                                return (
                                    <button
                                        key={event.id}
                                        type="button"
                                        className={`ec-event ${event.colorClass}`}
                                        style={{
                                            top: `${top}px`,
                                            height: `${height}px`,
                                            width,
                                            left,
                                        }}
                                        onClick={() =>
                                            navigate(
                                                `/workspace/classes/${event.classId}`,
                                            )
                                        }
                                    >
                                        <div className="ec-event-title">
                                            {event.title}
                                            {event.isOnline && (
                                                <span className="ec-online-badge">
                                                    Online
                                                </span>
                                            )}
                                        </div>

                                        <div className="ec-event-time">
                                            {event.timeLabel}
                                        </div>

                                        <div className="ec-event-meta">
                                            <span>
                                                {event.totalStudents} student
                                                {event.totalStudents !== 1
                                                    ? "s"
                                                    : ""}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {!selectedDayEvents.length && (
                    <div className="ec-empty">
                        No classes scheduled for this day.
                    </div>
                )}
            </div>
        </div>
    );
}
