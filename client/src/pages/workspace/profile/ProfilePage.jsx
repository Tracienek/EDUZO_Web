// src/pages/workspace/profile/ProfilePage.jsx
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
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
    const { t } = useTranslation();
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

    const canSavePw = editingPw && isPwFilled && !savingPw;

    const onSaveProfile = async () => {
        setMsg({ type: "", text: "" });

        if (!profileDraft.fullName.trim()) {
            return toast("error", t("profile.nameRequired"));
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
            toast("success", t("profile.profileUpdated"));
            setEditingProfile(false);
        } catch (e) {
            const status = e?.response?.status;
            const serverMsg = e?.response?.data?.message;

            if (status === 401) {
                toast("error", t("profile.unauthorized"));
            } else {
                toast("error", serverMsg || t("profile.updateProfileFailed"));
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
            return toast("error", t("profile.avatarMaxSize", { size: maxMB }));
        }

        const okTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!okTypes.includes(file.type)) {
            return toast("error", t("profile.avatarTypeInvalid"));
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
            toast("success", t("profile.avatarUpdated"));
        } catch (e) {
            const status = e?.response?.status;
            const serverMsg = e?.response?.data?.message;

            if (status === 404) {
                toast("error", t("profile.avatarEndpointNotFound"));
            } else if (status === 401) {
                toast("error", t("profile.unauthorized"));
            } else {
                toast("error", serverMsg || t("profile.updateAvatarFailed"));
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
            nextErrors.currentPassword = t("profile.currentPasswordRequired");
            hasError = true;
        }

        if (!pwDraft.newPassword) {
            nextErrors.newPassword = t("profile.newPasswordRequired");
            hasError = true;
        } else if (pwDraft.newPassword.length < 8) {
            nextErrors.newPassword = t("profile.passwordMin");
            hasError = true;
        }

        if (!pwDraft.confirmNewPassword) {
            nextErrors.confirmNewPassword = t(
                "profile.confirmPasswordRequired",
            );
            hasError = true;
        } else if (pwDraft.newPassword !== pwDraft.confirmNewPassword) {
            nextErrors.confirmNewPassword = t(
                "profile.confirmPasswordMismatch",
            );
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
            setPwSuccess(t("profile.passwordChanged"));

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
                    currentPassword: t("profile.unauthorized"),
                }));
            } else if (
                normalizedMsg.includes("current password") &&
                (normalizedMsg.includes("incorrect") ||
                    normalizedMsg.includes("invalid") ||
                    normalizedMsg.includes("wrong"))
            ) {
                setPwErrors((prev) => ({
                    ...prev,
                    currentPassword: t("profile.currentPasswordIncorrect"),
                }));
            } else {
                setPwErrors((prev) => ({
                    ...prev,
                    confirmNewPassword:
                        serverMsg || t("profile.changePasswordFailed"),
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
                        <h1 className="profile-title">
                            {t("profile.account")}
                        </h1>
                        <p className="profile-subtitle">
                            {t("profile.manageSettings")} • {t("profile.role")}:{" "}
                            <b className="profile-role">
                                {role || t("profile.unknown")}
                            </b>
                            {isCenter ? "" : ""}
                        </p>
                    </div>
                </div>

                {msg.text && (
                    <div className={`profile-toast ${msg.type}`}>
                        <b>
                            {msg.type === "error"
                                ? t("profile.errorPrefix")
                                : t("profile.successPrefix")}
                        </b>
                        {msg.text}
                    </div>
                )}

                <section className="profile-card">
                    <div className="profile-card-head">
                        <h2 className="profile-card-title">
                            {t("profile.basicInformation")}
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
                                {t("profile.edit")}
                            </button>
                        )}
                    </div>

                    <div className="profile-avatar-center">
                        <img
                            className="profile-avatar"
                            src={avatarSrc || FALLBACK_AVATAR}
                            alt={t("profile.avatarAlt")}
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
                            {savingAvatar
                                ? t("profile.uploading")
                                : t("profile.changeAvatar")}
                        </label>

                        <div className="profile-hint">
                            {t("profile.avatarHint")}
                        </div>
                    </div>

                    <div className="profile-grid">
                        <div className="profile-field">
                            <label className="profile-label">
                                {t("profile.name")}
                            </label>
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
                                placeholder={t("profile.namePlaceholder")}
                            />
                        </div>

                        <div className="profile-field">
                            <label className="profile-label">
                                {t("profile.email")}
                            </label>
                            <input
                                className="profile-input readOnly"
                                value={profileDraft.email}
                                readOnly
                            />
                        </div>

                        <div className="profile-field">
                            <label className="profile-label">
                                {t("profile.gender")}
                            </label>
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
                                <option value="">{t("profile.select")}</option>
                                <option value="male">
                                    {t("profile.male")}
                                </option>
                                <option value="female">
                                    {t("profile.female")}
                                </option>
                                <option value="other">
                                    {t("profile.other")}
                                </option>
                            </select>
                        </div>

                        <div className="profile-field">
                            <label className="profile-label">
                                {t("profile.dateOfBirth")}
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
                                placeholder={t("profile.dobPlaceholder")}
                                inputMode="numeric"
                            />
                        </div>

                        <div className="profile-field">
                            <label className="profile-label">
                                {t("profile.languageOrSpeciality")}
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
                                placeholder={t(
                                    "profile.languageOrSpecialityPlaceholder",
                                )}
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
                                {t("profile.cancel")}
                            </button>

                            <button
                                className="profile-primary-btn"
                                onClick={onSaveProfile}
                                disabled={savingProfile}
                                type="button"
                            >
                                {savingProfile
                                    ? t("profile.saving")
                                    : t("profile.save")}
                            </button>
                        </div>
                    )}
                </section>

                <section className="profile-card">
                    <div className="profile-card-head">
                        <h2 className="profile-card-title">
                            {t("profile.changePassword")}
                        </h2>

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
                                {t("profile.change")}
                            </button>
                        )}
                    </div>

                    <div className="profile-grid three">
                        <div className="profile-field">
                            <label className="profile-label">
                                {t("profile.currentPassword")}
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
                                    placeholder={t(
                                        "profile.currentPasswordPlaceholder",
                                    )}
                                    autoComplete="current-password"
                                />

                                <button
                                    type="button"
                                    className="profile-eye-btn"
                                    disabled={!editingPw}
                                    aria-label={t("profile.togglePassword")}
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
                                {t("profile.newPassword")}
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
                                                    ? t(
                                                          "profile.confirmPasswordMismatch",
                                                      )
                                                    : "",
                                        }));
                                        setPwSuccess("");
                                    }}
                                    placeholder={t(
                                        "profile.newPasswordPlaceholder",
                                    )}
                                    autoComplete="new-password"
                                />

                                <button
                                    type="button"
                                    className="profile-eye-btn"
                                    disabled={!editingPw}
                                    aria-label={t("profile.togglePassword")}
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
                                {t("profile.confirmNewPassword")}
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
                                                    ? t(
                                                          "profile.confirmPasswordMismatch",
                                                      )
                                                    : "",
                                        }));
                                        setPwSuccess("");
                                    }}
                                    placeholder={t(
                                        "profile.confirmNewPasswordPlaceholder",
                                    )}
                                    autoComplete="new-password"
                                />

                                <button
                                    type="button"
                                    className="profile-eye-btn"
                                    disabled={!editingPw}
                                    aria-label={t("profile.togglePassword")}
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
                        {t("profile.passwordHint")}
                    </div>

                    {editingPw && (
                        <div className="profile-card-footer">
                            <button
                                className="profile-cancel-btn"
                                type="button"
                                onClick={onCancelPw}
                                disabled={savingPw}
                            >
                                {t("profile.cancel")}
                            </button>

                            <button
                                className="profile-primary-btn"
                                onClick={onSavePassword}
                                disabled={!canSavePw}
                                type="button"
                            >
                                {savingPw
                                    ? t("profile.updating")
                                    : t("profile.save")}
                            </button>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
