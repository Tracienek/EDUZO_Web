import "./header.css";
import { Link } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import { HashLink } from "react-router-hash-link";

const Header = () => {
    return (
        <header className="lp-header">
            <div className="lp-container">
                <div className="lp-nav">
                    <Link to="/" className="lp-brand">
                        <img
                            src={logo}
                            alt="Eduzo logo"
                            className="lp-brand-badge"
                        />
                        <span className="lp-brand-text">EDUZO</span>
                    </Link>
                    <nav className="lp-links-wrap">
                        <Link to="/" className="lp-links">
                            Home
                        </Link>
                        <HashLink smooth to="/#about" className="lp-links">
                            About us
                        </HashLink>
                        <Link to="/services" className="lp-links">
                            Services
                        </Link>
                    </nav>

                    <div className="lp-actions">
                        <Link className="lp-links" to="/auth/signIn">
                            Sign in
                        </Link>
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
