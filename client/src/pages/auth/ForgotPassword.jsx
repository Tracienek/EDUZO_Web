import "./auth.css";
import { Link } from "react-router-dom";
import { useState } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";

export default function ForgotPassword() {
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
            setError("Please enter your email.");
            return;
        }

        try {
            setLoading(true);
            await sendPasswordResetEmail(auth, trimmed);

            setSuccess(
                "If an account exists for this email, a reset link has been sent. Please check your inbox.",
            );
            setEmail("");
        } catch (err) {
            // không leak email tồn tại hay không
            setSuccess(
                "If an account exists for this email, a reset link has been sent. Please check your inbox.",
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <h1 className="auth-title">Forgot Password</h1>
            <p className="auth-subtitle">
                Enter your email and we’ll send you a reset link.
            </p>

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
                <label className="auth-label">Email</label>

                <div className="auth-input-wrap">
                    <span className="auth-input-icon">
                        <i className="fa-solid fa-envelope" />
                    </span>

                    <input
                        className="auth-input"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        disabled={loading}
                    />
                </div>

                <button className="auth-btn" type="submit" disabled={loading}>
                    {loading ? "Sending..." : "Send reset link"}
                </button>
            </form>

            <div className="auth-footer">
                <span>Remember your password?</span>{" "}
                <Link to="/auth/signIn" className="auth-link">
                    Back to Sign in
                </Link>
            </div>
        </>
    );
}
