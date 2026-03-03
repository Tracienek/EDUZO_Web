// components/workspace/WorkspaceTopBar.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./WorkspaceTopBar.css";
import { useAuth } from "../../context/auth/AuthContext";
import { apiUtils } from "../../utils/newRequest";
import CreateClass from "../../pages/workspace/classes/createModal/CreateClass";

/* ===== helpers ===== */
const getServerOrigin = () => {
    const isProd = import.meta.env.VITE_ENV === "production";
    return isProd
        ? import.meta.env.VITE_SERVER_ORIGIN
        : import.meta.env.VITE_SERVER_LOCAL_ORIGIN;
};

const resolveAvatar = (url) => {
    if (!url) return "";
    const s = String(url);
    if (/^https?:\/\//i.test(s)) return s;
    if (s.startsWith("/uploads/")) return `${getServerOrigin()}${s}`;
    return s;
};

export default function WorkspaceTopBar() {
    const { userInfo, logout } = useAuth();
    const role = userInfo?.role;
    // const isCenter = userInfo?.role === "center";

    const [openCreate, setOpenCreate] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();

    const isStaffsPage = location.pathname.startsWith("/workspace/staffs");
    const canCreateStaff = role === "center";

    const showCreateBtn = useMemo(() => {
        if (isStaffsPage) return canCreateStaff;
        return false;
    }, [isStaffsPage, canCreateStaff]);

    const createBtnLabel = useMemo(() => {
        if (isStaffsPage) return "Create Staff";
        return "Create";
    }, [isStaffsPage]);

    /* ============ GLOBAL SEARCH ============ */
    const [q, setQ] = useState("");
    const [openSearch, setOpenSearch] = useState(false);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState({ students: [], classes: [] });
    const lastReq = useRef(0);
    const searchWrapRef = useRef(null);

    useEffect(() => {
        const keyword = q.trim();
        if (!keyword) {
            setOpenSearch(false);
            setResults({ students: [], classes: [] });
            setLoading(false);
            return;
        }

        setOpenSearch(true);
        setLoading(true);
        const reqId = ++lastReq.current;

        const t = setTimeout(async () => {
            try {
                const res = await apiUtils.get(
                    `/search?q=${encodeURIComponent(keyword)}`,
                );
                const data = res?.data?.metadata || res?.data || {};

                if (reqId === lastReq.current) {
                    setResults({
                        students: Array.isArray(data.students)
                            ? data.students
                            : [],
                        classes: Array.isArray(data.classes)
                            ? data.classes
                            : [],
                    });
                }
            } catch {
                if (reqId === lastReq.current)
                    setResults({ students: [], classes: [] });
            } finally {
                if (reqId === lastReq.current) setLoading(false);
            }
        }, 280);

        return () => clearTimeout(t);
    }, [q]);

    // close search on outside click
    useEffect(() => {
        const close = (e) => {
            if (!searchWrapRef.current) return;
            if (!searchWrapRef.current.contains(e.target)) setOpenSearch(false);
        };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, []);

    useEffect(() => {
        setOpenSearch(false);
        setUserOpen(false);
    }, [location.pathname]);

    const openStudent = (s) => {
        setQ("");
        setOpenSearch(false);

        const classId = s?.classId;
        if (!classId) return;

        if (s?.folderId) {
            navigate(`/workspace/classes/folder/${s.folderId}/${classId}`);
            return;
        }
        navigate(`/workspace/classes/${classId}`);
    };

    const openClass = (c) => {
        setQ("");
        setOpenSearch(false);
        if (c?.folderId) {
            navigate(`/workspace/classes/folder/${c.folderId}/${c._id}`);
            return;
        }
        navigate(`/workspace/classes/${c._id}`);
    };

    const hasAny =
        (results.students?.length || 0) > 0 ||
        (results.classes?.length || 0) > 0;

    /* ============ USER DROPDOWN ============ */
    const [userOpen, setUserOpen] = useState(false);
    const userRef = useRef(null);

    useEffect(() => {
        const close = (e) => {
            if (!userRef.current) return;
            if (!userRef.current.contains(e.target)) setUserOpen(false);
        };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, []);

    /* ============ AVATAR ============ */
    const FALLBACK_AVATAR = "https://via.placeholder.com/40";
    const [avatarSrc, setAvatarSrc] = useState(FALLBACK_AVATAR);

    useEffect(() => {
        const resolved = resolveAvatar(userInfo?.avatar);
        setAvatarSrc(resolved || FALLBACK_AVATAR);
    }, [userInfo?.avatar]);

    return (
        <header className="workspace-topbar">
            {/* LEFT: SEARCH */}
            <div
                className="workspace-topbar-search-wrapper"
                ref={searchWrapRef}
            >
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onFocus={() => q.trim() && setOpenSearch(true)}
                    placeholder="Search students or classes..."
                    className="workspace-topbar-search-input"
                />

                {openSearch && (
                    <div className="workspace-search-dropdown">
                        {loading && (
                            <div className="workspace-search-row workspace-search-muted">
                                Searching...
                            </div>
                        )}

                        {!loading && !hasAny && (
                            <div className="workspace-search-row workspace-search-muted">
                                No results
                            </div>
                        )}

                        {!loading && results.students?.length > 0 && (
                            <div className="workspace-search-group">
                                <div className="workspace-search-title">
                                    Students
                                </div>

                                {results.students.slice(0, 8).map((s) => (
                                    <button
                                        key={s._id}
                                        type="button"
                                        className="workspace-search-item"
                                        onClick={() => openStudent(s)}
                                    >
                                        <div className="workspace-search-item-main">
                                            <div className="workspace-search-item-name">
                                                {s.fullName}
                                            </div>
                                            <div className="workspace-search-item-sub">
                                                {s.className
                                                    ? `Class: ${s.className}`
                                                    : "Class: —"}
                                            </div>
                                        </div>

                                        <div className="workspace-search-item-hint">
                                            Open
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {!loading && results.classes?.length > 0 && (
                            <div className="workspace-search-group">
                                <div className="workspace-search-title">
                                    Classes
                                </div>

                                {results.classes.slice(0, 8).map((c) => (
                                    <button
                                        key={c._id}
                                        type="button"
                                        className="workspace-search-item"
                                        onClick={() => openClass(c)}
                                    >
                                        <div className="workspace-search-item-main">
                                            <div className="workspace-search-item-name">
                                                {c.name ||
                                                    c.className ||
                                                    "Unnamed class"}
                                            </div>
                                            <div className="workspace-search-item-sub">
                                                {c.folderName
                                                    ? `Folder: ${c.folderName}`
                                                    : "Folder: —"}
                                            </div>
                                        </div>

                                        <div className="workspace-search-item-hint">
                                            Open
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* MIDDLE: + Classes */}
            <div className="workspace-topbar-mid">
                <button
                    className="workspace-topbar-primary"
                    type="button"
                    onClick={() => setOpenCreate(true)}
                >
                    + Classes
                </button>

                <CreateClass
                    open={openCreate}
                    onClose={() => setOpenCreate(false)}
                    onCreated={(newClass) => {
                        if (!newClass?._id) return;
                        navigate(`/workspace/classes/${newClass._id}`);
                    }}
                />
            </div>

            {/* RIGHT: USER */}
            <div className="workspace-topbar-actions">
                {showCreateBtn && (
                    <button className="workspace-topbar-btn" type="button">
                        {createBtnLabel}
                    </button>
                )}

                <div className="workspace-user" ref={userRef}>
                    <button
                        type="button"
                        className="workspace-user-trigger"
                        onClick={() => setUserOpen((v) => !v)}
                        aria-expanded={userOpen}
                    >
                        <img
                            className="workspace-user-avatar"
                            src={avatarSrc}
                            onError={() => setAvatarSrc(FALLBACK_AVATAR)}
                            alt={userInfo?.fullName || "User"}
                        />

                        <span className="workspace-user-name">
                            {userInfo?.fullName || "User"}
                        </span>

                        <svg
                            className={`workspace-user-caret ${
                                userOpen ? "open" : ""
                            }`}
                            xmlns="http://www.w3.org/2000/svg"
                            height="18"
                            viewBox="0 -960 960 960"
                            width="18"
                            fill="currentColor"
                            aria-hidden="true"
                        >
                            <path d="M480-360 280-560h400L480-360Z" />
                        </svg>
                    </button>

                    {userOpen && (
                        <div className="workspace-user-menu">
                            <div className="workspace-user-header">
                                <div className="workspace-user-header-name">
                                    {userInfo?.fullName || "User"}
                                </div>
                                <div className="workspace-user-header-email">
                                    {userInfo?.email || ""}
                                </div>
                            </div>

                            <div className="workspace-user-divider" />

                            <Link
                                to="/workspace/profile"
                                className="workspace-user-item"
                                onClick={() => setUserOpen(false)}
                            >
                                Account
                            </Link>

                            <button
                                className="workspace-user-item danger"
                                type="button"
                                onClick={logout}
                            >
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
