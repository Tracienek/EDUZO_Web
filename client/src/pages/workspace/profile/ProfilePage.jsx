// src/pages/workspace/profile/ProfilePage.jsx
import { useEffect, useMemo, useState } from "react";
import "./ProfilePage.css";
import { apiUtils } from "../../../utils/newRequest";
import { useAuth } from "../../../context/auth/AuthContext";
import "@fortawesome/fontawesome-free/css/all.min.css";
import teacherFallback from "../../../assets/images/teacher.svg";

const isoToDMY = (value) => {
    if (!value) return "";
    const s = String(value).trim();

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;

    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
        const [, yyyy, mm, dd] = m;
        return `${dd}/${mm}/${yyyy}`;
    }

    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return "";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
};

const dmyToISO = (value) => {
    if (!value) return "";
    const s = String(value).trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

    const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return "";
    const [, dd, mm, yyyy] = m;
    return `${yyyy}-${mm}-${dd}`;
};

export default function ProfilePage() {
    const { userInfo, loadUserMe } = useAuth();

    const role = useMemo(
        () => String(userInfo?.role || "").toLowerCase(),
        [userInfo?.role],
    );
    const isCenter = role === "center";

    const FALLBACK_AVATAR = teacherFallback;

    const SERVER_ORIGIN = useMemo(() => {
        const isProd = import.meta.env.VITE_ENV === "production";
        return isProd
            ? import.meta.env.VITE_SERVER_ORIGIN
            : import.meta.env.VITE_SERVER_LOCAL_ORIGIN;
    }, []);

    const resolveAvatar = (url) => {
        if (!url) return "";
        const s = String(url);
        if (/^https?:\/\//i.test(s)) return s;
        if (s.startsWith("/uploads/")) return `${SERVER_ORIGIN}${s}`;
        return s;
    };

    const [avatarBust, setAvatarBust] = useState(0);

    const [profileOriginal, setProfileOriginal] = useState({
        fullName: "",
        email: "",
        gender: "",
        languageOrSpeciality: "",
        avatar: "",
        dob: "",
    });

    const [profileDraft, setProfileDraft] = useState({
        fullName: "",
        email: "",
        gender: "",
        languageOrSpeciality: "",
        avatar: "",
        dob: "",
    });

    const [pwDraft, setPwDraft] = useState({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
    });

    const [pwVisible, setPwVisible] = useState({
        current: false,
        new: false,
        confirm: false,
    });

    const [pwErrors, setPwErrors] = useState({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
    });

    const [pwSuccess, setPwSuccess] = useState("");

    const resetPwVisible = () =>
        setPwVisible({ current: false, new: false, confirm: false });

    const resetPwErrors = () =>
        setPwErrors({
            currentPassword: "",
            newPassword: "",
            confirmNewPassword: "",
        });

    const [editingProfile, setEditingProfile] = useState(false);
    const [editingPw, setEditingPw] = useState(false);

    const [savingProfile, setSavingProfile] = useState(false);
    const [savingAvatar, setSavingAvatar] = useState(false);
    const [savingPw, setSavingPw] = useState(false);

    const [msg, setMsg] = useState({ type: "", text: "" });
    const toast = (type, text) => setMsg({ type, text });

    useEffect(() => {
        if (!userInfo) return;

        const p = {
            fullName: userInfo.fullName || "",
            email: userInfo.email || "",
            gender: userInfo.gender || "",
            languageOrSpeciality: userInfo.languageOrSpeciality || "",
            avatar: userInfo.avatar || "",
            dob: isoToDMY(userInfo.dob || ""),
        };

        setProfileOriginal(p);
        setProfileDraft((prev) => (editingProfile ? prev : p));
    }, [userInfo, editingProfile]);

    const isPwFilled =
        !!pwDraft.currentPassword &&
        !!pwDraft.newPassword &&
        !!pwDraft.confirmNewPassword;

    const isPwMinLength = pwDraft.newPassword.length >= 8;

    const isPwMismatch =
        !!pwDraft.confirmNewPassword &&
        pwDraft.newPassword !== pwDraft.confirmNewPassword;

    const canSavePw = editingPw && isPwFilled && !savingPw;

    const onSaveProfile = async () => {
        setMsg({ type: "", text: "" });

        if (!profileDraft.fullName.trim()) {
            return toast("error", "Name is required");
        }

        const dobISO = dmyToISO(profileDraft.dob);

        try {
            setSavingProfile(true);

            await apiUtils.patch("/user/me", {
                fullName: profileDraft.fullName.trim(),
                gender: profileDraft.gender || "",
                languageOrSpeciality: (
                    profileDraft.languageOrSpeciality || ""
                ).trim(),
                dob: dobISO || null,
            });

            await loadUserMe();
            toast("success", "Profile updated successfully");
            setEditingProfile(false);
        } catch (e) {
            const status = e?.response?.status;
            const serverMsg = e?.response?.data?.message;

            if (status === 401) {
                toast("error", "Unauthorized. Please sign in again.");
            } else {
                toast("error", serverMsg || "Update profile failed");
            }
        } finally {
            setSavingProfile(false);
        }
    };

    const onCancelProfile = () => {
        setMsg({ type: "", text: "" });
        setProfileDraft(profileOriginal);
        setEditingProfile(false);
    };

    const onPickAvatar = async (file) => {
        if (!file) return;
        setMsg({ type: "", text: "" });

        const maxMB = 3;
        if (file.size > maxMB * 1024 * 1024) {
            return toast("error", `Avatar must be <= ${maxMB}MB`);
        }

        const okTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!okTypes.includes(file.type)) {
            return toast("error", "Only JPG/PNG/WEBP are allowed");
        }

        try {
            setSavingAvatar(true);

            const fd = new FormData();
            fd.append("avatar", file);

            const res = await apiUtils.patch("/user/me/avatar", fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            const updated = res?.data?.metadata?.user;
            if (updated?.avatar) {
                setProfileDraft((p) => ({ ...p, avatar: updated.avatar }));
                setProfileOriginal((p) => ({ ...p, avatar: updated.avatar }));
                setAvatarBust(Date.now());
            }

            await loadUserMe();
            toast("success", "Avatar updated");
        } catch (e) {
            const status = e?.response?.status;
            const serverMsg = e?.response?.data?.message;

            if (status === 404) {
                toast(
                    "error",
                    "Avatar endpoint not found (PATCH /user/me/avatar). Add it on backend or change FE endpoint.",
                );
            } else if (status === 401) {
                toast("error", "Unauthorized. Please sign in again.");
            } else {
                toast("error", serverMsg || "Update avatar failed");
            }
        } finally {
            setSavingAvatar(false);
        }
    };

    const onSavePassword = async () => {
        setPwSuccess("");
        resetPwErrors();

        let hasError = false;
        const nextErrors = {
            currentPassword: "",
            newPassword: "",
            confirmNewPassword: "",
        };

        if (!pwDraft.currentPassword) {
            nextErrors.currentPassword = "Please enter current password";
            hasError = true;
        }

        if (!pwDraft.newPassword) {
            nextErrors.newPassword = "Please enter new password";
            hasError = true;
        } else if (pwDraft.newPassword.length < 8) {
            nextErrors.newPassword =
                "Password should be at least 8 characters.";
            hasError = true;
        }

        if (!pwDraft.confirmNewPassword) {
            nextErrors.confirmNewPassword = "Please confirm new password";
            hasError = true;
        } else if (pwDraft.newPassword !== pwDraft.confirmNewPassword) {
            nextErrors.confirmNewPassword = "Confirm password does not match";
            hasError = true;
        }

        if (hasError) {
            setPwErrors(nextErrors);
            return;
        }

        try {
            setSavingPw(true);

            await apiUtils.post("/auth/change-password", {
                currentPassword: pwDraft.currentPassword,
                newPassword: pwDraft.newPassword,
            });

            setPwDraft({
                currentPassword: "",
                newPassword: "",
                confirmNewPassword: "",
            });
            resetPwErrors();
            setPwSuccess("Password changed successfully");

            await loadUserMe();
            setEditingPw(false);
            resetPwVisible();
        } catch (e) {
            const status = e?.response?.status;
            const serverMsg = e?.response?.data?.message;
            const normalizedMsg = String(serverMsg || "").toLowerCase();

            if (status === 401) {
                setPwErrors((prev) => ({
                    ...prev,
                    currentPassword: "Unauthorized. Please sign in again.",
                }));
            } else if (
                normalizedMsg.includes("current password") &&
                (normalizedMsg.includes("incorrect") ||
                    normalizedMsg.includes("invalid") ||
                    normalizedMsg.includes("wrong"))
            ) {
                setPwErrors((prev) => ({
                    ...prev,
                    currentPassword: "Current password is incorrect",
                }));
            } else {
                setPwErrors((prev) => ({
                    ...prev,
                    confirmNewPassword: serverMsg || "Change password failed",
                }));
            }
        } finally {
            setSavingPw(false);
        }
    };

    const onCancelPw = () => {
        setPwDraft({
            currentPassword: "",
            newPassword: "",
            confirmNewPassword: "",
        });
        resetPwErrors();
        setPwSuccess("");
        setEditingPw(false);
        resetPwVisible();
    };

    const avatarSrc =
        resolveAvatar(profileDraft.avatar) &&
        `${resolveAvatar(profileDraft.avatar)}${
            profileDraft.avatar.includes("?") ? "&" : "?"
        }v=${avatarBust}`;

    return (
        <div className="profile-page">
            <div className="profile-shell">
                <div className="profile-head">
                    <div className="profile-head-left">
                        <h1 className="profile-title">Account</h1>
                        <p className="profile-subtitle">
                            Manage your profile settings • Role:{" "}
                            <b className="profile-role">{role || "unknown"}</b>
                            {isCenter ? "" : ""}
                        </p>
                    </div>
                </div>

                {msg.text && (
                    <div className={`profile-toast ${msg.type}`}>
                        <b>{msg.type === "error" ? "Error: " : "Success: "}</b>
                        {msg.text}
                    </div>
                )}

                <section className="profile-card">
                    <div className="profile-card-head">
                        <h2 className="profile-card-title">
                            Basic Information
                        </h2>

                        {!editingProfile && (
                            <button
                                className="profile-outline-btn"
                                type="button"
                                onClick={() => {
                                    setMsg({ type: "", text: "" });
                                    setEditingProfile(true);
                                }}
                            >
                                Edit
                            </button>
                        )}
                    </div>

                    <div className="profile-avatar-center">
                        <img
                            className="profile-avatar"
                            src={avatarSrc || FALLBACK_AVATAR}
                            alt="avatar"
                            onError={(e) => {
                                if (
                                    e.currentTarget.src.endsWith(
                                        FALLBACK_AVATAR,
                                    )
                                ) {
                                    return;
                                }
                                e.currentTarget.src = FALLBACK_AVATAR;
                            }}
                        />

                        <label
                            className={`profile-primary-btn ${
                                !editingProfile
                                    ? "profile-btn-disabledLike"
                                    : ""
                            }`}
                        >
                            <input
                                type="file"
                                accept="image/*"
                                disabled={!editingProfile || savingAvatar}
                                style={{ display: "none" }}
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    await onPickAvatar(file);
                                    e.target.value = "";
                                }}
                            />
                            {savingAvatar ? "Uploading..." : "Change avatar"}
                        </label>

                        <div className="profile-hint">
                            JPG/PNG/WEBP recommended • Max 3MB
                        </div>
                    </div>

                    <div className="profile-grid">
                        <div className="profile-field">
                            <label className="profile-label">Name</label>
                            <input
                                className="profile-input"
                                value={profileDraft.fullName}
                                disabled={!editingProfile}
                                onChange={(e) =>
                                    setProfileDraft((p) => ({
                                        ...p,
                                        fullName: e.target.value,
                                    }))
                                }
                                placeholder="Your name"
                            />
                        </div>

                        <div className="profile-field">
                            <label className="profile-label">Email</label>
                            <input
                                className="profile-input readOnly"
                                value={profileDraft.email}
                                readOnly
                            />
                        </div>

                        <div className="profile-field">
                            <label className="profile-label">Gender</label>
                            <select
                                className="profile-input"
                                value={profileDraft.gender}
                                disabled={!editingProfile}
                                onChange={(e) =>
                                    setProfileDraft((p) => ({
                                        ...p,
                                        gender: e.target.value,
                                    }))
                                }
                            >
                                <option value="">Select</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div className="profile-field">
                            <label className="profile-label">
                                Date of Birth
                            </label>
                            <input
                                type="text"
                                className="profile-input"
                                value={profileDraft.dob}
                                disabled={!editingProfile}
                                onChange={(e) =>
                                    setProfileDraft((p) => ({
                                        ...p,
                                        dob: e.target.value,
                                    }))
                                }
                                placeholder="DD/MM/YYYY"
                                inputMode="numeric"
                            />
                        </div>

                        <div className="profile-field">
                            <label className="profile-label">
                                Language / Speciality
                            </label>
                            <input
                                className="profile-input"
                                value={profileDraft.languageOrSpeciality}
                                disabled={!editingProfile}
                                onChange={(e) =>
                                    setProfileDraft((p) => ({
                                        ...p,
                                        languageOrSpeciality: e.target.value,
                                    }))
                                }
                                placeholder="e.g., English, IELTS, Math..."
                            />
                        </div>
                    </div>

                    {editingProfile && (
                        <div className="profile-card-footer">
                            <button
                                className="profile-cancel-btn"
                                type="button"
                                onClick={onCancelProfile}
                                disabled={savingProfile || savingAvatar}
                            >
                                Cancel
                            </button>

                            <button
                                className="profile-primary-btn"
                                onClick={onSaveProfile}
                                disabled={savingProfile}
                                type="button"
                            >
                                {savingProfile ? "Saving..." : "Save"}
                            </button>
                        </div>
                    )}
                </section>

                <section className="profile-card">
                    <div className="profile-card-head">
                        <h2 className="profile-card-title">Change Password</h2>

                        {!editingPw && (
                            <button
                                className="profile-outline-btn"
                                type="button"
                                onClick={() => {
                                    resetPwErrors();
                                    setPwSuccess("");
                                    setEditingPw(true);
                                }}
                            >
                                Change
                            </button>
                        )}
                    </div>

                    <div className="profile-grid three">
                        <div className="profile-field">
                            <label className="profile-label">
                                Current password
                            </label>

                            <div className="profile-input-wrap">
                                <input
                                    className={`profile-input profile-input-hasIcon ${
                                        pwErrors.currentPassword
                                            ? "profile-input-error"
                                            : ""
                                    }`}
                                    type={
                                        pwVisible.current ? "text" : "password"
                                    }
                                    disabled={!editingPw}
                                    value={pwDraft.currentPassword}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setPwDraft((p) => ({
                                            ...p,
                                            currentPassword: value,
                                        }));
                                        setPwErrors((prev) => ({
                                            ...prev,
                                            currentPassword: "",
                                        }));
                                        setPwSuccess("");
                                    }}
                                    placeholder="Current password"
                                    autoComplete="current-password"
                                />

                                <button
                                    type="button"
                                    className="profile-eye-btn"
                                    disabled={!editingPw}
                                    onClick={() =>
                                        setPwVisible((v) => ({
                                            ...v,
                                            current: !v.current,
                                        }))
                                    }
                                >
                                    {pwVisible.current ? (
                                        <i className="fa-solid fa-eye-slash" />
                                    ) : (
                                        <i className="fa-solid fa-eye" />
                                    )}
                                </button>
                            </div>

                            {pwErrors.currentPassword && (
                                <div className="profile-field-error">
                                    {pwErrors.currentPassword}
                                </div>
                            )}
                        </div>

                        <div className="profile-field">
                            <label className="profile-label">
                                New password
                            </label>

                            <div className="profile-input-wrap">
                                <input
                                    className={`profile-input profile-input-hasIcon ${
                                        pwErrors.newPassword
                                            ? "profile-input-error"
                                            : ""
                                    }`}
                                    type={pwVisible.new ? "text" : "password"}
                                    disabled={!editingPw}
                                    value={pwDraft.newPassword}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setPwDraft((p) => ({
                                            ...p,
                                            newPassword: value,
                                        }));

                                        setPwErrors((prev) => ({
                                            ...prev,
                                            newPassword: "",
                                            confirmNewPassword:
                                                pwDraft.confirmNewPassword &&
                                                value !==
                                                    pwDraft.confirmNewPassword
                                                    ? "Confirm password does not match"
                                                    : "",
                                        }));
                                        setPwSuccess("");
                                    }}
                                    placeholder="New password"
                                    autoComplete="new-password"
                                />

                                <button
                                    type="button"
                                    className="profile-eye-btn"
                                    disabled={!editingPw}
                                    onClick={() =>
                                        setPwVisible((v) => ({
                                            ...v,
                                            new: !v.new,
                                        }))
                                    }
                                >
                                    {pwVisible.new ? (
                                        <i className="fa-solid fa-eye-slash" />
                                    ) : (
                                        <i className="fa-solid fa-eye" />
                                    )}
                                </button>
                            </div>

                            {pwErrors.newPassword && (
                                <div className="profile-field-error">
                                    {pwErrors.newPassword}
                                </div>
                            )}
                        </div>

                        <div className="profile-field">
                            <label className="profile-label">
                                Confirm new password
                            </label>

                            <div className="profile-input-wrap">
                                <input
                                    className={`profile-input profile-input-hasIcon ${
                                        pwErrors.confirmNewPassword
                                            ? "profile-input-error"
                                            : ""
                                    }`}
                                    type={
                                        pwVisible.confirm ? "text" : "password"
                                    }
                                    disabled={!editingPw}
                                    value={pwDraft.confirmNewPassword}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setPwDraft((p) => ({
                                            ...p,
                                            confirmNewPassword: value,
                                        }));

                                        setPwErrors((prev) => ({
                                            ...prev,
                                            confirmNewPassword:
                                                value &&
                                                pwDraft.newPassword !== value
                                                    ? "Confirm password does not match"
                                                    : "",
                                        }));
                                        setPwSuccess("");
                                    }}
                                    placeholder="Confirm new password"
                                    autoComplete="new-password"
                                />

                                <button
                                    type="button"
                                    className="profile-eye-btn"
                                    disabled={!editingPw}
                                    onClick={() =>
                                        setPwVisible((v) => ({
                                            ...v,
                                            confirm: !v.confirm,
                                        }))
                                    }
                                >
                                    {pwVisible.confirm ? (
                                        <i className="fa-solid fa-eye-slash" />
                                    ) : (
                                        <i className="fa-solid fa-eye" />
                                    )}
                                </button>
                            </div>

                            {pwErrors.confirmNewPassword && (
                                <div className="profile-field-error">
                                    {pwErrors.confirmNewPassword}
                                </div>
                            )}

                            {!pwErrors.confirmNewPassword && pwSuccess && (
                                <div className="profile-field-success">
                                    {pwSuccess}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="profile-hint">
                        Password should be at least 8 characters.
                    </div>

                    {editingPw && (
                        <div className="profile-card-footer">
                            <button
                                className="profile-cancel-btn"
                                type="button"
                                onClick={onCancelPw}
                                disabled={savingPw}
                            >
                                Cancel
                            </button>

                            <button
                                className="profile-primary-btn"
                                onClick={onSavePassword}
                                disabled={!canSavePw}
                                type="button"
                            >
                                {savingPw ? "Updating..." : "Save"}
                            </button>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
