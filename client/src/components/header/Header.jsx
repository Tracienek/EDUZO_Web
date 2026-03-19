import "./header.css";
import { Link, NavLink } from "react-router-dom";
import { HashLink } from "react-router-hash-link";
import logo from "../../assets/images/logo.png";
import { useTranslation } from "react-i18next";

const Header = () => {
    const { t } = useTranslation();
    const i18n = useTranslation().i18n;

    return (
        <header className="lp-header">
            <div className="lp-container">
                <div className="lp-nav">
                    <Link
                        to="/"
                        className="lp-brand"
                        aria-label={t("header.homeAria")}
                    >
                        <img
                            src={logo}
                            alt={t("header.logoAlt")}
                            className="lp-brand-badge"
                        />
                        <span className="lp-brand-text">EDUZO</span>
                    </Link>

                    <nav
                        className="lp-links-wrap"
                        aria-label={t("header.navAria")}
                    >
                        <NavLink
                            to="/"
                            className={({ isActive }) =>
                                `lp-links ${isActive ? "active" : ""}`
                            }
                        >
                            {t("header.home")}
                        </NavLink>

                        <HashLink smooth to="/#about" className="lp-links">
                            {t("header.about")}
                        </HashLink>

                        <NavLink
                            to="/services"
                            className={({ isActive }) =>
                                `lp-links ${isActive ? "active" : ""}`
                            }
                        >
                            {t("header.services")}
                        </NavLink>
                    </nav>

                    <div className="lp-actions">
                        <NavLink
                            to="/auth/signIn"
                            className={({ isActive }) =>
                                `lp-links ${isActive ? "active" : ""}`
                            }
                        >
                            {t("header.signIn")}
                        </NavLink>

                        <Link className="lp-action-btn" to="/auth/signUp">
                            {t("header.startTrial")}
                        </Link>
                    </div>

                    <div
                        className="lp-lang-switch"
                        aria-label="Language switcher"
                    >
                        <button
                            type="button"
                            className={`lp-lang-btn ${i18n.language === "vi" ? "active" : ""}`}
                            onClick={() => i18n.changeLanguage("vi")}
                        >
                            VI
                        </button>

                        <button
                            type="button"
                            className={`lp-lang-btn ${i18n.language === "en" ? "active" : ""}`}
                            onClick={() => i18n.changeLanguage("en")}
                        >
                            EN
                        </button>

                        <button
                            type="button"
                            className={`lp-lang-btn ${i18n.language === "zh" ? "active" : ""}`}
                            onClick={() => i18n.changeLanguage("zh")}
                        >
                            中文
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
