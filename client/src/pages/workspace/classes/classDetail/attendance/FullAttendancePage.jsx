// src/pages/workspace/classes/fullAttendance/FullAttendancePage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiUtils } from "../../../../../utils/newRequest";
import "./FullAttendancePage.css";

/** ===== helpers ===== */
const pad2 = (n) => String(n).padStart(2, "0");
const toISODate = (d) =>
    `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const isoToDMY = (iso) => {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    if (!y || !m || !d) return "";
    return `${d}/${m}/${y}`;
};

const dmyToISO = (dmy) => {
    const m = dmy.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) return null;
    let [, dd, mm, yyyy] = m;
    dd = String(dd).padStart(2, "0");
    mm = String(mm).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
};

const normalizeDMYTyping = (v) => {
    let s = v.replace(/[^\d/]/g, "").slice(0, 10);
    s = s.replace(/^(\d{2})(\d)/, "$1/$2");
    s = s.replace(/^(\d{2}\/\d{2})(\d)/, "$1/$2");
    return s;
};

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

function getMonthRangeFromISO(iso) {
    const [y, m] = iso.split("-").map(Number);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0);
    return { start, end };
}

function buildSessionDatesInRange({ start, end, weekdays }) {
    const cur = new Date(start);
    const res = [];
    while (cur <= end) {
        if (weekdays.includes(cur.getDay())) res.push(new Date(cur));
        cur.setDate(cur.getDate() + 1);
    }
    return res;
}

function splitByMidMonth(dates) {
    const a = [];
    const b = [];
    for (const d of dates) {
        if (d.getDate() <= 15) a.push(d);
        else b.push(d);
    }
    return [a, b];
}

function normalizeStudentId(s, idx) {
    return String(s?._id || s?.id || s?.email || s?.fullName || s?.name || idx);
}

export default function FullAttendancePage() {
    const { classId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [cls, setCls] = useState(null);
    const [error, setError] = useState("");

    const [monthISO, setMonthISO] = useState(() => toISODate(new Date()));
    const [displayMonth, setDisplayMonth] = useState(() => isoToDMY(monthISO));

    const [records, setRecords] = useState({});

    useEffect(() => {
        let alive = true;

        (async () => {
            try {
                setLoading(true);
                setError("");

                const res = await apiUtils.get(`/classes/${classId}`);
                const data = res?.data?.metadata || res?.data || {};
                const klass = data.class || data;

                if (!alive) return;
                setCls(klass);
            } catch {
                if (!alive) return;
                setCls(null);
                setError("Class not found");
            } finally {
                if (alive) setLoading(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, [classId]);

    useEffect(() => {
        setDisplayMonth(isoToDMY(monthISO));
    }, [monthISO]);

    const weekdays = useMemo(
        () => parseWeekdays(cls?.scheduleText || "Mon, Wed, Fri - 9:00 AM"),
        [cls?.scheduleText],
    );

    const monthRange = useMemo(
        () => getMonthRangeFromISO(monthISO),
        [monthISO],
    );

    const sessionDates = useMemo(() => {
        return buildSessionDatesInRange({
            start: monthRange.start,
            end: monthRange.end,
            weekdays,
        });
    }, [monthRange.start, monthRange.end, weekdays]);

    const [datesA, datesB] = useMemo(
        () => splitByMidMonth(sessionDates),
        [sessionDates],
    );

    const maxCols = useMemo(
        () => Math.max(datesA.length, datesB.length, 1),
        [datesA.length, datesB.length],
    );

    const allDateKeys = useMemo(() => {
        const a = datesA.map(toISODate);
        const b = datesB.map(toISODate);
        return [...a, ...b];
    }, [datesA, datesB]);

    useEffect(() => {
        if (!classId) return;
        let alive = true;

        (async () => {
            try {
                if (!allDateKeys.length) {
                    setRecords({});
                    return;
                }

                const res = await apiUtils.get(
                    `/classes/${classId}/attendance?dates=${allDateKeys.join(",")}`,
                );
                const list = res?.data?.metadata?.records || [];

                if (!alive) return;

                const next = {};
                for (const r of list) {
                    const sid = String(r.studentId);
                    if (!next[sid])
                        next[sid] = { attendance: {}, homework: {} };

                    if (typeof r.attendance === "boolean")
                        next[sid].attendance[r.dateKey] = r.attendance;
                    if (typeof r.homework === "boolean")
                        next[sid].homework[r.dateKey] = r.homework;
                }

                setRecords(next);
            } catch {
                if (!alive) return;
                setRecords({});
            }
        })();

        return () => {
            alive = false;
        };
    }, [classId, allDateKeys]);

    if (loading) return <div className="fa-muted">Loading...</div>;
    if (!cls)
        return <div className="fa-muted">{error || "Class not found"}</div>;

    const students = Array.isArray(cls.students) ? cls.students : [];

    const renderHeaderCells = (datesArr, as = "th") => {
        const Cell = as;
        const cells = [];

        for (let i = 0; i < maxCols; i++) {
            const d = datesArr[i];
            if (d) {
                cells.push(
                    <Cell key={`d-${i}`} className="fa-th-date">
                        <div className="fa-day">
                            <div className="fa-day-num">
                                {pad2(d.getDate())}
                            </div>
                            <div className="fa-day-name">
                                {DAY_SHORT[d.getDay()]}
                            </div>
                        </div>
                    </Cell>,
                );
                cells.push(
                    <Cell key={`h-${i}`} className="fa-th-hw">
                        HW
                    </Cell>,
                );
            } else {
                cells.push(
                    <Cell key={`d-${i}`} className="fa-th-date fa-th-empty" />,
                );
                cells.push(
                    <Cell key={`h-${i}`} className="fa-th-hw fa-th-empty" />,
                );
            }
        }

        return cells;
    };

    const renderBodyCells = (sid, datesArr) => {
        const cells = [];

        for (let i = 0; i < maxCols; i++) {
            const d = datesArr[i];
            const dk = d ? toISODate(d) : null;

            cells.push(
                <td key={`a-${i}`} className="fa-td-cell fa-center">
                    {dk ? (
                        <input
                            type="checkbox"
                            disabled
                            checked={!!records?.[sid]?.attendance?.[dk]}
                        />
                    ) : (
                        <span className="fa-dash">—</span>
                    )}
                </td>,
            );

            cells.push(
                <td key={`hw-${i}`} className="fa-td-cell fa-center">
                    {dk ? (
                        <input
                            type="checkbox"
                            disabled
                            checked={!!records?.[sid]?.homework?.[dk]}
                        />
                    ) : (
                        <span className="fa-dash">—</span>
                    )}
                </td>,
            );
        }

        return cells;
    };

    return (
        <div className="fa-wrap">
            <div className="fa-top">
                <button
                    className="fa-back"
                    type="button"
                    onClick={() => navigate(-1)}
                >
                    Back
                </button>

                <div className="fa-title" title={cls?.name || "Class"}>
                    Full Attendance —{" "}
                    <span className="fa-title-sub">{cls?.name || "Class"}</span>
                </div>

                <div className="fa-actions">
                    <div className="fa-filter">
                        <label className="fa-label">Month</label>

                        <div className="fa-date-input">
                            <input
                                className="fa-date-text"
                                type="text"
                                inputMode="numeric"
                                placeholder="dd/mm/yyyy"
                                value={displayMonth}
                                onChange={(e) => {
                                    const v = normalizeDMYTyping(
                                        e.target.value,
                                    );
                                    setDisplayMonth(v);

                                    const iso = dmyToISO(v);
                                    if (iso) setMonthISO(iso);
                                }}
                                onBlur={() => {
                                    const iso = dmyToISO(displayMonth);
                                    if (!iso)
                                        setDisplayMonth(isoToDMY(monthISO));
                                }}
                            />

                            <input
                                id="monthPicker"
                                className="fa-real-date"
                                type="date"
                                value={monthISO}
                                onChange={(e) => setMonthISO(e.target.value)}
                                title="Pick any date in the month"
                            />

                            <button
                                type="button"
                                className="fa-date-icon-btn"
                                onClick={() => {
                                    const el =
                                        document.getElementById("monthPicker");
                                    if (!el) return;
                                    if (el.showPicker) el.showPicker();
                                    else el.focus();
                                }}
                                aria-label="Open date picker"
                            >
                                <svg viewBox="0 0 24 24" fill="none">
                                    <path
                                        d="M8 2v3M16 2v3M3.5 9h17M6 6h12a2.5 2.5 0 0 1 2.5 2.5v11A2.5 2.5 0 0 1 18 22H6a2.5 2.5 0 0 1-2.5-2.5v-11A2.5 2.5 0 0 1 6 6Z"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                    />
                                    <path
                                        d="M7.5 12.5h3v3h-3v-3Z"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="fa-note">
                Tip: This view shows only session days in the selected month
                (based on schedule). Read-only.
            </div>

            <div className="fa-cards">
                {students.map((s, idx) => {
                    const sid = normalizeStudentId(s, idx);
                    const name = s.fullName || s.name || "—";
                    const email = s.email || "";

                    return (
                        <div className="fa-card" key={sid}>
                            <div className="fa-card-table-wrap">
                                <table className="fa-card-table">
                                    <thead>
                                        <tr>
                                            <th className="fa-col-no">No</th>
                                            <th className="fa-col-name">
                                                Name
                                            </th>
                                            {renderHeaderCells(datesA, "th")}
                                        </tr>
                                    </thead>

                                    <tbody>
                                        <tr className="fa-row-a">
                                            <td className="fa-col-no">
                                                {idx + 1}
                                            </td>
                                            <td className="fa-col-name">
                                                <div className="fa-name">
                                                    <div className="fa-name-main">
                                                        {name}
                                                    </div>
                                                    {email ? (
                                                        <div className="fa-name-sub">
                                                            {email}
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </td>
                                            {renderBodyCells(sid, datesA)}
                                        </tr>

                                        <tr className="fa-subhead">
                                            <td className="fa-subhead-left" />
                                            <td className="fa-subhead-left" />
                                            {renderHeaderCells(datesB, "td")}
                                        </tr>

                                        <tr className="fa-row-b">
                                            <td className="fa-subhead-left" />
                                            <td className="fa-subhead-left" />
                                            {renderBodyCells(sid, datesB)}
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })}

                {students.length === 0 && (
                    <div className="fa-empty">No students</div>
                )}
            </div>
        </div>
    );
}
