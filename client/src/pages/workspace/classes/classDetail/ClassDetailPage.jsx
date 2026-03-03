// src/pages/workspace/classes/classDetail/ClassDetailPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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

function parseWeekdays(scheduleText = "") {
    const left = scheduleText.split("-")[0] || "";
    const tokens = left
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

    const days = tokens
        .map((t) => WEEKDAY_MAP[t])
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

const DAY_NAME = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
];

const TUITION_KEY = "__TUITION__";

const extractTimeFromSchedule = (scheduleText = "") => {
    const parts = scheduleText.split("-").map((s) => s.trim());
    return parts.length >= 2 ? parts.slice(1).join("-").trim() : "";
};

const toLocalISODate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
};

// ✅ Stable student id: only backend id
const getStudentId = (s) => String(s?._id || s?.id || "");

export default function ClassDetailPage() {
    const { classId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { userInfo } = useAuth();

    const role = userInfo?.role;
    const canUseNotes = role === "teacher" || role === "center";
    const canSendTuition = role === "center";
    const isCenter = role === "center";
    const canManageStudents = isCenter;

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
    const snapshotRef = useRef(null);

    const [pendingAttendance, setPendingAttendance] = useState({});
    const [pendingHomework, setPendingHomework] = useState({});
    const [pendingTuition, setPendingTuition] = useState({});

    // sessions summary
    const [heldCount, setHeldCount] = useState(0);
    const [cycleHeld, setCycleHeld] = useState(0);
    const [threshold, setThreshold] = useState(12);
    const [sendingTuition, setSendingTuition] = useState(false);

    // scroll target for notification "?tab=tuition"
    const tuitionBtnRef = useRef(null);

    const ensureStudentState = (studentId, base) => {
        if (base[studentId]) return base;
        return {
            ...base,
            [studentId]: { attendance: {}, homework: {}, tuition: false },
        };
    };

    /** ===== load class ===== */
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [classId]);

    useEffect(() => {
        setDisplayDate(isoToDMY(startDate));
    }, [startDate]);

    const weekdays = useMemo(
        () => parseWeekdays(cls?.scheduleText || "Mon, Wed, Fri - 9:00 AM"),
        [cls?.scheduleText],
    );

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

    /** ===== fetch attendance records ===== */
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
                // ignore
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
        } catch {}
    };

    useEffect(() => {
        if (!classId) return;
        fetchSessionSummary();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [classId]);

    useEffect(() => {
        const sp = new URLSearchParams(location.search);
        const tab = sp.get("tab");
        if (tab !== "tuition") return;

        const t = setTimeout(() => {
            tuitionBtnRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }, 250);

        return () => clearTimeout(t);
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

        if (!changes.length && !tuitionChanges.length) {
            exitAttendanceEditMode();
            return;
        }

        try {
            const res = await apiUtils.patch(
                `/classes/${classId}/attendance/bulk`,
                {
                    changes,
                    tuitionChanges,
                    logMeta: {
                        dateKey: dateKeys?.[0] || startDate,
                        timeLabel: extractTimeFromSchedule(
                            cls?.scheduleText || "",
                        ),
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
                // ignore
            }

            exitAttendanceEditMode();
        } catch (err) {
            console.error(err);
            alert(
                err?.response?.data?.message ||
                    "Save failed. Please try again.",
            );
        }
    };

    const cancelAttendance = () => {
        const snap = snapshotRef.current;
        if (snap) setCheckState(snap);
        exitAttendanceEditMode();
    };

    const sendTuitionEmail = async () => {
        if (!canSendTuition) return;

        // ✅ hard guard: even if button somehow enabled, block request
        if (cycleHeld < threshold) {
            alert(`Not enough sessions held: ${cycleHeld}/${threshold}`);
            return;
        }

        try {
            setSendingTuition(true);

            const res = await apiUtils.post(`/classes/${classId}/tuition/send`);
            const meta = res?.data?.metadata || {};
            alert(`Tuition emails sent: ${meta.sent || 0}/${meta.total || 0}`);

            await fetchSessionSummary();

            const klass = await loadClass();
            setCls(klass);
        } catch (err) {
            alert(
                err?.response?.data?.message ||
                    "Failed to send tuition emails.",
            );
        } finally {
            setSendingTuition(false);
        }
    };

    if (loading) return <div className="cd-muted">Loading...</div>;
    if (!cls) return <div className="cd-muted">Class not found</div>;

    const nextSession = sessionDates?.[0] || null;
    const nextSessionDayLabel = nextSession
        ? DAY_NAME[nextSession.getDay()]
        : "";
    const nextSessionTimeLabel = extractTimeFromSchedule(
        cls?.scheduleText || "",
    );
    const nextSessionSubLabel = nextSession
        ? `${fmtDMY(nextSession)}${nextSessionTimeLabel ? `, ${nextSessionTimeLabel}` : ""}`
        : "—";

    const students = cls.students || [];

    const tuitionSent = !!cls?.tuitionEmailSentAt && cycleHeld === 0;

    const tuitionDue = cycleHeld >= threshold && !tuitionSent;

    const handleDeleteStudent = async (student) => {
        const studentId = getStudentId(student);
        if (!studentId) return;

        const name = student?.fullName || student?.name || "this student";
        const ok = window.confirm(`Remove ${name} from this class?`);
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
            alert(err?.response?.data?.message || "Failed to delete student");
        }
    };

    return (
        <div className="cd-wrap">
            {/* ===== HEADER ===== */}
            <div className="cd-top">
                <div className="cd-title">
                    {cls.name || cls.className || "{classes.name}"}
                    {isCenter && tuitionDue && (
                        <span
                            className="cd-badge-danger"
                            style={{ marginLeft: 10 }}
                        >
                            Tuition Due
                        </span>
                    )}
                    {isCenter && tuitionSent && (
                        <span
                            className="cd-badge-ok"
                            style={{ marginLeft: 10 }}
                        >
                            Tuition Sent
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
                        title="View full attendance"
                    >
                        View full attendance
                    </button>

                    <button
                        className="cd-btn"
                        type="button"
                        onClick={() => setOpenStudent(true)}
                    >
                        + Student
                    </button>
                </div>

                <div className="cd-schedule">
                    {cls.scheduleText || "Mon, Wed, Fri - 9:00 AM"}
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

            {/* ===== STATS ===== */}
            <div className="cd-stats">
                <div className="cd-stat">
                    <div className="cd-stat-label">Total Students</div>
                    <div className="cd-stat-value">
                        {cls.totalStudents ?? cls.studentCount ?? 0}
                    </div>
                    <div className="cd-stat-sub">Enrolled</div>
                </div>

                <div className="cd-stat">
                    <div className="cd-stat-label">Next Session</div>
                    <div className="cd-stat-value">
                        {nextSession ? nextSessionDayLabel : "—"}
                    </div>
                    <div className="cd-stat-sub">{nextSessionSubLabel}</div>
                </div>

                <div className="cd-stat">
                    <div className="cd-stat-label">Duration</div>
                    <div className="cd-stat-value">
                        {cls?.durationMinutes ?? 90} min
                    </div>
                    <div className="cd-stat-sub">Per session</div>
                </div>

                <div className="cd-stat">
                    <div className="cd-stat-label">Sessions held</div>
                    <div className="cd-stat-value">
                        {cycleHeld}/{threshold}
                    </div>
                    <div className="cd-stat-sub">
                        {isCenter
                            ? tuitionSent
                                ? "Tuition sent"
                                : tuitionDue
                                  ? "Due tuition"
                                  : "Not ready"
                            : "—"}
                    </div>
                </div>
            </div>

            {/* ===== STUDENTS SECTION ===== */}
            <StudentsSection
                students={students}
                sessionDates={sessionDates}
                dateKeys={dateKeys}
                checkState={checkState}
                displayDate={displayDate}
                startDate={startDate}
                isEditingAttendance={isEditingAttendance}
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

            {/* ===== NOTES PANEL ===== */}
            {canUseNotes && (
                <NotesPanel
                    classId={classId}
                    role={role}
                    userInfo={userInfo}
                    classNameValue={cls?.name || cls?.className || ""}
                />
            )}

            {/* ===== FEEDBACK PANEL ===== */}
            <FeedbackPanel classId={classId} role={role} userInfo={userInfo} />
        </div>
    );
}
