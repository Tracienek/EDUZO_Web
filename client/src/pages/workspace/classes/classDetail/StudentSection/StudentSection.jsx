// src/pages/workspace/classes/classDetail/StudentSection/StudentSection.jsx
import { Fragment } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentSection.css";

const getStudentId = (s) => String(s?._id || s?.id || "");

export default function StudentsSection({
    students,
    sessionDates,
    dateKeys,
    checkState,
    displayDate,
    startDate,
    isEditingAttendance,
    isSavingAttendance,

    canSendTuition,
    canDeleteStudent,
    sendingTuition,
    heldCount,
    threshold,
    tuitionSent,
    tuitionBtnRef,

    onSendTuitionEmail,
    onChangeDisplayDate,
    onDateBlur,
    onChangeStartDate,
    onOpenDatePicker,

    onEnterEditMode,
    onToggleLocal,
    onMarkAttendancePending,
    onMarkHomeworkPending,
    onMarkTuitionPending,
    onCancelAttendance,
    onSaveAttendance,
    onDeleteStudent,

    fmtDMY,
}) {
    const navigate = useNavigate();

    const canClickSendTuition =
        canSendTuition && !sendingTuition && heldCount >= threshold;

    const colSpan =
        2 + sessionDates.length * 2 + 1 + (canDeleteStudent ? 1 : 0);

    return (
        <div className="cd-section">
            <div className="cd-section-head">
                <h2>Students</h2>

                <div className="cd-controls">
                    {canSendTuition && (
                        <button
                            ref={tuitionBtnRef}
                            type="button"
                            className="cd-btn"
                            onClick={() => {
                                if (!canClickSendTuition) return;
                                onSendTuitionEmail();
                            }}
                            disabled={!canClickSendTuition || !!tuitionSent}
                            title={
                                heldCount < threshold
                                    ? `Need ${
                                          threshold - heldCount
                                      } more session(s) (${heldCount}/${threshold})`
                                    : tuitionSent
                                      ? "Tuition email already sent"
                                      : undefined
                            }
                        >
                            {tuitionSent
                                ? "Tuition email sent"
                                : sendingTuition
                                  ? "Sending..."
                                  : "Send tuition email"}
                        </button>
                    )}

                    <div className="cd-date">
                        <span className="cd-date-label">Date</span>

                        <div className="cd-date-input">
                            <input
                                className="cd-date-text"
                                type="text"
                                inputMode="numeric"
                                placeholder="dd/mm/yyyy"
                                value={displayDate}
                                onChange={onChangeDisplayDate}
                                onBlur={onDateBlur}
                            />

                            <input
                                id="cdDatePicker"
                                className="cd-real-date"
                                type="date"
                                value={startDate}
                                onChange={onChangeStartDate}
                            />

                            <button
                                type="button"
                                className="cd-date-icon-btn"
                                onClick={onOpenDatePicker}
                                aria-label="Open date picker"
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    width="20"
                                    height="20"
                                    aria-hidden="true"
                                >
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

            <div className="cd-table-wrap">
                <table className="cd-table cd-table-att">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Name</th>

                            {sessionDates.map((d, i) => (
                                <Fragment key={`head-${i}`}>
                                    <th>{fmtDMY(d)}</th>
                                    <th>Homework</th>
                                </Fragment>
                            ))}

                            <th>Tuition</th>
                            {canDeleteStudent && <th>Action</th>}
                        </tr>
                    </thead>

                    <tbody>
                        {students.map((s, idx) => {
                            const studentId = getStudentId(s);
                            if (!studentId) return null;

                            return (
                                <tr key={studentId}>
                                    <td data-label="No">{idx + 1}</td>
                                    <td data-label="Name">
                                        <button
                                            type="button"
                                            className="cd-link"
                                            onClick={() =>
                                                navigate(
                                                    `/workspace/students/${studentId}`,
                                                )
                                            }
                                        >
                                            {s.fullName || s.name}
                                        </button>
                                    </td>

                                    {dateKeys.map((dk, i) => {
                                        const dLabel = fmtDMY(sessionDates[i]);

                                        return (
                                            <Fragment
                                                key={`${studentId}-${dk}`}
                                            >
                                                <td
                                                    className="cd-center"
                                                    data-label={`${dLabel} (Attendance)`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        aria-label={`${
                                                            s.fullName || s.name
                                                        } attendance ${dLabel}`}
                                                        checked={
                                                            !!checkState?.[
                                                                studentId
                                                            ]?.attendance?.[dk]
                                                        }
                                                        onChange={(e) => {
                                                            const val =
                                                                e.target
                                                                    .checked;
                                                            onEnterEditMode();
                                                            onToggleLocal(
                                                                studentId,
                                                                "attendance",
                                                                dk,
                                                                val,
                                                            );
                                                            onMarkAttendancePending(
                                                                studentId,
                                                                dk,
                                                                val,
                                                            );
                                                        }}
                                                    />
                                                </td>

                                                <td
                                                    className="cd-center"
                                                    data-label={`${dLabel} (Homework)`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        aria-label={`${
                                                            s.fullName || s.name
                                                        } homework ${dLabel}`}
                                                        checked={
                                                            !!checkState?.[
                                                                studentId
                                                            ]?.homework?.[dk]
                                                        }
                                                        onChange={(e) => {
                                                            const val =
                                                                e.target
                                                                    .checked;
                                                            onEnterEditMode();
                                                            onToggleLocal(
                                                                studentId,
                                                                "homework",
                                                                dk,
                                                                val,
                                                            );
                                                            onMarkHomeworkPending(
                                                                studentId,
                                                                dk,
                                                                val,
                                                            );
                                                        }}
                                                    />
                                                </td>
                                            </Fragment>
                                        );
                                    })}

                                    <td
                                        className="cd-center"
                                        data-label="Tuition"
                                    >
                                        <input
                                            type="checkbox"
                                            aria-label={`${
                                                s.fullName || s.name
                                            } tuition paid`}
                                            checked={
                                                !!checkState?.[studentId]
                                                    ?.tuition
                                            }
                                            onChange={(e) => {
                                                const val = e.target.checked;
                                                onEnterEditMode();
                                                onToggleLocal(
                                                    studentId,
                                                    "tuition",
                                                    null,
                                                    val,
                                                );
                                                onMarkTuitionPending(
                                                    studentId,
                                                    val,
                                                );
                                            }}
                                        />
                                    </td>

                                    {canDeleteStudent && (
                                        <td
                                            className="cd-center"
                                            data-label="Action"
                                        >
                                            <button
                                                type="button"
                                                className="cd-btn-danger"
                                                onClick={() =>
                                                    onDeleteStudent?.(s)
                                                }
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}

                        {students.length === 0 && (
                            <tr>
                                <td colSpan={colSpan} className="cd-empty">
                                    No students
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isEditingAttendance && (
                <div className="cd-actions">
                    <button
                        className="cd-btn-cancel"
                        onClick={onCancelAttendance}
                        type="button"
                    >
                        Cancel
                    </button>

                    <button
                        className="cd-btn-save"
                        onClick={onSaveAttendance}
                        type="button"
                        disabled={isSavingAttendance}
                    >
                        {isSavingAttendance ? "Saving..." : "Save"}
                    </button>
                </div>
            )}
        </div>
    );
}
