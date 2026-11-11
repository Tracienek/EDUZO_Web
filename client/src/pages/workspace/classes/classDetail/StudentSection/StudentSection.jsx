// src/pages/workspace/classes/classDetail/StudentSection/StudentSection.jsx
import { Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
    const { t } = useTranslation();

    const canClickSendTuition =
        canSendTuition && !sendingTuition && heldCount >= threshold;

    const colSpan =
        2 + sessionDates.length * 2 + 1 + (canDeleteStudent ? 1 : 0);

    return (
        <div className="cd-section">
            <div className="cd-section-head">
                <h2>{t("studentSection.title")}</h2>

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
                                    ? t("studentSection.needMoreSessions", {
                                          count: threshold - heldCount,
                                          held: heldCount,
                                          threshold,
                                      })
                                    : tuitionSent
                                      ? t("studentSection.tuitionAlreadySent")
                                      : undefined
                            }
                        >
                            {tuitionSent
                                ? t("studentSection.tuitionSent")
                                : sendingTuition
                                  ? t("studentSection.sending")
                                  : t("studentSection.sendTuition")}
                        </button>
                    )}

                    <div className="cd-date">
                        <span className="cd-date-label">
                            {t("studentSection.date")}
                        </span>

                        <div className="cd-date-input">
                            <input
                                className="cd-date-text"
                                type="text"
                                inputMode="numeric"
                                placeholder={t(
                                    "studentSection.datePlaceholder",
                                )}
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
                                aria-label={t("studentSection.openDatePicker")}
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
                            <th>{t("studentSection.no")}</th>
                            <th>{t("studentSection.name")}</th>

                            {sessionDates.map((d, i) => (
                                <Fragment key={`head-${i}`}>
                                    <th>{fmtDMY(d)}</th>
                                    <th>{t("studentSection.homework")}</th>
                                </Fragment>
                            ))}

                            <th>{t("studentSection.tuition")}</th>
                            {canDeleteStudent && (
                                <th>{t("studentSection.action")}</th>
                            )}
                        </tr>
                    </thead>

                    <tbody>
                        {students.map((s, idx) => {
                            const studentId = getStudentId(s);
                            if (!studentId) return null;

                            const studentName = s.fullName || s.name;

                            return (
                                <tr key={studentId}>
                                    <td data-label={t("studentSection.no")}>
                                        {idx + 1}
                                    </td>
                                    <td data-label={t("studentSection.name")}>
                                        <button
                                            type="button"
                                            className="cd-link"
                                            onClick={() =>
                                                navigate(
                                                    `/workspace/students/${studentId}`,
                                                )
                                            }
                                        >
                                            {studentName}
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
                                                    data-label={t(
                                                        "studentSection.attendanceDataLabel",
                                                        {
                                                            date: dLabel,
                                                        },
                                                    )}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        aria-label={t(
                                                            "studentSection.attendanceAria",
                                                            {
                                                                name: studentName,
                                                                date: dLabel,
                                                            },
                                                        )}
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
                                                    data-label={t(
                                                        "studentSection.homeworkDataLabel",
                                                        {
                                                            date: dLabel,
                                                        },
                                                    )}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        aria-label={t(
                                                            "studentSection.homeworkAria",
                                                            {
                                                                name: studentName,
                                                                date: dLabel,
                                                            },
                                                        )}
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
                                        data-label={t("studentSection.tuition")}
                                    >
                                        <input
                                            type="checkbox"
                                            aria-label={t(
                                                "studentSection.tuitionAria",
                                                {
                                                    name: studentName,
                                                },
                                            )}
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
                                            data-label={t(
                                                "studentSection.action",
                                            )}
                                        >
                                            <button
                                                type="button"
                                                className="cd-btn-danger"
                                                onClick={() =>
                                                    onDeleteStudent?.(s)
                                                }
                                            >
                                                {t("studentSection.delete")}
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}

                        {students.length === 0 && (
                            <tr>
                                <td colSpan={colSpan} className="cd-empty">
                                    {t("studentSection.noStudents")}
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
                        {t("studentSection.cancel")}
                    </button>

                    <button
                        className="cd-btn-save"
                        onClick={onSaveAttendance}
                        type="button"
                        disabled={isSavingAttendance}
                    >
                        {isSavingAttendance
                            ? t("studentSection.saving")
                            : t("studentSection.save")}
                    </button>
                </div>
            )}
        </div>
    );
}
