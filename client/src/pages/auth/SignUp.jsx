import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiUtils, tokenStore } from "../../utils/newRequest";
import { useAuth } from "../../context/auth/AuthContext";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useTranslation } from "react-i18next";

const unwrap = (res) => {
    const root = res?.data ?? res;
    return root?.data ?? root;
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function SignUp() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { loadUserMe } = useAuth();

    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [errors, setErrors] = useState({});
    const [inputs, setInputs] = useState({
        email: "",
        fullName: "",
        password: "",
        confirmPassword: "",
    });

    const focusFirstError = (errs) => {
        const order = ["fullName", "email", "password", "confirmPassword"];
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

        if (!inputs.fullName.trim()) {
            errs.fullName = t("auth.signUp.errorFullNameRequired");
        }

        if (!email) errs.email = t("auth.signUp.errorEmailRequired");
        else if (!isValidEmail(email)) {
            errs.email = t("auth.signUp.errorEmailInvalid");
        }

        if (!inputs.password) {
            errs.password = t("auth.signUp.errorPasswordRequired");
        } else if (inputs.password.length < 8) {
            errs.password = t("auth.signUp.errorPasswordMin");
        }

        if (!inputs.confirmPassword) {
            errs.confirmPassword = t(
                "auth.signUp.errorConfirmPasswordRequired",
            );
        } else if (inputs.confirmPassword !== inputs.password) {
            errs.confirmPassword = t("auth.signUp.errorPasswordMismatch");
        }

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
            const payload = {
                email: inputs.email.trim().toLowerCase(),
                fullName: inputs.fullName.trim(),
                password: inputs.password,
            };

            const res = await apiUtils.post("/auth/signUp", payload);
            const data = unwrap(res);

            const token = data?.accessToken || data?.token;
            if (token) tokenStore.set(token);

            await loadUserMe();
            navigate("/auth/signIn");
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                err?.message ||
                t("auth.signUp.errorRegisterFailed");

            const errs = { email: msg };
            setErrors(errs);
            focusFirstError(errs);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <h2 className="auth-title">{t("auth.signUp.title")}</h2>
            <p className="auth-subtitle">{t("auth.signUp.subtitle")}</p>

            <form className="auth-form" onSubmit={onSubmit}>
                <div className="auth-field">
                    <label className="auth-label">
                        {t("auth.signUp.fullName")}
                    </label>
                    <div className="auth-input-wrap">
                        <span className="auth-input-icon">
                            <i className="fa-solid fa-user" />
                        </span>
                        <input
                            type="text"
                            name="fullName"
                            placeholder={t("auth.signUp.fullNamePlaceholder")}
                            value={inputs.fullName}
                            onChange={onChange}
                            className={`auth-input ${errors.fullName ? "error" : ""}`}
                            autoComplete="name"
                            disabled={isLoading}
                        />
                    </div>
                    <p
                        className={`auth-error ${errors.fullName ? "show" : ""}`}
                    >
                        {errors.fullName}
                    </p>
                </div>

                <div className="auth-field">
                    <label className="auth-label">
                        {t("auth.signUp.email")}
                    </label>
                    <div className="auth-input-wrap">
                        <span className="auth-input-icon">
                            <i className="fa-solid fa-envelope" />
                        </span>
                        <input
                            type="email"
                            name="email"
                            placeholder={t("auth.signUp.emailPlaceholder")}
                            value={inputs.email}
                            onChange={onChange}
                            className={`auth-input ${errors.email ? "error" : ""}`}
                            autoComplete="email"
                            disabled={isLoading}
                        />
                    </div>
                    <p className={`auth-error ${errors.email ? "show" : ""}`}>
                        {errors.email}
                    </p>
                </div>

                <div className="auth-field">
                    <label className="auth-label">
                        {t("auth.signUp.password")}
                    </label>
                    <div className="auth-input-wrap">
                        <span className="auth-input-icon">
                            <i className="fa-solid fa-lock" />
                        </span>
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder={t("auth.signUp.passwordPlaceholder")}
                            value={inputs.password}
                            onChange={onChange}
                            className={`auth-input ${errors.password ? "error" : ""}`}
                            autoComplete="new-password"
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            className="auth-eye-btn"
                            onClick={() => setShowPassword((v) => !v)}
                            aria-label={t("auth.signUp.togglePassword")}
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
                        className={`auth-error ${errors.password ? "show" : ""}`}
                    >
                        {errors.password}
                    </p>
                </div>

                <div className="auth-field">
                    <label className="auth-label">
                        {t("auth.signUp.confirmPassword")}
                    </label>
                    <div className="auth-input-wrap">
                        <span className="auth-input-icon">
                            <i className="fa-solid fa-lock" />
                        </span>
                        <input
                            type={showPassword ? "text" : "password"}
                            name="confirmPassword"
                            placeholder={t(
                                "auth.signUp.confirmPasswordPlaceholder",
                            )}
                            value={inputs.confirmPassword}
                            onChange={onChange}
                            className={`auth-input ${
                                errors.confirmPassword ? "error" : ""
                            }`}
                            autoComplete="new-password"
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            className="auth-eye-btn"
                            onClick={() => setShowPassword((v) => !v)}
                            aria-label={t("auth.signUp.togglePassword")}
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
                            errors.confirmPassword ? "show" : ""
                        }`}
                    >
                        {errors.confirmPassword}
                    </p>
                </div>

                <button className="auth-btn" type="submit" disabled={isLoading}>
                    {isLoading
                        ? t("auth.signUp.signingUp")
                        : t("auth.signUp.signUpBtn")}
                </button>

                <div className="auth-footer">
                    <span>{t("auth.signUp.haveAccount")}</span>
                    <Link className="auth-link" to="/auth/signIn">
                        {t("auth.signUp.signIn")}
                    </Link>
                </div>
            </form>
        </>
    );
}
