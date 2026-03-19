import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/auth/AuthContext";
import "./auth.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useTranslation } from "react-i18next";

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function SignIn() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { login } = useAuth();

    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [errors, setErrors] = useState({});
    const [inputs, setInputs] = useState({ email: "", password: "" });

    const focusFirstError = (errs) => {
        const order = ["email", "password"];
        const firstKey = order.find((k) => errs[k]);
        if (!firstKey) return;

        const el = document.querySelector(`[name="${firstKey}"]`);
        if (el) {
            el.focus();
            el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    };

    const onChange = (e) => {
        const { name, value } = e.target;
        setInputs((p) => ({ ...p, [name]: value }));
        setErrors((p) => ({ ...p, [name]: "", serverError: "" }));
    };

    const validateInputs = () => {
        const errs = {};
        const email = inputs.email.trim().toLowerCase();

        if (!email) errs.email = t("auth.signIn.errorEmailRequired");
        else if (!isValidEmail(email))
            errs.email = t("auth.signIn.errorEmailInvalid");

        if (!inputs.password)
            errs.password = t("auth.signIn.errorPasswordRequired");

        return errs;
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        if (isLoading) return;

        const validationErrors = validateInputs();
        if (Object.keys(validationErrors).length) {
            setErrors(validationErrors);
            focusFirstError(validationErrors);
            return;
        }

        setIsLoading(true);
        try {
            const email = inputs.email.trim().toLowerCase();
            const password = inputs.password;

            const result = await login(email, password);

            if (!result?.success) {
                const errs = {
                    password: t("auth.signIn.errorInvalidCredentials"),
                };
                setErrors(errs);
                focusFirstError(errs);
                return;
            }

            navigate("/workspace");
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                err?.message ||
                t("auth.signIn.errorInvalidCredentials");

            const errs = { password: msg };
            setErrors(errs);
            focusFirstError(errs);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <h2 className="auth-title">{t("auth.signIn.title")}</h2>
            <p className="auth-subtitle">{t("auth.signIn.subtitle")}</p>

            <form className="auth-form" onSubmit={onSubmit}>
                {/* EMAIL */}
                <div className="auth-field">
                    <label className="auth-label">
                        {t("auth.signIn.email")}
                    </label>

                    <div className="auth-input-wrap">
                        <span className="auth-input-icon">
                            <i className="fa-solid fa-envelope" />
                        </span>

                        <input
                            type="email"
                            name="email"
                            placeholder={t("auth.signIn.emailPlaceholder")}
                            value={inputs.email}
                            onChange={onChange}
                            className={`auth-input ${
                                errors.email ? "error" : ""
                            }`}
                            autoComplete="email"
                            disabled={isLoading}
                        />
                    </div>

                    <p className={`auth-error ${errors.email ? "show" : ""}`}>
                        {errors.email}
                    </p>
                </div>

                {/* PASSWORD */}
                <div className="auth-field">
                    <label className="auth-label">
                        {t("auth.signIn.password")}
                    </label>

                    <div className="auth-input-wrap">
                        <span className="auth-input-icon">
                            <i className="fa-solid fa-lock" />
                        </span>

                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder={t("auth.signIn.passwordPlaceholder")}
                            value={inputs.password}
                            onChange={onChange}
                            className={`auth-input ${
                                errors.password ? "error" : ""
                            }`}
                            autoComplete="current-password"
                            disabled={isLoading}
                        />

                        <button
                            type="button"
                            className="auth-eye-btn"
                            onClick={() => setShowPassword((v) => !v)}
                            aria-label={t("auth.signIn.togglePassword")}
                            disabled={isLoading}
                        >
                            {showPassword ? (
                                <i className="fa-solid fa-eye-slash" />
                            ) : (
                                <i className="fa-solid fa-eye" />
                            )}
                        </button>
                    </div>

                    <p
                        className={`auth-error ${
                            errors.password ? "show" : ""
                        }`}
                    >
                        {errors.password}
                    </p>
                </div>

                <div className="auth-row">
                    <span />
                    <Link className="auth-link" to="/auth/forgot-password">
                        {t("auth.signIn.forgot")}
                    </Link>
                </div>

                <button className="auth-btn" type="submit" disabled={isLoading}>
                    {isLoading
                        ? t("auth.signIn.signing")
                        : t("auth.signIn.signInBtn")}
                </button>

                <div className="auth-footer">
                    <span>{t("auth.signIn.newUser")}</span>
                    <Link className="auth-link" to="/auth/signup">
                        {t("auth.signIn.createAccount")}
                    </Link>
                </div>
            </form>
        </>
    );
}
