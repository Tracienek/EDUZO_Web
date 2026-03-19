// src/pages/workspace/classes/classDetail/ClassDetailPage.jsx

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiUtils } from "../../../../utils/newRequest";
import "./ClassDetailPage.css";
import CreateStudent from "../createModal/CreateStudent";
import { useAuth } from "../../../../context/auth/AuthContext";
import NotesPanel from "./NotesPanel/NotesPanel";
import FeedbackPanel from "./FeedbackPanel/FeedbackPanel";
import StudentsSection from "./StudentSection/StudentSection";

/** ---------- helpers ---------- **/
const pad2 = (n) => String(n).padStart(2, "0");
const fmtDMY = (d) =>
    `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;

const DAY_NAME = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
];

const WEEKDAY_MAP = {
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
    sun: 0,
    sunday: 0,
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

const TUITION_KEY = "__TUITION__";

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

function parseScheduleTextToSlots(scheduleText = "") {
    const text = String(scheduleText || "").trim();
    if (!text) return [];

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
}

function getScheduleSlots(cls) {
    const fromSlots = normalizeScheduleSlots(cls?.scheduleSlots || []);
    if (fromSlots.length > 0) return fromSlots;
    return parseScheduleTextToSlots(cls?.scheduleText || "");
}

function parseWeekdaysFromClass(cls) {
    const slots = getScheduleSlots(cls);

    const days = slots
        .map((slot) => WEEKDAY_MAP[String(slot.day || "").toLowerCase()])
        .filter((x) => typeof x === "number");

    return days.length ? Array.from(new Set(days)) : [1, 3, 5];
}

function getNextSessionDatesFromDate({ startDateISO, weekdays, count = 3 }) {
    const [y, m, d] = startDateISO.split("-").map(Number);
    const cur = new Date(y, m - 1, d);

    const results = [];
    while (results.length < count) {
        if (weekdays.includes(cur.getDay())) results.push(new Date(cur));
        cur.setDate(cur.getDate() + 1);
    }
    return results;
}

function getNextSessionSlot(cls, startDateISO) {
    const slots = getScheduleSlots(cls);
    if (!slots.length || !startDateISO) return null;

    const [y, m, d] = startDateISO.split("-").map(Number);
    const cur = new Date(y, m - 1, d);

    for (let i = 0; i < 21; i += 1) {
        const weekday = cur.getDay();

        const matchedSlot = slots.find(
            (slot) =>
                WEEKDAY_MAP[String(slot.day || "").toLowerCase()] === weekday,
        );

        if (matchedSlot) {
            return {
                date: new Date(cur),
                slot: matchedSlot,
            };
        }

        cur.setDate(cur.getDate() + 1);
    }

    return null;
}

const isoToDMY = (iso) => {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    if (!y || !m || !d) return "";
    return `${d}/${m}/${y}`;
};

const dmyToISO = (dmy) => {
    const m = dmy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return null;
    const [, dd, mm, yyyy] = m;
    return `${yyyy}-${mm}-${dd}`;
};

const normalizeDMYTyping = (v) => {
    let s = v.replace(/[^\d/]/g, "").slice(0, 10);
    s = s.replace(/^(\d{2})(\d)/, "$1/$2");
    s = s.replace(/^(\d{2}\/\d{2})(\d)/, "$1/$2");
    return s;
};

const toLocalISODate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
};

const getStudentId = (s) => String(s?._id || s?.id || "");

export default function ClassDetailPage() {
    const { classId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { userInfo } = useAuth();
    const { t } = useTranslation();

    const role = userInfo?.role;
    const canUseNotes = role === "teacher" || role === "center";
    const canSendTuition = role === "center";
    const isCenter = role === "center";

    const [openStudent, setOpenStudent] = useState(false);
    const [loading, setLoading] = useState(true);
    const [cls, setCls] = useState(null);

    const [startDate, setStartDate] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(
            now.getDate(),
        )}`;
    });

    const [displayDate, setDisplayDate] = useState(() => isoToDMY(startDate));

    const [checkState, setCheckState] = useState({});
    const [isEditingAttendance, setIsEditingAttendance] = useState(false);
    const [isSavingAttendance, setIsSavingAttendance] = useState(false);
    const snapshotRef = useRef(null);

    const [pendingAttendance, setPendingAttendance] = useState({});
    const [pendingHomework, setPendingHomework] = useState({});
    const [pendingTuition, setPendingTuition] = useState({});

    const [heldCount, setHeldCount] = useState(0);
    const [cycleHeld, setCycleHeld] = useState(0);
    const [threshold, setThreshold] = useState(12);
    const [sendingTuition, setSendingTuition] = useState(false);

    const tuitionBtnRef = useRef(null);

    const ensureStudentState = (studentId, base) => {
        if (base[studentId]) return base;
        return {
            ...base,
            [studentId]: { attendance: {}, homework: {}, tuition: false },
        };
    };

    const loadClass = async () => {
        const res = await apiUtils.get(`/classes/${classId}`);
        const data = res?.data?.metadata || res?.data || {};
        return data.class || data;
    };

    useEffect(() => {
        let alive = true;

        (async () => {
            try {
                setLoading(true);
                const klass = await loadClass();
                if (!alive) return;

                setCls(klass);

                setHeldCount(Number(klass?.heldCount || 0));
                if (typeof klass?.totalSessions === "number") {
                    setThreshold(Math.max(1, Number(klass.totalSessions)));
                }

                const init = {};
                (klass.students || []).forEach((s) => {
                    const id = getStudentId(s);
                    if (!id) return;
                    init[id] = {
                        attendance: {},
                        homework: {},
                        tuition: !!s.tuitionPaid || !!s.tuition,
                    };
                });
                setCheckState(init);
            } catch {
                if (alive) setCls(null);
            } finally {
                if (alive) setLoading(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, [classId]);

    useEffect(() => {
        setDisplayDate(isoToDMY(startDate));
    }, [startDate]);

    const weekdays = useMemo(() => {
        return parseWeekdaysFromClass(cls);
    }, [cls]);

    const sessionDates = useMemo(() => {
        return getNextSessionDatesFromDate({
            startDateISO: startDate,
            weekdays,
            count: 3,
        });
    }, [startDate, weekdays]);

    const dateKeys = useMemo(
        () => sessionDates.map(toLocalISODate),
        [sessionDates],
    );
    const dateKeysParam = useMemo(() => dateKeys.join(","), [dateKeys]);

    useEffect(() => {
        if (!classId) return;
        let alive = true;

        (async () => {
            try {
                const res = await apiUtils.get(
                    `/classes/${classId}/attendance?dates=${dateKeysParam}`,
                );
                const records = res?.data?.metadata?.records || [];
                if (!alive) return;

                setCheckState((prev) => {
                    const next = { ...prev };

                    for (const r of records) {
                        const sid = String(r.studentId);
                        if (!next[sid]) {
                            next[sid] = {
                                attendance: {},
                                homework: {},
                                tuition: false,
                            };
                        }

                        if (
                            r.dateKey === TUITION_KEY &&
                            typeof r.tuition === "boolean"
                        ) {
                            next[sid] = { ...next[sid], tuition: r.tuition };
                            continue;
                        }

                        if (typeof r.attendance === "boolean") {
                            next[sid] = {
                                ...next[sid],
                                attendance: {
                                    ...(next[sid].attendance || {}),
                                    [r.dateKey]: r.attendance,
                                },
                            };
                        }

                        if (typeof r.homework === "boolean") {
                            next[sid] = {
                                ...next[sid],
                                homework: {
                                    ...(next[sid].homework || {}),
                                    [r.dateKey]: r.homework,
                                },
                            };
                        }
                    }
                    return next;
                });
            } catch {
                //
            }
        })();

        return () => {
            alive = false;
        };
    }, [classId, dateKeysParam]);

    const fetchSessionSummary = async () => {
        try {
            const res = await apiUtils.get(
                `/classes/${classId}/sessions/summary`,
            );
            const meta = res?.data?.metadata || {};
            setHeldCount(Number(meta.heldCount || 0));
            setCycleHeld(Number(meta.cycleHeld || 0));
            setThreshold(Math.max(1, Number(meta.threshold) || 12));
        } catch {
            //
        }
    };

    useEffect(() => {
        if (!classId) return;
        fetchSessionSummary();
    }, [classId]);

    useEffect(() => {
        const sp = new URLSearchParams(location.search);
        const tab = sp.get("tab");
        if (tab !== "tuition") return;

        const tmr = setTimeout(() => {
            tuitionBtnRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }, 250);

        return () => clearTimeout(tmr);
    }, [location.search, cycleHeld, threshold]);

    const toggleLocal = (studentId, type, dateKey, value) => {
        setCheckState((prev) => {
            let next = { ...prev };
            next = ensureStudentState(studentId, next);
            const cur = next[studentId];

            if (type === "tuition") {
                next[studentId] = { ...cur, tuition: value };
                return next;
            }

            next[studentId] = {
                ...cur,
                [type]: { ...(cur[type] || {}), [dateKey]: value },
            };
            return next;
        });
    };

    const enterAttendanceEditMode = () => {
        if (isEditingAttendance) return;

        if (classId) {
            apiUtils.post(`/classes/${classId}/online/ping`).catch(() => {});
        }

        snapshotRef.current =
            typeof structuredClone === "function"
                ? structuredClone(checkState)
                : JSON.parse(JSON.stringify(checkState));

        setPendingAttendance({});
        setPendingHomework({});
        setPendingTuition({});
        setIsEditingAttendance(true);
    };

    const exitAttendanceEditMode = () => {
        setIsEditingAttendance(false);
        setPendingAttendance({});
        setPendingHomework({});
        setPendingTuition({});
        snapshotRef.current = null;
    };

    const markAttendancePending = (studentId, dateKey, value) => {
        setPendingAttendance((prev) => {
            const cur = prev[studentId] || {};
            return { ...prev, [studentId]: { ...cur, [dateKey]: value } };
        });
    };

    const markHomeworkPending = (studentId, dateKey, value) => {
        setPendingHomework((prev) => {
            const cur = prev[studentId] || {};
            return { ...prev, [studentId]: { ...cur, [dateKey]: value } };
        });
    };

    const markTuitionPending = (studentId, value) => {
        setPendingTuition((prev) => ({ ...prev, [studentId]: value }));
    };

    const saveAttendance = async () => {
        const changes = [];

        Object.entries(pendingAttendance).forEach(([studentId, m]) => {
            Object.entries(m || {}).forEach(([dateKey, value]) => {
                changes.push({ studentId, dateKey, attendance: !!value });
            });
        });

        Object.entries(pendingHomework).forEach(([studentId, m]) => {
            Object.entries(m || {}).forEach(([dateKey, value]) => {
                changes.push({ studentId, dateKey, homework: !!value });
            });
        });

        const tuitionChanges = Object.entries(pendingTuition).map(
            ([studentId, tuition]) => ({
                studentId,
                tuition: !!tuition,
            }),
        );

        const editedDateKeys = Array.from(
            new Set(changes.map((c) => c.dateKey).filter(Boolean)),
        ).sort();

        const logDateKey = editedDateKeys.slice(-1)[0] || startDate;

        const nextSessionInfo = getNextSessionSlot(cls, startDate);
        const logTimeLabel = nextSessionInfo?.slot?.time || "";

        if (!changes.length && !tuitionChanges.length) {
            exitAttendanceEditMode();
            return;
        }

        try {
            setIsSavingAttendance(true);

            const res = await apiUtils.patch(
                `/classes/${classId}/attendance/bulk`,
                {
                    changes,
                    tuitionChanges,
                    logMeta: {
                        dateKey: logDateKey,
                        timeLabel: logTimeLabel,
                    },
                },
            );

            const meta = res?.data?.metadata || {};
            if (typeof meta.heldCount === "number")
                setHeldCount(meta.heldCount);
            if (typeof meta.cycleHeld === "number")
                setCycleHeld(meta.cycleHeld);
            if (typeof meta.threshold === "number")
                setThreshold(Math.max(1, meta.threshold));

            await fetchSessionSummary();

            try {
                const klass = await loadClass();
                setCls(klass);
            } catch {
                //
            }

            exitAttendanceEditMode();
        } catch (err) {
            console.error(err);
            alert(err?.response?.data?.message || t("classDetail.saveFailed"));
        } finally {
            setIsSavingAttendance(false);
        }
    };

    const cancelAttendance = () => {
        const snap = snapshotRef.current;
        if (snap) setCheckState(snap);
        exitAttendanceEditMode();
    };

    const sendTuitionEmail = async () => {
        if (!canSendTuition) return;

        if (cycleHeld < threshold) {
            alert(
                t("classDetail.notEnoughSessions", {
                    held: cycleHeld,
                    threshold,
                }),
            );
            return;
        }

        try {
            setSendingTuition(true);

            const res = await apiUtils.post(`/classes/${classId}/tuition/send`);
            const meta = res?.data?.metadata || {};
            alert(
                t("classDetail.tuitionEmailsSent", {
                    sent: meta.sent || 0,
                    total: meta.total || 0,
                }),
            );

            await fetchSessionSummary();

            const klass = await loadClass();
            setCls(klass);
        } catch (err) {
            alert(
                err?.response?.data?.message ||
                    t("classDetail.sendTuitionFailed"),
            );
        } finally {
            setSendingTuition(false);
        }
    };

    if (loading)
        return <div className="cd-muted">{t("classDetail.loading")}</div>;
    if (!cls)
        return <div className="cd-muted">{t("classDetail.classNotFound")}</div>;

    const nextSessionInfo = getNextSessionSlot(cls, startDate);
    const nextSession = nextSessionInfo?.date || null;
    const nextSessionSlot = nextSessionInfo?.slot || null;

    const nextSessionDayLabel = nextSession
        ? t(`weekdays.${DAY_NAME[nextSession.getDay()].toLowerCase()}`)
        : "";

    const nextSessionSubLabel = nextSession
        ? `${fmtDMY(nextSession)}${
              nextSessionSlot?.time ? `, ${nextSessionSlot.time}` : ""
          }`
        : t("classDetail.emptyValue");

    const students = cls.students || [];

    const tuitionSent = !!cls?.tuitionEmailSentAt && cycleHeld === 0;
    const tuitionDue = cycleHeld >= threshold && !tuitionSent;

    const handleDeleteStudent = async (student) => {
        const studentId = getStudentId(student);
        if (!studentId) return;

        const name =
            student?.fullName || student?.name || t("classDetail.thisStudent");
        const ok = window.confirm(
            t("classDetail.confirmDeleteStudent", { name }),
        );
        if (!ok) return;

        try {
            await apiUtils.delete(`/classes/${classId}/students/${studentId}`);

            setCls((prev) => {
                if (!prev) return prev;
                const nextStudents = (prev.students || []).filter(
                    (s) => getStudentId(s) !== studentId,
                );
                const count = nextStudents.length;
                return {
                    ...prev,
                    students: nextStudents,
                    totalStudents: count,
                    studentCount: count,
                };
            });

            setCheckState((prev) => {
                const next = { ...prev };
                delete next[studentId];
                return next;
            });
        } catch (err) {
            alert(
                err?.response?.data?.message ||
                    t("classDetail.deleteStudentFailed"),
            );
        }
    };

    return (
        <div className="cd-wrap">
            <div className="cd-top">
                <div className="cd-title">
                    {cls.name || cls.className || t("classDetail.unnamedClass")}
                    {isCenter && tuitionDue && (
                        <span
                            className="cd-badge-danger"
                            style={{ marginLeft: 10 }}
                        >
                            {t("classDetail.tuitionDue")}
                        </span>
                    )}
                    {isCenter && tuitionSent && (
                        <span
                            className="cd-badge-ok"
                            style={{ marginLeft: 10 }}
                        >
                            {t("classDetail.tuitionSent")}
                        </span>
                    )}
                </div>

                <div className="cd-top-actions">
                    <button
                        className="cd-btn"
                        type="button"
                        onClick={() =>
                            navigate(`/workspace/classes/${classId}/attendance`)
                        }
                        title={t("classDetail.viewFullAttendance")}
                    >
                        {t("classDetail.viewFullAttendance")}
                    </button>

                    <button
                        className="cd-btn"
                        type="button"
                        onClick={() => setOpenStudent(true)}
                    >
                        {t("classDetail.addStudent")}
                    </button>
                </div>

                <div className="cd-schedule">
                    {cls.scheduleText || t("classDetail.defaultSchedule")}
                </div>
            </div>

            <CreateStudent
                open={openStudent}
                onClose={() => setOpenStudent(false)}
                classId={classId}
                onCreated={(createdStudent) => {
                    if (!createdStudent) return;

                    setCls((prev) => {
                        if (!prev) return prev;
                        const nextStudents = [
                            ...(prev.students || []),
                            createdStudent,
                        ];
                        const count = nextStudents.length;

                        return {
                            ...prev,
                            students: nextStudents,
                            totalStudents: count,
                            studentCount: count,
                        };
                    });

                    const id = getStudentId(createdStudent);
                    if (!id) return;

                    setCheckState((prev) => ({
                        ...prev,
                        [id]: {
                            attendance: {},
                            homework: {},
                            tuition:
                                !!createdStudent.tuitionPaid ||
                                !!createdStudent.tuition,
                        },
                    }));
                }}
            />

            <div className="cd-stats">
                <div className="cd-stat">
                    <div className="cd-stat-label">
                        {t("classDetail.totalStudents")}
                    </div>
                    <div className="cd-stat-value">
                        {cls.totalStudents ?? cls.studentCount ?? 0}
                    </div>
                    <div className="cd-stat-sub">
                        {t("classDetail.enrolled")}
                    </div>
                </div>

                <div className="cd-stat">
                    <div className="cd-stat-label">
                        {t("classDetail.nextSession")}
                    </div>
                    <div className="cd-stat-value">
                        {nextSession
                            ? nextSessionDayLabel
                            : t("classDetail.emptyValue")}
                    </div>
                    <div className="cd-stat-sub">{nextSessionSubLabel}</div>
                </div>

                <div className="cd-stat">
                    <div className="cd-stat-label">
                        {t("classDetail.duration")}
                    </div>
                    <div className="cd-stat-value">
                        {t("classDetail.durationMinutes", {
                            count: cls?.durationMinutes ?? 90,
                        })}
                    </div>
                    <div className="cd-stat-sub">
                        {t("classDetail.perSession")}
                    </div>
                </div>

                <div className="cd-stat">
                    <div className="cd-stat-label">
                        {t("classDetail.sessionsHeld")}
                    </div>
                    <div className="cd-stat-value">
                        {cycleHeld}/{threshold}
                    </div>
                    <div className="cd-stat-sub">
                        {isCenter
                            ? tuitionSent
                                ? t("classDetail.tuitionSent")
                                : tuitionDue
                                  ? t("classDetail.dueTuition")
                                  : t("classDetail.notReady")
                            : t("classDetail.emptyValue")}
                    </div>
                </div>
            </div>

            <StudentsSection
                students={students}
                sessionDates={sessionDates}
                dateKeys={dateKeys}
                checkState={checkState}
                displayDate={displayDate}
                startDate={startDate}
                isEditingAttendance={isEditingAttendance}
                isSavingAttendance={isSavingAttendance}
                canSendTuition={isCenter}
                canDeleteStudent={isCenter}
                sendingTuition={sendingTuition}
                heldCount={cycleHeld}
                threshold={threshold}
                tuitionSent={tuitionSent}
                tuitionBtnRef={tuitionBtnRef}
                onSendTuitionEmail={sendTuitionEmail}
                onChangeDisplayDate={(e) => {
                    const v = normalizeDMYTyping(e.target.value);
                    setDisplayDate(v);

                    const iso = dmyToISO(v);
                    if (iso) setStartDate(iso);
                }}
                onDateBlur={() => {
                    const iso = dmyToISO(displayDate);
                    if (!iso) setDisplayDate(isoToDMY(startDate));
                }}
                onChangeStartDate={(e) => setStartDate(e.target.value)}
                onOpenDatePicker={() => {
                    const el = document.getElementById("cdDatePicker");
                    if (!el) return;
                    if (el.showPicker) el.showPicker();
                    else el.focus();
                }}
                onEnterEditMode={enterAttendanceEditMode}
                onToggleLocal={toggleLocal}
                onMarkAttendancePending={markAttendancePending}
                onMarkHomeworkPending={markHomeworkPending}
                onMarkTuitionPending={markTuitionPending}
                onCancelAttendance={cancelAttendance}
                onSaveAttendance={saveAttendance}
                onDeleteStudent={isCenter ? handleDeleteStudent : undefined}
                fmtDMY={fmtDMY}
            />

            {canUseNotes && (
                <NotesPanel
                    classId={classId}
                    role={role}
                    userInfo={userInfo}
                    classNameValue={cls?.name || cls?.className || ""}
                />
            )}

            <FeedbackPanel classId={classId} role={role} userInfo={userInfo} />
        </div>
    );
}
