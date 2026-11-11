import "./footer.css";
import { Link } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import { useTranslation } from "react-i18next";

const Footer = () => {
    const { t } = useTranslation();

    return (
        <footer className="lp-footer">
            <div className="lp-container">
                <div className="lp-footer-line" />
                <div className="lp-footer-inner">
                    <div className="lp-footer-brand">
                        <img
                            src={logo}
                            alt={t("footer.logoAlt")}
                            className="lp-footer-logo"
                        />
                        <div className="lp-footer-socials">
                            <a href="#" aria-label="Facebook">
                                <i className="fa-brands fa-facebook" />
                            </a>
                            <a href="#" aria-label="Instagram">
                                <i className="fa-brands fa-square-instagram" />
                            </a>
                            <a href="#" aria-label="Github">
                                <i className="fa-brands fa-github" />
                            </a>
                        </div>
                    </div>

                    <div className="lp-footer-cols">
                        <div className="lp-footer-col">
                            <h4>{t("footer.legal")}</h4>
                            <p>{t("footer.legalDesc")}</p>
                        </div>
                        <div className="lp-footer-col">
                            <h4>{t("footer.developers")}</h4>
                            <p>{t("footer.devName")}</p>
                        </div>
                        <div className="lp-footer-col">
                            <h4>{t("footer.help")}</h4>
                            <p>{t("footer.helpDesc")}</p>
                        </div>
                        <div className="lp-footer-col">
                            <h4>{t("footer.address")}</h4>
                            <p>{t("footer.addressDesc")}</p>
                        </div>
                    </div>
                </div>

                <div className="lp-copyright">{t("footer.copyright")}</div>
            </div>
        </footer>
    );
};

export default Footer;
