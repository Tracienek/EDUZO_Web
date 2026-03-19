import "./auth.css";
import { Link } from "react-router-dom";
import { useState } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useTranslation } from "react-i18next";

export default function ForgotPassword() {
    const { t } = useTranslation();

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        const trimmed = email.trim();
        if (!trimmed) {
            setError(t("auth.forgot.errorEmpty"));
            return;
        }

        try {
            setLoading(true);
            await sendPasswordResetEmail(auth, trimmed);

            setSuccess(t("auth.forgot.success"));
            setEmail("");
        } catch (err) {
            setSuccess(t("auth.forgot.success"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <h1 className="auth-title">{t("auth.forgot.title")}</h1>

            <p className="auth-subtitle">{t("auth.forgot.subtitle")}</p>

            {error ? (
                <div className="auth-alert auth-alert--error" role="alert">
                    <span className="auth-alert__icon">
                        <i className="fa-solid fa-triangle-exclamation" />
                    </span>
                    <span className="auth-alert__text">{error}</span>
                </div>
            ) : null}

            {success ? (
                <div className="auth-alert auth-alert--success" role="status">
                    <span className="auth-alert__icon">
                        <i className="fa-solid fa-circle-check" />
                    </span>
                    <span className="auth-alert__text">{success}</span>
                </div>
            ) : null}

            <form className="auth-form" onSubmit={handleSubmit}>
                <label className="auth-label">
                    {t("auth.forgot.emailLabel")}
                </label>

                <div className="auth-input-wrap">
                    <span className="auth-input-icon">
                        <i className="fa-solid fa-envelope" />
                    </span>

                    <input
                        className="auth-input"
                        type="email"
                        placeholder={t("auth.forgot.emailPlaceholder")}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        disabled={loading}
                    />
                </div>

                <button className="auth-btn" type="submit" disabled={loading}>
                    {loading
                        ? t("auth.forgot.sending")
                        : t("auth.forgot.sendBtn")}
                </button>
            </form>

            <div className="auth-footer">
                <span>{t("auth.forgot.remember")}</span>{" "}
                <Link to="/auth/signIn" className="auth-link">
                    {t("auth.forgot.backToSignIn")}
                </Link>
            </div>
        </>
    );
}
