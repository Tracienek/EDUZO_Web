import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiUtils } from "../../../../../../utils/newRequest";
import "./StudentProfilePage.css";

const fmtDateTime = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleString();
};

export default function StudentProfilePage() {
    const { studentId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState(null);
    const [klass, setKlass] = useState(null);
    const [notes, setNotes] = useState([]);
    const [content, setContent] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const canAddNote = useMemo(() => {
        return !!content.trim() && !!klass?._id && !submitting;
    }, [content, klass?._id, submitting]);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [pRes, nRes] = await Promise.all([
                apiUtils.get(`/students/${studentId}/profile`),
                apiUtils.get(`/students/${studentId}/notes`),
            ]);

            setStudent(pRes?.data?.metadata?.student || null);
            setKlass(pRes?.data?.metadata?.class || null);
            setNotes(nRes?.data?.metadata?.notes || []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!studentId) return;
        loadAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [studentId]);

    const createNote = async () => {
        const text = content.trim();
        if (!text) return;

        if (!klass?._id) {
            alert(t("studentProfile.notInClassCannotNote"));
            return;
        }

        try {
            setSubmitting(true);
            await apiUtils.post(`/students/${studentId}/notes`, {
                content: text,
                classId: klass._id,
            });

            setContent("");
            await loadAll();
        } catch (err) {
            alert(
                err?.response?.data?.message ||
                    t("studentProfile.failedToAddNote"),
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="sp-wrap">
                <div className="sp-skeleton">
                    <div className="sp-skel-line w40" />
                    <div className="sp-skel-line w60" />
                    <div className="sp-skel-card" />
                    <div className="sp-skel-card" />
                </div>
            </div>
        );
    }

    if (!student) {
        return (
            <div className="sp-wrap">
                <div className="sp-empty">
                    <div className="sp-empty-title">
                        {t("studentProfile.notFound")}
                    </div>
                    <button
                        className="sp-btn"
                        onClick={() => navigate(-1)}
                        type="button"
                    >
                        {t("studentProfile.goBack")}
                    </button>
                </div>
            </div>
        );
    }

    const name =
        student.fullName || student.name || t("studentProfile.defaultName");
    const createdAt = fmtDateTime(student.createdAt);
    const className = klass?.name || t("studentProfile.emptyValue");

    return (
        <div className="sp-wrap">
            <div className="sp-header">
                <button
                    className="sp-back"
                    type="button"
                    onClick={() => navigate(-1)}
                >
                    {t("studentProfile.back")}
                </button>

                <div className="sp-titleBlock">
                    <h1 className="sp-title">{name}</h1>
                </div>
            </div>

            <div className="sp-grid">
                <div className="sp-col">
                    <div className="sp-card">
                        <div className="sp-cardTitle">
                            {t("studentProfile.profile")}
                        </div>

                        <div className="sp-row">
                            <div className="sp-label">
                                {t("studentProfile.created")}
                            </div>
                            <div className="sp-value">{createdAt}</div>
                        </div>

                        <div className="sp-row">
                            <div className="sp-label">
                                {t("studentProfile.currentClass")}
                            </div>
                            <div className="sp-value">
                                {className}
                                {klass?._id && (
                                    <button
                                        className="sp-linkBtn"
                                        type="button"
                                        onClick={() =>
                                            navigate(
                                                `/workspace/classes/${klass._id}`,
                                            )
                                        }
                                        title={t("studentProfile.openClass")}
                                    >
                                        {t("studentProfile.view")}
                                    </button>
                                )}
                            </div>
                        </div>

                        {!klass?._id && (
                            <div className="sp-hint">
                                {t("studentProfile.noClassHint")}
                            </div>
                        )}
                    </div>

                    <div className="sp-card">
                        <div className="sp-cardTitle">
                            {t("studentProfile.takeNote")}
                        </div>

                        <textarea
                            className="sp-textarea"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder={t("studentProfile.notePlaceholder")}
                            rows={4}
                            onKeyDown={(e) => {
                                if (
                                    (e.ctrlKey || e.metaKey) &&
                                    e.key === "Enter"
                                ) {
                                    e.preventDefault();
                                    if (canAddNote) createNote();
                                }
                            }}
                        />

                        <div className="sp-actions">
                            <button
                                type="button"
                                className={`sp-btnPrimary ${!canAddNote ? "disabled" : ""}`}
                                onClick={createNote}
                                disabled={!canAddNote}
                            >
                                {submitting
                                    ? t("studentProfile.adding")
                                    : t("studentProfile.addNote")}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="sp-col">
                    <div className="sp-card">
                        <div className="sp-cardTitle">
                            {t("studentProfile.notes")}{" "}
                            <span className="sp-pill">{notes.length}</span>
                        </div>

                        {notes.length === 0 ? (
                            <div className="sp-emptyNotes">
                                <div className="sp-emptyNotes-title">
                                    {t("studentProfile.noNotes")}
                                </div>
                                <div className="sp-emptyNotes-sub">
                                    {t("studentProfile.noNotesDesc")}
                                </div>
                            </div>
                        ) : (
                            <div className="sp-notesList">
                                {notes.map((n) => (
                                    <div className="sp-note" key={n._id}>
                                        <div className="sp-noteMeta">
                                            <span className="sp-noteTime">
                                                {fmtDateTime(n.createdAt)}
                                            </span>
                                        </div>
                                        <div className="sp-noteContent">
                                            {n.content}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
