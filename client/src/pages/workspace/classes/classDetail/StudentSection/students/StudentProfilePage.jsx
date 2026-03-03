import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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

        // BE của bạn require classId (required true ở ClassNote)
        if (!klass?._id) {
            alert("Student is not in a class yet. Cannot create note.");
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
            alert(err?.response?.data?.message || "Failed to add note");
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
                    <div className="sp-empty-title">Student not found</div>
                    <button
                        className="sp-btn"
                        onClick={() => navigate(-1)}
                        type="button"
                    >
                        Go back
                    </button>
                </div>
            </div>
        );
    }

    const name = student.fullName || student.name || "Student";
    const createdAt = fmtDateTime(student.createdAt);
    const className = klass?.name || "—";

    return (
        <div className="sp-wrap">
            {/* Header */}
            <div className="sp-header">
                <button
                    className="sp-back"
                    type="button"
                    onClick={() => navigate(-1)}
                >
                    Back
                </button>

                <div className="sp-titleBlock">
                    <h1 className="sp-title">{name}</h1>
                    <div className="sp-subtitle">Student profile & notes</div>
                </div>
            </div>

            <div className="sp-grid">
                {/* Left: profile + take note */}
                <div className="sp-col">
                    <div className="sp-card">
                        <div className="sp-cardTitle">Profile</div>

                        <div className="sp-row">
                            <div className="sp-label">Created</div>
                            <div className="sp-value">{createdAt}</div>
                        </div>

                        <div className="sp-row">
                            <div className="sp-label">Current class</div>
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
                                        title="Open class"
                                    >
                                        View
                                    </button>
                                )}
                            </div>
                        </div>

                        {!klass?._id && (
                            <div className="sp-hint">
                                This student is not assigned to any class yet.
                                Notes require a class.
                            </div>
                        )}
                    </div>

                    <div className="sp-card">
                        <div className="sp-cardTitle">Take note</div>

                        <textarea
                            className="sp-textarea"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Write a short note about this student..."
                            rows={4}
                            onKeyDown={(e) => {
                                // Ctrl/Cmd + Enter to submit
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
                            <div className="sp-tip">
                                Tip: Ctrl/⌘ + Enter to add
                            </div>

                            <button
                                type="button"
                                className={`sp-btnPrimary ${!canAddNote ? "disabled" : ""}`}
                                onClick={createNote}
                                disabled={!canAddNote}
                            >
                                {submitting ? "Adding..." : "Add note"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: notes list */}
                <div className="sp-col">
                    <div className="sp-card">
                        <div className="sp-cardTitle">
                            Notes{" "}
                            <span className="sp-pill">{notes.length}</span>
                        </div>

                        {notes.length === 0 ? (
                            <div className="sp-emptyNotes">
                                <div className="sp-emptyNotes-title">
                                    No notes yet
                                </div>
                                <div className="sp-emptyNotes-sub">
                                    Add the first note to keep track of
                                    progress, behaviour, or reminders.
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
