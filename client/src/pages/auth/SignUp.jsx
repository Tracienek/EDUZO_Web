// src/pages/auth/SignUp.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiUtils, tokenStore } from "../../utils/newRequest";
import { useAuth } from "../../context/auth/AuthContext";
import "@fortawesome/fontawesome-free/css/all.min.css";

const unwrap = (res) => {
    const root = res?.data ?? res;
    return root?.data ?? root;
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function SignUp() {
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

        if (!inputs.fullName.trim())
            errs.fullName = "Please enter your full name";

        if (!email) errs.email = "Please enter your email";
        else if (!isValidEmail(email)) errs.email = "Invalid email format";

        if (!inputs.password) errs.password = "Please enter a password";
        else if (inputs.password.length < 8)
            errs.password = "Password must be at least 8 characters";

        if (!inputs.confirmPassword)
            errs.confirmPassword = "Please confirm your password";
        else if (inputs.confirmPassword !== inputs.password)
            errs.confirmPassword = "Passwords do not match";

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
                "Registration failed. Try again.";

            const errs = { email: msg };
            setErrors(errs);
            focusFirstError(errs);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <h2 className="auth-title">Sign Up</h2>
            <p className="auth-subtitle">Create your center account</p>

            <form className="auth-form" onSubmit={onSubmit}>
                {/* FULL NAME */}
                <div className="auth-field">
                    <label className="auth-label">Full Name</label>
                    <div className="auth-input-wrap">
                        <span className="auth-input-icon">
                            <i className="fa-solid fa-user" />
                        </span>
                        <input
                            type="text"
                            name="fullName"
                            placeholder="Enter your full name"
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

                {/* EMAIL */}
                <div className="auth-field">
                    <label className="auth-label">Email</label>
                    <div className="auth-input-wrap">
                        <span className="auth-input-icon">
                            <i className="fa-solid fa-envelope" />
                        </span>
                        <input
                            type="email"
                            name="email"
                            placeholder="Enter your email"
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

                {/* PASSWORD */}
                <div className="auth-field">
                    <label className="auth-label">Password</label>
                    <div className="auth-input-wrap">
                        <span className="auth-input-icon">
                            <i className="fa-solid fa-lock" />
                        </span>
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder="Enter your password"
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
                            aria-label="Toggle password visibility"
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

                {/* CONFIRM PASSWORD */}
                <div className="auth-field">
                    <label className="auth-label">Confirm Password</label>
                    <div className="auth-input-wrap">
                        <span className="auth-input-icon">
                            <i className="fa-solid fa-lock" />
                        </span>
                        <input
                            type={showPassword ? "text" : "password"}
                            name="confirmPassword"
                            placeholder="Confirm your password"
                            value={inputs.confirmPassword}
                            onChange={onChange}
                            className={`auth-input ${
                                errors.confirmPassword ? "error" : ""
                            }`}
                            autoComplete="new-password"
                            disabled={isLoading}
                        />
                    </div>
                    <p
                        className={`auth-error ${errors.confirmPassword ? "show" : ""}`}
                    >
                        {errors.confirmPassword}
                    </p>
                </div>

                <button className="auth-btn" type="submit" disabled={isLoading}>
                    {isLoading ? "Signing Up..." : "Sign Up"}
                </button>

                <div className="auth-footer">
                    <span>Already have an account? </span>
                    <Link className="auth-link" to="/auth/signIn">
                        Sign in
                    </Link>
                </div>
            </form>
        </>
    );
}
