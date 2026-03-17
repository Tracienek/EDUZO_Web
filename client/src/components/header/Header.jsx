import "./header.css";
import { Link, NavLink } from "react-router-dom";
import { HashLink } from "react-router-hash-link";
import logo from "../../assets/images/logo.png";

const Header = () => {
    return (
        <header className="lp-header">
            <div className="lp-container">
                <div className="lp-nav">
                    <Link to="/" className="lp-brand" aria-label="Eduzo home">
                        <img
                            src={logo}
                            alt="Eduzo logo"
                            className="lp-brand-badge"
                        />
                        <span className="lp-brand-text">EDUZO</span>
                    </Link>

                    <nav className="lp-links-wrap" aria-label="Main navigation">
                        <NavLink
                            to="/"
                            className={({ isActive }) =>
                                `lp-links ${isActive ? "active" : ""}`
                            }
                        >
                            Home
                        </NavLink>

                        <HashLink smooth to="/#about" className="lp-links">
                            About us
                        </HashLink>

                        <NavLink
                            to="/services"
                            className={({ isActive }) =>
                                `lp-links ${isActive ? "active" : ""}`
                            }
                        >
                            Services
                        </NavLink>
                    </nav>

                    <div className="lp-actions">
                        <NavLink
                            to="/auth/signIn"
                            className={({ isActive }) =>
                                `lp-links ${isActive ? "active" : ""}`
                            }
                        >
                            Sign in
                        </NavLink>

                        <Link className="lp-action-btn" to="/auth/signUp">
                            Start free trial
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
