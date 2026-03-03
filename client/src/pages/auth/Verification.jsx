// src/page/auth/Verification.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./auth.css";

export default function Verification() {
    const nav = useNavigate();
    const [code, setCode] = useState("");

    const onSubmit = (e) => {
        e.preventDefault();
        nav("/workspace");
    };

    return (
        <>
            <h2 className="auth-title">Verification</h2>
            <p className="auth-subtitle">Enter the code sent to your email</p>

            <form className="auth-form" onSubmit={onSubmit}>
                <div className="auth-field">
                    <label className="auth-label">Verification Code</label>
                    <div className="auth-input-wrap">
                        <span className="auth-input-icon">
                            <i className="fa-solid fa-key"></i>
                        </span>
                        <input
                            type="text"
                            name="code"
                            placeholder="Enter verification code"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="auth-input"
                        />
                    </div>
                </div>

                <button
                    className="auth-btn"
                    type="submit"
                    disabled={code.trim().length < 4}
                >
                    Verify
                </button>

                <div className="auth-footer">
                    <Link className="auth-link" to="/auth/sign-in">
                        Back to Sign In
                    </Link>
                </div>
            </form>
        </>
    );
}
