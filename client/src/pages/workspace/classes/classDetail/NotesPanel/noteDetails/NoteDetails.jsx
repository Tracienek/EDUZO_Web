// src/pages/workspace/classes/classDetail/NotesPanel/noteDetails/NoteDetails.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiUtils } from "../../../../../../utils/newRequest";
import "./NoteDetails.css";

const pad2 = (n) => String(n).padStart(2, "0");

const formatDDMMYYYY_HHMM = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";

    const dd = pad2(d.getDate());
    const mm = pad2(d.getMonth() + 1);
    const yyyy = d.getFullYear();
    const hh = pad2(d.getHours());
    const mi = pad2(d.getMinutes());

    return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
};

export default function NoteDetails() {
    const navigate = useNavigate();
    const { classId } = useParams();

    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState("");
    const [notes, setNotes] = useState([]);

    const countText = useMemo(() => {
        if (loading) return "Loading...";
        return `${notes.length} notes`;
    }, [loading, notes.length]);

    const fetchNotes = async () => {
        if (!classId) return;

        try {
            setLoading(true);
            setPageError("");

            const res = await apiUtils.get(`/classes/${classId}/notes`);
            const list =
                res?.data?.metadata?.notes ||
                res?.data?.notes ||
                res?.data?.metadata ||
                [];

            setNotes(Array.isArray(list) ? list : []);
        } catch (err) {
            setNotes([]);
            setPageError(
                err?.response?.data?.message ||
                    err?.message ||
                    "Failed to load notes",
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [classId]);

    return (
        <div className="nd-wrap">
            <div className="nd-topbar">
                <button
                    className="nd-back"
                    type="button"
                    onClick={() => navigate(-1)}
                >
                    Back
                </button>

                <div className="nd-title" title="Notes">
                    Notes
                </div>

                <div className="nd-actions">
                    <span className="nd-chip">{countText}</span>

                    <button
                        type="button"
                        className="nd-btn"
                        onClick={fetchNotes}
                        disabled={loading}
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {loading && <div className="nd-muted">Loading...</div>}

            {!loading && pageError && (
                <div className="nd-error">{pageError}</div>
            )}

            {!loading && !pageError && notes.length === 0 && (
                <div className="nd-empty">No notes yet</div>
            )}

            {!loading && !pageError && notes.length > 0 && (
                <div className="nd-list">
                    {notes.map((n) => (
                        <div className="nd-item" key={n._id}>
                            <div className="nd-meta">
                                <span className="nd-time">
                                    {formatDDMMYYYY_HHMM(n?.createdAt)}
                                </span>

                                {/* Optional badges (if your note has roles) */}
                                {(n?.fromRole || n?.toRole) && (
                                    <span className="nd-badge">
                                        {n?.fromRole
                                            ? `From: ${n.fromRole}`
                                            : ""}
                                        {n?.fromRole && n?.toRole ? " • " : ""}
                                        {n?.toRole ? `To: ${n.toRole}` : ""}
                                    </span>
                                )}
                            </div>

                            <div className="nd-msg">{n?.content || ""}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
