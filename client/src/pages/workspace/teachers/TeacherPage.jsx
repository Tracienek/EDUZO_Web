// TeacherPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import teacherImg from "../../../assets/images/teacher.svg";
import { apiUtils } from "../../../utils/newRequest";
import "./TeacherPage.css";
import CreateTeacherModal from "./createModal/CreateTeacherModal";
import { useAuth } from "../../../context/auth/AuthContext";

/** -------- helpers -------- */
const unwrap = (res) => {
    const root = res?.data ?? res;
    return root?.metadata ?? root?.data ?? root;
};

const getTeacherId = (t) =>
    t?._id ||
    t?.id ||
    t?.teacherId ||
    t?.userId ||
    t?.teacher?._id ||
    t?.teacher?.id ||
    t?.accountId ||
    null;

/** -------- card -------- */
function TeacherCard({ t, onClick, onDelete }) {
    const navigate = useNavigate();
    const id = getTeacherId(t);

    const go = () => {
        onClick?.(t);
        if (!id) {
            console.warn(
                "Missing teacher id for navigation. Teacher object:",
                t,
            );
            return;
        }
        navigate(`/workspace/teachers/${id}`);
    };

    return (
        <div
            className="teacher-card"
            role="button"
            tabIndex={0}
            onClick={go}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    go();
                }
            }}
            aria-label={`Open ${t?.fullName || t?.name || "teacher"}`}
        >
            <button
                className="teacher-card-delete"
                type="button"
                title="Delete teacher"
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(t);
                }}
                onKeyDown={(e) => {
                    e.stopPropagation();
                }}
            >
                ✕
            </button>

            <div className="teacher-avatar" aria-hidden="true">
                <img
                    className="teacher-img"
                    src={teacherImg}
                    alt=""
                    draggable={false}
                />
            </div>

            <div className="teacher-name">{t?.fullName || t?.name || "—"}</div>
        </div>
    );
}

/** -------- page -------- */
export default function TeacherPage({ onOpenTeacher }) {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState("");
    const [openCreate, setOpenCreate] = useState(false);

    const { userInfo } = useAuth();

    const pageTitle =
        userInfo?.role === "center"
            ? `${userInfo?.fullName || "Center"}’s Teachers`
            : "My Teachers";

    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                setLoading(true);
                setPageError("");

                const res = await apiUtils.get("/center/teachers");
                const data = unwrap(res);
                const list = data?.teachers ?? data ?? [];

                if (!mounted) return;
                setTeachers(Array.isArray(list) ? list : []);
            } catch (err) {
                if (!mounted) return;
                setPageError(
                    err?.response?.data?.message ||
                        err?.message ||
                        "Failed to load teachers",
                );
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, []);

    const onCreated = (teacher) => {
        if (!teacher) return;

        const newId = getTeacherId(teacher);
        setTeachers((prev) => {
            if (!newId) return [teacher, ...prev];
            const filtered = prev.filter((t) => getTeacherId(t) !== newId);
            return [teacher, ...filtered];
        });
    };

    const handleDeleteTeacher = async (teacher) => {
        const id = getTeacherId(teacher);
        const name = teacher?.fullName || teacher?.name || "Unnamed";

        if (!id) {
            alert("Missing teacher id");
            return;
        }

        const ok = window.confirm(
            `Delete teacher "${name}"?\nThis action cannot be undone.`,
        );
        if (!ok) return;

        try {
            await apiUtils.delete(`/center/teachers/${id}`);

            setTeachers((prev) => prev.filter((x) => getTeacherId(x) !== id));
        } catch (err) {
            alert(err?.response?.data?.message || "Failed to delete teacher");
        }
    };

    const content = useMemo(() => {
        if (loading) return <p className="tp-muted">Loading...</p>;
        if (pageError) return <p className="tp-error">{pageError}</p>;
        if (!teachers.length)
            return (
                <p className="tp-muted">
                    No teachers yet. Click “＋ Teachers”.
                </p>
            );
        return null;
    }, [loading, pageError, teachers.length]);

    return (
        <section className="teachers-panel">
            <div className="teachers-header">
                <h2 title={pageTitle}>{pageTitle}</h2>

                <button
                    type="button"
                    className="teachers-add"
                    onClick={() => setOpenCreate(true)}
                >
                    <span className="plus" aria-hidden="true">
                        ＋
                    </span>
                    Teachers
                </button>
            </div>

            {content}

            <div className="teachers-grid">
                {teachers.map((t, i) => {
                    const id = getTeacherId(t);
                    return (
                        <TeacherCard
                            key={
                                id ||
                                `${t?.email || t?.fullName || "teacher"}-${i}`
                            }
                            t={t}
                            onClick={(teacher) => onOpenTeacher?.(teacher)}
                            onDelete={handleDeleteTeacher}
                        />
                    );
                })}
            </div>

            <CreateTeacherModal
                open={openCreate}
                onClose={() => setOpenCreate(false)}
                onCreated={onCreated}
            />
        </section>
    );
}
