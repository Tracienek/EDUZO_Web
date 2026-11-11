// src/page/auth/AuthLayout.jsx
import { Outlet } from "react-router-dom";
import "../../pages/auth/auth.css";
import logo from "../../assets/images/logo.png";

export default function AuthLayout() {
    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-brand">
                    <span className="auth-brand-text">EDUZO</span>
                    <img
                        src={logo}
                        alt="EDUZO logo"
                        className="auth-brand-logo"
                    />
                </div>

                <div className="auth-card">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
